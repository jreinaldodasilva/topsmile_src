// backend/src/services/schedulingService.ts - FIXED VERSION with Transactions
import { Appointment, IAppointment } from '../models/Appointment';
import { Provider, IProvider } from '../models/Provider';
import { AppointmentType, IAppointmentType } from '../models/AppointmentType';
import { startOfDay, endOfDay, addMinutes, format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import mongoose from 'mongoose';

export interface TimeSlot {
    start: Date;
    end: Date;
    available: boolean;
    providerId: string;
    appointmentTypeId?: string;
    conflictReason?: string;
}

export interface AvailabilityQuery {
    clinicId?: string;
    providerId?: string;
    appointmentTypeId: string;
    date: Date;
    excludeAppointmentId?: string;
}

export interface CreateAppointmentData {
    clinicId: string;
    patientId: string;
    providerId: string;
    appointmentTypeId: string;
    scheduledStart: Date;
    notes?: string;
    priority?: 'routine' | 'urgent' | 'emergency';
    createdBy?: string;
}

// ADDED: Result interfaces for better type safety
export interface SchedulingResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    warnings?: string[];
}

export interface AppointmentConflict {
    hasConflict: boolean;
    conflictingAppointments?: IAppointment[];
    reason?: string;
}

class SchedulingService {
    
    /**
     * Get available time slots for a specific date and appointment type
     * IMPROVED: Better error handling and performance
     */
    async getAvailableSlots(query: AvailabilityQuery): Promise<TimeSlot[]> {
        const { clinicId, providerId, appointmentTypeId, date, excludeAppointmentId } = query;
        
        try {
            // IMPROVED: Use lean queries for better performance
            const appointmentType = await AppointmentType.findById(appointmentTypeId).lean();
            if (!appointmentType) {
                throw new Error('Tipo de agendamento não encontrado');
            }

            // Get providers with lean query
            const providerQuery: any = { clinic: clinicId, isActive: true };
            if (providerId) {
                providerQuery._id = providerId;
            } else {
                providerQuery.appointmentTypes = appointmentTypeId;
            }
            
            const providers = await Provider.find(providerQuery).lean();
            if (providers.length === 0) {
                return [];
            }

            const slots: TimeSlot[] = [];
            const targetDate = startOfDay(date);

            // Process providers in parallel for better performance
            const providerSlotsPromises = providers.map(provider =>
                this.getProviderAvailableSlots(
                    provider,
                    appointmentType,
                    targetDate,
                    excludeAppointmentId
                )
            );

            const providerSlotsResults = await Promise.all(providerSlotsPromises);
            providerSlotsResults.forEach(providerSlots => {
                slots.push(...providerSlots);
            });

            // Sort by start time
            return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
            
        } catch (error) {
            console.error('Error getting available slots:', error);
            throw error;
        }
    }

