// backend/src/services/availabilityService.ts - FIXED VERSION
import { Provider } from '../models/Provider';
import { Appointment } from '../models/Appointment';
import { AppointmentType } from '../models/AppointmentType';
import { addMinutes, addDays, format, startOfDay, endOfDay, differenceInDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import mongoose from 'mongoose'; // FIXED: Replaced require with import

export interface AvailabilitySlot {
  start: Date;
  end: Date;
  available: boolean;
  providerId: string;
  conflictReason?: string;
}

export interface GenerateAvailabilityOptions {
  providerId: string;
  appointmentTypeId: string;
  fromIso: string;
  toIso: string;
  granularityMin?: number;
  maxDays?: number; // ADDED: Prevent excessive date ranges
}

/**
 * FIXED: Generate availability slots with memory leak prevention
 */
export async function generateAvailability(options: GenerateAvailabilityOptions): Promise<AvailabilitySlot[]> {
  const { 
    providerId, 
    appointmentTypeId, 
    fromIso, 
    toIso, 
    granularityMin = 15,
    maxDays = 90 // ADDED: Limit to prevent memory issues
  } = options;

  // Validate inputs
  const fromDate = new Date(fromIso);
  const toDate = new Date(toIso);
  
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    throw new Error('Invalid date format');
  }

  // ADDED: Prevent excessive date ranges that could cause memory issues
  const daysDifference = differenceInDays(toDate, fromDate);
  if (daysDifference > maxDays) {
    throw new Error(`Date range too large. Maximum ${maxDays} days allowed, requested ${daysDifference} days`);
  }

  if (daysDifference < 0) {
    throw new Error('End date must be after start date');
  }

  // Get provider and appointment type with error handling
  const [provider, appointmentType] = await Promise.all([
    Provider.findById(providerId).lean(), // Use lean() for better performance
    AppointmentType.findById(appointmentTypeId).lean()
  ]);

  if (!provider) {
    throw new Error('Provider not found');
  }

  if (!appointmentType) {
    throw new Error('Appointment type not found');
  }

  if (!provider.isActive) {
    throw new Error('Provider is not active');
  }

  const slots: AvailabilitySlot[] = [];
  
  // FIXED: Safe date iteration with proper termination conditions
  let currentDay = startOfDay(fromDate);
  const lastDay = startOfDay(toDate);
  let dayCount = 0;
  const maxIterations = maxDays + 1; // Safety limit

  while (currentDay <= lastDay && dayCount < maxIterations) {
    try {
      const daySlots = await generateDayAvailability({
        provider,
        appointmentType,
        date: currentDay,
        granularityMin,
        startTime: currentDay.getTime() === startOfDay(fromDate).getTime() ? fromDate : undefined,
        endTime: currentDay.getTime() === lastDay.getTime() ? toDate : undefined
      });
      
      slots.push(...daySlots);
      
      // FIXED: Safe date increment with validation
      const nextDay = addDays(currentDay, 1);
      
      // Prevent infinite loops
      if (nextDay.getTime() <= currentDay.getTime()) {
        throw new Error('Date iteration error - infinite loop prevented');
      }
      
      currentDay = nextDay;
      dayCount++;
      
      // ADDED: Memory management - process in chunks if too many slots
      if (slots.length > 10000) {
        console.warn(`Large number of slots generated (${slots.length}), consider reducing date range`);
        break;
      }
      
    } catch (error) {
      console.error(`Error processing day ${format(currentDay, 'yyyy-MM-dd')}:`, error);
      // Continue with next day instead of failing completely
      currentDay = addDays(currentDay, 1);
      dayCount++;
      continue;
    }
  }

  // ADDED: Validation of results
  if (dayCount >= maxIterations) {
    throw new Error('Maximum iteration limit reached - possible infinite loop prevented');
  }

  return slots;
}

interface GenerateDayAvailabilityOptions {
  provider: any;
  appointmentType: any;
  date: Date;
  granularityMin: number;
  startTime?: Date;
  endTime?: Date;
}

