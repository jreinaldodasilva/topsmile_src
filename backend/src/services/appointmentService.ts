// backend/src/services/appointmentService.ts
import { Appointment, IAppointment } from '../models/Appointment';
import mongoose from 'mongoose';

export interface CreateAppointmentData {
  patient: string;
  provider: string;
  appointmentType: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  notes?: string;
  priority?: 'routine' | 'urgent' | 'emergency';
  remindersSent?: {
    confirmation?: boolean;
    reminder24h?: boolean;
    reminder2h?: boolean;
  };
  clinic: string;
  createdBy: string;
}

export interface UpdateAppointmentData {
  scheduledStart?: Date;
  scheduledEnd?: Date;
  notes?: string;
  status?: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  cancellationReason?: string;
  rescheduleHistory?: Array<{
    oldDate: Date;
    newDate: Date;
    reason: string;
    rescheduleBy: 'patient' | 'clinic';
    timestamp: Date;
  }>;
}

class AppointmentService {
  async createAppointment(data: CreateAppointmentData): Promise<IAppointment> {
    try {
      // Validate required fields
      if (!data.patient || !data.provider || !data.appointmentType || !data.scheduledStart || !data.scheduledEnd || !data.clinic) {
        throw new Error('Todos os campos obrigatórios devem ser preenchidos');
      }

      // Validate clinic ID
      if (!mongoose.Types.ObjectId.isValid(data.clinic)) {
        throw new Error('ID da clínica inválido');
      }

      // Check for overlapping appointments for the provider
      const overlapping = await Appointment.findOne({
        provider: data.provider,
        clinic: data.clinic,
        status: { $in: ['scheduled', 'confirmed', 'in_progress'] },
        $or: [
          {
            scheduledStart: { $lt: data.scheduledEnd, $gte: data.scheduledStart }
          },
          {
            scheduledEnd: { $gt: data.scheduledStart, $lte: data.scheduledEnd }
          },
          {
            scheduledStart: { $lte: data.scheduledStart },
            scheduledEnd: { $gte: data.scheduledEnd }
          }
        ]
      });

      if (overlapping) {
        throw new Error('Horário indisponível');
      }

      const appointment = new Appointment({
        ...data,
        status: 'scheduled',
        remindersSent: data.remindersSent || {}
      });

      return await appointment.save();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao criar agendamento');
    }
  }