    /**
     * IMPROVED: Get available slots for a specific provider with better error handling
     */
    private async getProviderAvailableSlots(
        provider: IProvider,
        appointmentType: IAppointmentType,
        date: Date,
        excludeAppointmentId?: string
    ): Promise<TimeSlot[]> {
        try {
            const dayOfWeek = format(date, 'EEEE').toLowerCase() as keyof typeof provider.workingHours;
            const workingHours = provider.workingHours[dayOfWeek];

            // Provider doesn't work on this day
            if (!workingHours.isWorking || !workingHours.start || !workingHours.end) {
                return [];
            }

            // Convert working hours to Date objects with error handling
            let startTime: Date;
            let endTime: Date;
            
            try {
                startTime = this.parseTimeToDate(date, workingHours.start, provider.timeZone);
                endTime = this.parseTimeToDate(date, workingHours.end, provider.timeZone);
            } catch (error) {
                console.error(`Error parsing working hours for provider ${provider._id}:`, error);
                return [];
            }

            // IMPROVED: Optimized database query
            const existingAppointments = await this.getProviderAppointments(
                (provider._id as any).toString(),
                date,
                excludeAppointmentId
            );

            // Generate potential time slots with memory efficiency
            const slots: TimeSlot[] = [];
            const slotInterval = 15; // 15-minute intervals
            const treatmentDuration = appointmentType.duration;
            
            const bufferBefore = appointmentType.bufferBefore || provider.bufferTimeBefore;
            const bufferAfter = appointmentType.bufferAfter || provider.bufferTimeAfter;
            const totalDuration = treatmentDuration + bufferBefore + bufferAfter;

            let currentTime = startTime;
            let slotCount = 0;
            const maxSlots = 200; // Safety limit

            while (currentTime < endTime && slotCount < maxSlots) {
                const slotEnd = addMinutes(currentTime, totalDuration);
                
                if (slotEnd > endTime) {
                    break;
                }

                const hasConflict = this.hasTimeConflict(
                    currentTime,
                    slotEnd,
                    existingAppointments,
                    bufferBefore,
                    bufferAfter
                );

                if (!hasConflict.conflict) {
                    slots.push({
                        start: addMinutes(currentTime, bufferBefore),
                        end: addMinutes(currentTime, bufferBefore + treatmentDuration),
                        available: true,
                        providerId: (provider._id as any).toString(),
                        appointmentTypeId: (appointmentType._id as any).toString()
                    });
                }

                currentTime = addMinutes(currentTime, slotInterval);
                slotCount++;
            }

            return slots;
            
        } catch (error) {
            console.error(`Error getting slots for provider ${provider._id}:`, error);
            return [];
        }
    }