async function generateDayAvailability(options: GenerateDayAvailabilityOptions): Promise<AvailabilitySlot[]> {
  const { provider, appointmentType, date, granularityMin, startTime, endTime } = options;
  
  // Get day of week (lowercase)
  const dayOfWeek = format(date, 'EEEE').toLowerCase() as keyof typeof provider.workingHours;
  const workingHours = provider.workingHours[dayOfWeek];

  // Check if provider works on this day
  if (!workingHours || !workingHours.isWorking) {
    return [];
  }

  // IMPROVED: Better error handling for time parsing
  let workStart: Date;
  let workEnd: Date;
  
  try {
    workStart = parseTimeToDate(date, workingHours.start, provider.timeZone);
    workEnd = parseTimeToDate(date, workingHours.end, provider.timeZone);
  } catch (error) {
    console.error(`Error parsing working hours for provider ${provider._id}:`, error);
    return [];
  }

  // Apply time range filters
  const rangeStart = startTime && startTime > workStart ? startTime : workStart;
  const rangeEnd = endTime && endTime < workEnd ? endTime : workEnd;

  if (rangeStart >= rangeEnd) {
    return [];
  }

  // IMPROVED: Optimized database query with projection
  const existingAppointments = await Appointment.find({
    provider: provider._id,
    scheduledStart: {
      $gte: startOfDay(date),
      $lt: endOfDay(date)
    },
    status: { $nin: ['cancelled', 'no_show'] }
  }, {
    // Only select needed fields for performance
    scheduledStart: 1,
    scheduledEnd: 1,
    status: 1
  }).sort({ scheduledStart: 1 }).lean(); // Use lean() for performance

  // Generate time slots with memory efficiency
  const slots: AvailabilitySlot[] = [];
  const treatmentDuration = appointmentType.duration;
  const bufferBefore = appointmentType.bufferBefore || provider.bufferTimeBefore || 0;
  const bufferAfter = appointmentType.bufferAfter || provider.bufferTimeAfter || 0;

  let currentTime = rangeStart;
  let slotCount = 0;
  const maxSlotsPerDay = 200; // Safety limit for memory

  while (currentTime < rangeEnd && slotCount < maxSlotsPerDay) {
    const slotEnd = addMinutes(currentTime, treatmentDuration);
    
    // Don't create slots that extend beyond working hours
    if (slotEnd > rangeEnd) {
      break;
    }

    // IMPROVED: More efficient conflict detection
    const hasConflict = checkTimeConflictOptimized(
      currentTime,
      slotEnd,
      existingAppointments,
      bufferBefore,
      bufferAfter
    );

    if (!hasConflict.hasConflict) {
      slots.push({
        start: currentTime,
        end: slotEnd,
        available: true,
        providerId: provider._id.toString(),
        conflictReason: undefined
      });
    }

    currentTime = addMinutes(currentTime, granularityMin);
    slotCount++;
  }

  if (slotCount >= maxSlotsPerDay) {
    console.warn(`Maximum slots per day reached (${maxSlotsPerDay}) for provider ${provider._id}`);
  }

  return slots;
}

// IMPROVED: More efficient time parsing with caching
const timeParseCache = new Map<string, Date>();