  async getAppointmentById(appointmentId: string, clinicId: string): Promise<IAppointment | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
        throw new Error('ID do agendamento inválido');
      }

      const appointment = await Appointment.findOne({
        _id: appointmentId,
        clinic: clinicId
      }).populate('patient provider appointmentType');

      return appointment;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao buscar agendamento');
    }
  }

  async getAppointments(clinicId: string, filters: any = {}): Promise<IAppointment[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(clinicId)) {
        throw new Error('ID da clínica inválido');
      }

      const query: any = { clinic: clinicId };

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.startDate && filters.endDate) {
        query.scheduledStart = { $gte: filters.startDate };
        query.scheduledEnd = { $lte: filters.endDate };
      }

      if (filters.providerId) {
        query.provider = filters.providerId;
      }

      return await Appointment.find(query)
        .populate('patient provider appointmentType')
        .sort({ scheduledStart: 1 });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao buscar agendamentos');
    }
  }

  async updateAppointment(appointmentId: string, clinicId: string, data: UpdateAppointmentData): Promise<IAppointment | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
        throw new Error('ID do agendamento inválido');
      }

      const appointment = await Appointment.findOne({
        _id: appointmentId,
        clinic: clinicId
      });

      if (!appointment) {
        return null;
      }

      // If rescheduling, check for conflicts
      if (data.scheduledStart && data.scheduledEnd) {
        const overlapping = await Appointment.findOne({
          provider: appointment.provider,
          clinic: clinicId,
          status: { $in: ['scheduled', 'confirmed', 'in_progress'] },
          _id: { $ne: appointmentId },
          $or: [
            {
              scheduledStart: { $lt: data.scheduledEnd, $gte: data.scheduledStart }
            },
            {
              scheduledEnd: { $gt: data.scheduledStart, $lte: data.scheduledEnd }
            },
            {
              scheduledStart: { $lte: data.scheduledStart },
              scheduledEnd: { $gte: data.scheduledEnd }
            }
          ]
        });

        if (overlapping) {
          throw new Error('Horário indisponível');
        }

        // Add to reschedule history
        if (!appointment.rescheduleHistory) {
          appointment.rescheduleHistory = [];
        }
        appointment.rescheduleHistory.push({
          oldDate: appointment.scheduledStart,
          newDate: appointment.scheduledEnd,
          reason: data.rescheduleHistory?.[0]?.reason || 'Reagendamento',
          rescheduleBy: 'clinic',
          timestamp: new Date()
        });

        appointment.scheduledStart = data.scheduledStart;
        appointment.scheduledEnd = data.scheduledEnd;
      }

      if (data.notes !== undefined) {
        appointment.notes = data.notes;
      }

      if (data.status !== undefined) {
        appointment.status = data.status;
      }

      if (data.cancellationReason !== undefined) {
        appointment.cancellationReason = data.cancellationReason;
      }

      return await appointment.save();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao atualizar agendamento');
    }
  }

  async cancelAppointment(appointmentId: string, clinicId: string, reason: string): Promise<IAppointment | null> {
    try {
      const appointment = await this.updateAppointment(appointmentId, clinicId, {
        status: 'cancelled',
        cancellationReason: reason
      });

      return appointment;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao cancelar agendamento');
    }
  }

  async checkAvailability(providerId: string, startDate: Date, endDate: Date, clinicId: string): Promise<Array<{ start: Date; end: Date }>> {
    try {
      // This is a mock implementation, real implementation would check provider's schedule and existing appointments
      return [
        { start: new Date(startDate), end: new Date(endDate) }
      ];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao verificar disponibilidade');
    }
  }

  async getAppointmentStats(clinicId: string, startDate?: Date, endDate?: Date): Promise<{
    total: number;
    scheduled: number;
    confirmed: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  }> {
    try {
      if (!mongoose.Types.ObjectId.isValid(clinicId)) {
        throw new Error('ID da clínica inválido');
      }

      const query: any = { clinic: clinicId };
      if (startDate && endDate) {
        query.scheduledStart = { $gte: startDate };
        query.scheduledEnd = { $lte: endDate };
      }

      const total = await Appointment.countDocuments(query);
      const scheduled = await Appointment.countDocuments({ ...query, status: 'scheduled' });
      const confirmed = await Appointment.countDocuments({ ...query, status: 'confirmed' });
      const inProgress = await Appointment.countDocuments({ ...query, status: 'in-progress' });
      const completed = await Appointment.countDocuments({ ...query, status: 'completed' });
      const cancelled = await Appointment.countDocuments({ ...query, status: 'cancelled' });

      return {
        total,
        scheduled,
        confirmed,
        inProgress,
        completed,
        cancelled
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao buscar estatísticas de agendamentos');
    }
  }

  async rescheduleAppointment(
    appointmentId: string,
    clinicId: string,
    newStart: Date,
    newEnd: Date,
    reason: string
  ): Promise<IAppointment | null> {
    try {
      const appointment = await Appointment.findOne({
        _id: appointmentId,
        clinic: clinicId
      });

      if (!appointment) {
        return null;
      }

      // Check for conflicts
      const overlapping = await Appointment.findOne({
        provider: appointment.provider,
        clinic: clinicId,
        status: { $in: ['scheduled', 'confirmed', 'in_progress'] },
        _id: { $ne: appointmentId },
        $or: [
          {
            scheduledStart: { $lt: newEnd, $gte: newStart }
          },
          {
            scheduledEnd: { $gt: newStart, $lte: newEnd }
          },
          {
            scheduledStart: { $lte: newStart },
            scheduledEnd: { $gte: newEnd }
          }
        ]
      });

      if (overlapping) {
        throw new Error('Horário indisponível');
      }

      if (!appointment.rescheduleHistory) {
        appointment.rescheduleHistory = [];
      }

      appointment.rescheduleHistory.push({
        oldDate: appointment.scheduledStart,
        newDate: appointment.scheduledEnd,
        reason,
        rescheduleBy: 'clinic',
        timestamp: new Date()
      });

      appointment.scheduledStart = newStart;
      appointment.scheduledEnd = newEnd;

      return await appointment.save();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro ao reagendar agendamento');
    }
  }
}

export const appointmentService = new AppointmentService();