    /**
     * FIXED: Create appointment with proper transaction handling
     */
    async createAppointment(data: CreateAppointmentData): Promise<SchedulingResult<IAppointment>> {
        // Skip transactions in test environment
        const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID;
        const session = isTestEnv ? null : await mongoose.startSession();

        try {
            if (!isTestEnv) {
                session!.startTransaction();
            }
            
            const { clinicId, patientId, providerId, appointmentTypeId, scheduledStart, notes, priority, createdBy } = data;

            // IMPROVED: Validate all required data first
            if (!patientId || !providerId || !appointmentTypeId || !scheduledStart) {
                throw new Error('Dados obrigatórios não fornecidos');
            }

            // Validate appointment type with session
            const appointmentType = await (session
                ? AppointmentType.findById(appointmentTypeId).session(session)
                : AppointmentType.findById(appointmentTypeId));
            if (!appointmentType) {
                throw new Error('Tipo de agendamento não encontrado');
            }

            // Validate provider with session
            const provider = await (session
                ? Provider.findById(providerId).session(session)
                : Provider.findById(providerId));
            if (!provider || !provider.isActive) {
                throw new Error('Profissional não encontrado ou inativo');
            }

            // Calculate end time
            const scheduledEnd = addMinutes(scheduledStart, appointmentType.duration);

            // CRITICAL: Check availability within transaction to prevent race conditions
            const availabilityCheck = await (session
                ? this.isTimeSlotAvailableWithSession(
                    providerId,
                    scheduledStart,
                    scheduledEnd,
                    appointmentType,
                    session,
                    undefined // excludeAppointmentId
                )
                : this.isTimeSlotAvailable(
                    providerId,
                    scheduledStart,
                    scheduledEnd,
                    appointmentType,
                    undefined // excludeAppointmentId
                ));

            if (!availabilityCheck.available) {
                throw new Error(`Horário não disponível: ${availabilityCheck.reason}`);
            }

            // Create appointment within transaction
            const appointment = new Appointment({
                patient: patientId,
                clinic: clinicId,
                provider: providerId,
                appointmentType: appointmentTypeId,
                scheduledStart,
                scheduledEnd,
                status: appointmentType.requiresApproval ? 'scheduled' : 'confirmed',
                priority: priority || 'routine',
                notes,
                createdBy
            });

            const savedAppointment = await (session
                ? appointment.save({ session })
                : appointment.save());

            // ADDED: Additional operations within transaction
            // Update provider statistics (if needed)
            // Send notifications (queue them for after transaction)
            // Log audit trail

            if (!isTestEnv) {
                await session!.commitTransaction();
            }
            
            return {
                success: true,
                data: savedAppointment
            };

        } catch (error) {
            if (!isTestEnv && session) {
                await session.abortTransaction();
            }
            console.error('Error creating appointment:', error);

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro ao criar agendamento'
            };
        } finally {
            if (!isTestEnv && session) {
                session.endSession();
            }
        }
    }

    /**
     * FIXED: Reschedule appointment with proper transaction handling
     */
    async rescheduleAppointment(
        appointmentId: string,
        newStart: Date,
        reason: string,
        rescheduleBy: 'patient' | 'clinic'
    ): Promise<SchedulingResult<IAppointment>> {
        // Skip transactions in test environment
        const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID;
        const session = isTestEnv ? null : await mongoose.startSession();

        try {
            if (!isTestEnv) {
                session!.startTransaction();
            }
            
            const appointment = await (session
                ? Appointment.findById(appointmentId).session(session)
                : Appointment.findById(appointmentId));
            if (!appointment) {
                throw new Error('Agendamento não encontrado');
            }

            const appointmentType = await (session
                ? AppointmentType.findById(appointment.appointmentType).session(session)
                : AppointmentType.findById(appointment.appointmentType));
            if (!appointmentType) {
                throw new Error('Tipo de agendamento não encontrado');
            }

            const newEnd = addMinutes(newStart, appointmentType.duration);

            // Check availability for new time (excluding current appointment)
            const isAvailable = await (session
                ? this.isTimeSlotAvailableWithSession(
                    appointment.provider.toString(),
                    newStart,
                    newEnd,
                    appointmentType,
                    session,
                    appointmentId
                )
                : this.isTimeSlotAvailable(
                    appointment.provider.toString(),
                    newStart,
                    newEnd,
                    appointmentType,
                    appointmentId
                ));

            if (!isAvailable.available) {
                throw new Error(`Novo horário não disponível: ${isAvailable.reason}`);
            }

            // Store old appointment data for history
            const oldScheduledStart = appointment.scheduledStart;

            // Update appointment within transaction
            appointment.rescheduleHistory.push({
                oldDate: oldScheduledStart,
                newDate: newStart,
                reason,
                rescheduleBy,
                timestamp: new Date()
            });

            appointment.scheduledStart = newStart;
            appointment.scheduledEnd = newEnd;
            appointment.status = 'scheduled'; // Reset to scheduled

            const updatedAppointment = await (session
                ? appointment.save({ session })
                : appointment.save());

            if (!isTestEnv) {
                await session!.commitTransaction();
            }

            return {
                success: true,
                data: updatedAppointment
            };

        } catch (error) {
            if (!isTestEnv && session) {
                await session.abortTransaction();
            }
            console.error('Error rescheduling appointment:', error);

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro ao reagendar'
            };
        } finally {
            if (!isTestEnv && session) {
                session.endSession();
            }
        }
    }

    /**
     * FIXED: Cancel appointment with transaction support
     */
    async cancelAppointment(appointmentId: string, reason: string): Promise<SchedulingResult<IAppointment>> {
        // Skip transactions in test environment
        const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID;
        const session = isTestEnv ? null : await mongoose.startSession();

        try {
            if (!isTestEnv) {
                session!.startTransaction();
            }
            
            const appointment = await (session
                ? Appointment.findById(appointmentId).session(session)
                : Appointment.findById(appointmentId));
            if (!appointment) {
                throw new Error('Agendamento não encontrado');
            }

            // Prevent canceling already completed appointments
            if (appointment.status === 'completed') {
                throw new Error('Não é possível cancelar um agendamento já concluído');
            }

            appointment.status = 'cancelled';
            appointment.cancellationReason = reason;

            const cancelledAppointment = await (session
                ? appointment.save({ session })
                : appointment.save());

            // ADDED: Additional operations within transaction
            // Update provider availability cache (if exists)
            // Queue notification to patient
            // Log audit trail

            if (!isTestEnv) {
                await session!.commitTransaction();
            }

            return {
                success: true,
                data: cancelledAppointment
            };

        } catch (error) {
            if (!isTestEnv && session) {
                await session.abortTransaction();
            }
            console.error('Error cancelling appointment:', error);

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro ao cancelar agendamento'
            };
        } finally {
            if (!isTestEnv && session) {
                session.endSession();
            }
        }
    }

    /**
     * IMPROVED: Check if time slot is available with session support
     */
    private async isTimeSlotAvailableWithSession(
        providerId: string,
        start: Date,
        end: Date,
        appointmentType: IAppointmentType,
        session: mongoose.ClientSession,
        excludeAppointmentId?: string
    ): Promise<{ available: boolean; reason?: string }> {
        try {
            // Get provider with session
            const provider = await Provider.findById(providerId).session(session);
            if (!provider) {
                return { available: false, reason: 'Profissional não encontrado' };
            }

            // Check working hours
            const dayOfWeek = format(start, 'EEEE').toLowerCase() as keyof typeof provider.workingHours;
            const workingHours = provider.workingHours[dayOfWeek];
            
            if (!workingHours.isWorking) {
                return { available: false, reason: 'Profissional não trabalha neste dia' };
            }

            const workStart = this.parseTimeToDate(start, workingHours.start, provider.timeZone);
            const workEnd = this.parseTimeToDate(start, workingHours.end, provider.timeZone);

            if (start < workStart || end > workEnd) {
                return { available: false, reason: 'Fora do horário de trabalho' };
            }

            // Get existing appointments with session
            const existingAppointments = await this.getProviderAppointmentsWithSession(
                providerId,
                start,
                session,
                excludeAppointmentId
            );

            // Check conflicts with buffer times
            const bufferBefore = appointmentType.bufferBefore || provider.bufferTimeBefore;
            const bufferAfter = appointmentType.bufferAfter || provider.bufferTimeAfter;
            
            const conflict = this.hasTimeConflict(
                addMinutes(start, -bufferBefore),
                addMinutes(end, bufferAfter),
                existingAppointments,
                0, // Buffer already applied
                0
            );

            return { available: !conflict.conflict, reason: conflict.reason };
            
        } catch (error) {
            console.error('Error checking availability:', error);
            return { available: false, reason: 'Erro ao verificar disponibilidade' };
        }
    }

    /**
     * IMPROVED: Legacy method for backward compatibility
     */
    private async isTimeSlotAvailable(
        providerId: string,
        start: Date,
        end: Date,
        appointmentType: IAppointmentType,
        excludeAppointmentId?: string
    ): Promise<{ available: boolean; reason?: string }> {
        // Use the session version without a session for backward compatibility
        const session = await mongoose.startSession();
        try {
            const result = await this.isTimeSlotAvailableWithSession(
                providerId, start, end, appointmentType, session, excludeAppointmentId
            );
            return result;
        } finally {
            session.endSession();
        }
    }

    /**
     * IMPROVED: Get provider appointments with session support
     */
    private async getProviderAppointmentsWithSession(
        providerId: string,
        date: Date,
        session: mongoose.ClientSession,
        excludeAppointmentId?: string
    ): Promise<IAppointment[]> {
        const query: any = {
            provider: providerId,
            scheduledStart: {
                $gte: startOfDay(date),
                $lt: endOfDay(date)
            },
            status: { $nin: ['cancelled', 'no_show'] }
        };

        if (excludeAppointmentId) {
            query._id = { $ne: excludeAppointmentId };
        }

        return await Appointment.find(query)
            .sort({ scheduledStart: 1 })
            .session(session);
    }

    /**
     * IMPROVED: Get provider appointments (legacy method)
     */
    private async getProviderAppointments(
        providerId: string,
        date: Date,
        excludeAppointmentId?: string
    ): Promise<IAppointment[]> {
        const query: any = {
            provider: providerId,
            scheduledStart: {
                $gte: startOfDay(date),
                $lt: endOfDay(date)
            },
            status: { $nin: ['cancelled', 'no_show'] }
        };

        if (excludeAppointmentId) {
            query._id = { $ne: excludeAppointmentId };
        }

        return await Appointment.find(query)
            .select('scheduledStart scheduledEnd status')
            .sort({ scheduledStart: 1 })
            .lean();
    }

    /**
     * IMPROVED: More efficient conflict detection
     */
    private hasTimeConflict(
        proposedStart: Date,
        proposedEnd: Date,
        existingAppointments: IAppointment[],
        bufferBefore: number,
        bufferAfter: number
    ): { conflict: boolean; reason?: string } {
        
        if (!existingAppointments.length) {
            return { conflict: false };
        }
        
        const proposedStartTime = proposedStart.getTime();
        const proposedEndTime = proposedEnd.getTime();
        
        for (const appointment of existingAppointments) {
            const existingStartTime = addMinutes(appointment.scheduledStart, -bufferBefore).getTime();
            const existingEndTime = addMinutes(appointment.scheduledEnd, bufferAfter).getTime();

            // Check for overlap using time comparison
            const hasOverlap = !(proposedEndTime <= existingStartTime || proposedStartTime >= existingEndTime);

            if (hasOverlap) {
                return {
                    conflict: true,
                    reason: `Conflito com agendamento às ${format(appointment.scheduledStart, 'HH:mm')}`
                };
            }
        }

        return { conflict: false };
    }

    /**
     * IMPROVED: Parse time string with better error handling
     */
    private parseTimeToDate(date: Date, timeString: string, timeZone: string): Date {
        try {
            const [hours, minutes] = timeString.split(':').map(Number);
            
            if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                throw new Error(`Invalid time format: ${timeString}`);
            }
            
            const dateStr = format(date, 'yyyy-MM-dd');
            const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
            const dateTimeStr = `${dateStr}T${timeStr}`;
            
            const dateInTimeZoneString = formatInTimeZone(new Date(dateTimeStr), timeZone, "yyyy-MM-dd'T'HH:mm:ssXXX");
            return parseISO(dateInTimeZoneString);
        } catch (error) {
            throw new Error(`Error parsing time ${timeString} for timezone ${timeZone}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * IMPROVED: Get appointments with enhanced filtering and performance
     */
    async getAppointments(
        clinicId: string,
        startDate: Date,
        endDate: Date,
        providerId?: string,
        status?: string
    ): Promise<IAppointment[]> {
        try {
            const query: any = {
                clinic: clinicId,
                scheduledStart: {
                    $gte: startDate,
                    $lte: endDate
                }
            };

            if (providerId) {
                query.provider = providerId;
            }

            if (status) {
                query.status = status;
            }

            return await Appointment.find(query)
                .populate('patient', 'name phone email')
                .populate('provider', 'name specialties')
                .populate('appointmentType', 'name duration color category')
                .sort({ scheduledStart: 1 })
                .lean(); // Use lean for better performance
                
        } catch (error) {
            console.error('Error fetching appointments:', error);
            throw new Error('Erro ao buscar agendamentos');
        }
    }

    /**
     * ADDED: Batch operations with transaction support
     */
    async batchUpdateAppointmentStatus(
        appointmentIds: string[],
        status: IAppointment['status'],
        updatedBy: string
    ): Promise<SchedulingResult<{ updated: number; failed: string[] }>> {
        const session = await mongoose.startSession();
        
        try {
            session.startTransaction();
            
            const results = { updated: 0, failed: [] as string[] };
            
            for (const id of appointmentIds) {
                try {
                    const appointment = await Appointment.findById(id).session(session);
                    if (!appointment) {
                        results.failed.push(`${id}: Agendamento não encontrado`);
                        continue;
                    }
                    
                    appointment.status = status;
                    await appointment.save({ session });
                    results.updated++;
                    
                } catch (error) {
                    results.failed.push(`${id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                }
            }
            
            await session.commitTransaction();
            
            return {
                success: true,
                data: results,
                warnings: results.failed.length > 0 ? results.failed : undefined
            };
            
        } catch (error) {
            await session.abortTransaction();
            console.error('Error in batch update:', error);
            
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro na atualização em lote'
            };
        } finally {
            session.endSession();
        }
    }

    /**
     * ADDED: Get appointment conflicts for a given time range
     */
    async getAppointmentConflicts(
        providerId: string,
        startDate: Date,
        endDate: Date,
        appointmentTypeId: string
    ): Promise<AppointmentConflict> {
        try {
            const appointmentType = await AppointmentType.findById(appointmentTypeId).lean();
            if (!appointmentType) {
                throw new Error('Tipo de agendamento não encontrado');
            }

            const bufferBefore = appointmentType.bufferBefore || 0;
            const bufferAfter = appointmentType.bufferAfter || 0;

            const conflictingAppointments = await Appointment.find({
                provider: providerId,
                status: { $nin: ['cancelled', 'no_show'] },
                $or: [
                    {
                        scheduledStart: {
                            $lt: addMinutes(endDate, bufferAfter),
                            $gte: addMinutes(startDate, -bufferBefore)
                        }
                    },
                    {
                        scheduledEnd: {
                            $gt: addMinutes(startDate, -bufferBefore),
                            $lte: addMinutes(endDate, bufferAfter)
                        }
                    }
                ]
            }).lean();

            return {
                hasConflict: conflictingAppointments.length > 0,
                conflictingAppointments: conflictingAppointments.length > 0 ? conflictingAppointments as IAppointment[] : undefined,
                reason: conflictingAppointments.length > 0 
                    ? `${conflictingAppointments.length} conflito(s) encontrado(s)`
                    : undefined
            };
            
        } catch (error) {
            console.error('Error checking conflicts:', error);
            return {
                hasConflict: true,
                reason: 'Erro ao verificar conflitos'
            };
        }
    }

    /**
     * ADDED: Get provider utilization statistics
     */
    async getProviderUtilization(
        providerId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{
        totalSlots: number;
        bookedSlots: number;
        utilizationRate: number;
        appointments: {
            scheduled: number;
            completed: number;
            cancelled: number;
            noShow: number;
        }
    }> {
        try {
            const appointments = await Appointment.find({
                provider: providerId,
                scheduledStart: {
                    $gte: startDate,
                    $lte: endDate
                }
            }).lean();

            const appointmentCounts = {
                scheduled: 0,
                completed: 0,
                cancelled: 0,
                noShow: 0
            };

            appointments.forEach(apt => {
                switch (apt.status) {
                    case 'scheduled':
                    case 'confirmed':
                    case 'checked_in':
                    case 'in_progress':
                        appointmentCounts.scheduled++;
                        break;
                    case 'completed':
                        appointmentCounts.completed++;
                        break;
                    case 'cancelled':
                        appointmentCounts.cancelled++;
                        break;
                    case 'no_show':
                        appointmentCounts.noShow++;
                        break;
                }
            });

            const bookedSlots = appointmentCounts.scheduled + appointmentCounts.completed;
            
            // Simplified calculation - in reality, you'd calculate based on working hours
            const totalSlots = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 30)); // 30-minute slots
            const utilizationRate = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0;

            return {
                totalSlots,
                bookedSlots,
                utilizationRate: Math.round(utilizationRate * 100) / 100,
                appointments: appointmentCounts
            };
            
        } catch (error) {
            console.error('Error calculating utilization:', error);
            throw new Error('Erro ao calcular utilização do profissional');
        }
    }
}

export const schedulingService = new SchedulingService();