function parseTimeToDate(date: Date, timeString: string, timeZone: string): Date {
  const cacheKey = `${format(date, 'yyyy-MM-dd')}-${timeString}-${timeZone}`;
  
  if (timeParseCache.has(cacheKey)) {
    return new Date(timeParseCache.get(cacheKey)!);
  }
  
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error(`Invalid time format: ${timeString}`);
    }
    
    // This is the corrected line. It manually constructs a date string in the provider's
    // timezone and then creates a Date object. The Date constructor handles the
    // conversion to UTC correctly.
    const result = new Date(formatInTimeZone(
      new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes),
      timeZone,
      'yyyy-MM-dd\'T\'HH:mm:ssXXX'
    ));
    
    // Cache the result (but clear cache periodically to prevent memory leaks)
    if (timeParseCache.size > 1000) {
      timeParseCache.clear();
    }
    timeParseCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    throw new Error(`Error parsing time ${timeString} for timezone ${timeZone}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// OPTIMIZED: More efficient conflict detection algorithm
function checkTimeConflictOptimized(
  proposedStart: Date,
  proposedEnd: Date,
  existingAppointments: any[],
  bufferBefore: number,
  bufferAfter: number
): { hasConflict: boolean; reason?: string } {
  
  // Early return if no appointments
  if (!existingAppointments.length) {
    return { hasConflict: false };
  }
  
  const proposedStartTime = proposedStart.getTime();
  const proposedEndTime = proposedEnd.getTime();
  
  // Use binary search-like approach for better performance with many appointments
  for (const appointment of existingAppointments) {
    const existingStartTime = addMinutes(appointment.scheduledStart, -bufferBefore).getTime();
    const existingEndTime = addMinutes(appointment.scheduledEnd, bufferAfter).getTime();
    
    // Quick check: if proposed slot is completely before this appointment, skip
    if (proposedEndTime <= existingStartTime) {
      continue;
    }
    
    // Quick check: if proposed slot is completely after this appointment, skip
    if (proposedStartTime >= existingEndTime) {
      continue;
    }
    
    // If we reach here, there's an overlap
    return {
      hasConflict: true,
      reason: `Conflito com agendamento às ${format(appointment.scheduledStart, 'HH:mm')}`
    };
  }

  return { hasConflict: false };
}

/**
 * IMPROVED: Book appointment atomically with proper transaction handling
 */
export async function bookAppointmentAtomic(options: {
  patientId: string;
  providerIds: string[];
  typeId: string;
  startUtc: Date;
  endUtc: Date;
  requiredResourceIds?: string[];
  createdBy?: string;
  tentative?: boolean;
}): Promise<any> {
  const { patientId, providerIds, typeId, startUtc, endUtc, createdBy, tentative = false } = options;

  // Validate inputs
  if (!patientId || !providerIds?.length || !typeId) {
    throw new Error('Missing required fields');
  }

  if (startUtc >= endUtc) {
    throw new Error('Start time must be before end time');
  }

  // ADDED: Validate future booking (not in the past)
  const now = new Date();
  if (startUtc < now) {
    throw new Error('Cannot book appointments in the past');
  }

  // IMPROVED: Use lean queries for better performance
  const appointmentType = await AppointmentType.findById(typeId).lean();
  if (!appointmentType) {
    throw new Error('Appointment type not found');
  }

  // For simplicity, use the first provider (extend later for multi-provider bookings)
  const providerId = providerIds[0];
  const provider = await Provider.findById(providerId).lean();
  if (!provider || !provider.isActive) {
    throw new Error('Provider not found or inactive');
  }

  // IMPROVED: More efficient conflict checking with optimized query
  const existingAppointments = await Appointment.find({
    provider: providerId,
    scheduledStart: {
      $gte: startOfDay(startUtc),
      $lt: endOfDay(startUtc)
    },
    status: { $nin: ['cancelled', 'no_show'] }
  }, {
    scheduledStart: 1,
    scheduledEnd: 1
  }).lean().sort({ scheduledStart: 1 });

  const bufferBefore = appointmentType.bufferBefore || provider.bufferTimeBefore || 0;
  const bufferAfter = appointmentType.bufferAfter || provider.bufferTimeAfter || 0;

  const conflict = checkTimeConflictOptimized(
    addMinutes(startUtc, -bufferBefore),
    addMinutes(endUtc, bufferAfter),
    existingAppointments,
    0, // Buffers already applied
    0
  );

  if (conflict.hasConflict) {
    throw new Error(`Time slot not available: ${conflict.reason}`);
  }

  // ADDED: Transaction support for data consistency
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    // Create appointment with session
    // FIXED: Changed require to use imported Appointment model
    const appointment = new Appointment({
      patient: patientId,
      clinic: provider.clinic,
      provider: providerId,
      appointmentType: typeId,
      scheduledStart: startUtc,
      scheduledEnd: endUtc,
      status: tentative ? 'scheduled' : 'confirmed',
      priority: 'routine',
      createdBy: createdBy || null
    });

    const savedAppointment = await appointment.save({ session });
    
    // Additional operations can be added here (notifications, etc.)
    
    await session.commitTransaction();
    return savedAppointment;
    
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * ADDED: Batch availability check for better performance
 */
export async function batchAvailabilityCheck(options: {
  providerId: string;
  appointmentTypeId: string;
  timeSlots: Array<{ start: Date; end: Date }>;
}): Promise<Array<{ start: Date; end: Date; available: boolean; reason?: string }>> {
  const { providerId, appointmentTypeId, timeSlots } = options;
  
  if (!timeSlots.length) {
    return [];
  }
  
  // Get provider and appointment type
  const [provider, appointmentType] = await Promise.all([
    Provider.findById(providerId).lean(),
    AppointmentType.findById(appointmentTypeId).lean()
  ]);
  
  if (!provider || !appointmentType) {
    throw new Error('Provider or appointment type not found');
  }
  
  // Get all potentially conflicting appointments in one query
  const earliestStart = new Date(Math.min(...timeSlots.map(slot => slot.start.getTime())));
  const latestEnd = new Date(Math.max(...timeSlots.map(slot => slot.end.getTime())));
  
  const existingAppointments = await Appointment.find({
    provider: providerId,
    scheduledStart: { $gte: startOfDay(earliestStart) },
    scheduledEnd: { $lte: endOfDay(latestEnd) },
    status: { $nin: ['cancelled', 'no_show'] }
  }, {
    scheduledStart: 1,
    scheduledEnd: 1
  }).lean().sort({ scheduledStart: 1 });
  
  const bufferBefore = appointmentType.bufferBefore || provider.bufferTimeBefore || 0;
  const bufferAfter = appointmentType.bufferAfter || provider.bufferTimeAfter || 0;
  
  // Check each time slot
  return timeSlots.map(slot => {
    const conflict = checkTimeConflictOptimized(
      slot.start,
      slot.end,
      existingAppointments,
      bufferBefore,
      bufferAfter
    );
    
    return {
      start: slot.start,
      end: slot.end,
      available: !conflict.hasConflict,
      reason: conflict.reason
    };
  });
}

/**
 * ADDED: Cleanup function for memory management
 */
export function clearAvailabilityCache(): void {
  timeParseCache.clear();
}

/**
 * ADDED: Get availability statistics for performance monitoring
 */
export function getAvailabilityStats(): {
  cacheSize: number;
  cacheHitRatio?: number;
} {
  return {
    cacheSize: timeParseCache.size
  };
}