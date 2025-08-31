// backend/src/models/Appointment.ts - FIXED VERSION with Critical Performance Indexes
import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointment extends Document {
    patient: mongoose.Types.ObjectId;
    clinic: mongoose.Types.ObjectId;
    provider: mongoose.Types.ObjectId;
    appointmentType: mongoose.Types.ObjectId;
    scheduledStart: Date;
    scheduledEnd: Date;
    actualStart?: Date;
    actualEnd?: Date;
    status: 'scheduled' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
    priority: 'routine' | 'urgent' | 'emergency';
    notes?: string;
    privateNotes?: string; // Staff-only notes
    remindersSent: {
        confirmation: boolean;
        reminder24h: boolean;
        reminder2h: boolean;
    };
    cancellationReason?: string;
    rescheduleHistory: Array<{
        oldDate: Date;
        newDate: Date;
        reason: string;
        rescheduleBy: 'patient' | 'clinic';
        timestamp: Date;
    }>;
    // ADDED: Additional tracking fields
    checkedInAt?: Date;
    completedAt?: Date;
    duration?: number; // Actual duration in minutes
    waitTime?: number; // Wait time in minutes
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>({
    patient: {
        type: Schema.Types.ObjectId,
        ref: 'Patient',
        required: [true, 'Paciente é obrigatório'],
        index: true // CRITICAL: Individual index for patient queries
    },
    clinic: {
        type: Schema.Types.ObjectId,
        ref: 'Clinic',
        required: [true, 'Clínica é obrigatória'],
        index: true // CRITICAL: Individual index for clinic isolation
    },
    provider: {
        type: Schema.Types.ObjectId,
        ref: 'Provider',
        required: [true, 'Profissional é obrigatório'],
        index: true // CRITICAL: Individual index for provider queries
    },
    appointmentType: {
        type: Schema.Types.ObjectId,
        ref: 'AppointmentType',
        required: [true, 'Tipo de agendamento é obrigatório'],
        index: true // For analytics and filtering
    },
    scheduledStart: {
        type: Date,
        required: [true, 'Data/hora de início é obrigatória'],
        index: true // CRITICAL: For time-based queries
    },
    scheduledEnd: {
        type: Date,
        required: [true, 'Data/hora de término é obrigatória'],
        index: true // CRITICAL: For availability checks
    },
    actualStart: Date,
    actualEnd: Date,
    status: {
        type: String,
        enum: ['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'],
        default: 'scheduled',
        index: true // CRITICAL: Most common filter
    },
    priority: {
        type: String,
        enum: ['routine', 'urgent', 'emergency'],
        default: 'routine',
        index: true // For priority-based queries
    },
    notes: {
        type: String,
        maxlength: [500, 'Observações devem ter no máximo 500 caracteres']
    },
    privateNotes: {
        type: String,
        maxlength: [1000, 'Observações privadas devem ter no máximo 1000 caracteres']
    },
    remindersSent: {
        confirmation: { type: Boolean, default: false },
        reminder24h: { type: Boolean, default: false },
        reminder2h: { type: Boolean, default: false }
    },
    cancellationReason: String,
    rescheduleHistory: [{
        oldDate: { type: Date, required: true },
        newDate: { type: Date, required: true },
        reason: { type: String, required: true },
        rescheduleBy: { 
            type: String, 
            enum: ['patient', 'clinic'], 
            required: true 
        },
        timestamp: { type: Date, default: Date.now }
    }],
    // ADDED: Performance tracking fields
    checkedInAt: Date,
    completedAt: Date,
    duration: {
        type: Number,
        min: 0,
        max: 1440 // Max 24 hours in minutes
    },
    waitTime: {
        type: Number,
        min: 0,
        max: 600 // Max 10 hours wait time in minutes
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete (ret as any).__v;
            return ret;
        }
    }
});

// CRITICAL: Performance indexes for high-frequency queries

// 1. Primary scheduling queries - MOST IMPORTANT
AppointmentSchema.index({ 
    clinic: 1, 
    scheduledStart: 1, 
    status: 1 
}, { 
    name: 'clinic_schedule_status',
    background: true // Create index in background
});

// 2. Provider availability queries - MOST IMPORTANT
AppointmentSchema.index({ 
    provider: 1, 
    scheduledStart: 1, 
    scheduledEnd: 1,
    status: 1 
}, { 
    name: 'provider_availability',
    background: true
});

// 3. Patient appointment history - HIGH FREQUENCY
AppointmentSchema.index({ 
    patient: 1, 
    scheduledStart: -1, 
    status: 1 
}, { 
    name: 'patient_history',
    background: true
});

// 4. Daily schedule view - HIGH FREQUENCY  
AppointmentSchema.index({ 
    clinic: 1, 
    provider: 1, 
    scheduledStart: 1 
}, { 
    name: 'daily_schedule',
    background: true
});

// 5. Status-based queries - HIGH FREQUENCY
AppointmentSchema.index({ 
    status: 1, 
    scheduledStart: 1,
    clinic: 1
}, { 
    name: 'status_schedule',
    background: true
});

// 6. Range queries for calendar views
AppointmentSchema.index({ 
    scheduledStart: 1, 
    scheduledEnd: 1 
}, { 
    name: 'time_range',
    background: true
});

// 7. Reminder system queries
AppointmentSchema.index({ 
    scheduledStart: 1,
    status: 1,
    'remindersSent.confirmation': 1
}, { 
    name: 'reminder_queries',
    background: true
});

AppointmentSchema.index({ 
    scheduledStart: 1,
    status: 1,
    'remindersSent.reminder24h': 1
}, { 
    name: 'reminder_24h',
    background: true
});

// 8. Analytics and reporting indexes
AppointmentSchema.index({ 
    clinic: 1, 
    appointmentType: 1, 
    scheduledStart: -1 
}, { 
    name: 'analytics_type',
    background: true
});

AppointmentSchema.index({ 
    provider: 1, 
    status: 1, 
    scheduledStart: -1 
}, { 
    name: 'provider_analytics',
    background: true
});

// 9. Priority-based queries
AppointmentSchema.index({ 
    priority: 1, 
    scheduledStart: 1,
    status: 1
}, { 
    name: 'priority_schedule',
    background: true
});

// 10. Audit and created by queries
AppointmentSchema.index({ 
    createdBy: 1, 
    createdAt: -1 
}, { 
    name: 'created_by_audit',
    background: true
});

// ADDED: Pre-save middleware for data validation and automatic calculations
AppointmentSchema.pre('save', function(next) {
    // Validate appointment times
    if (this.scheduledStart >= this.scheduledEnd) {
        return next(new Error('Hora de início deve ser anterior à hora de término'));
    }
    
    // Calculate duration if actual times are available
    if (this.actualStart && this.actualEnd) {
        this.duration = Math.round((this.actualEnd.getTime() - this.actualStart.getTime()) / (1000 * 60));
    }
    
    // Calculate wait time if checked in
    if (this.checkedInAt && this.actualStart) {
        this.waitTime = Math.round((this.actualStart.getTime() - this.checkedInAt.getTime()) / (1000 * 60));
    }
    
    // Auto-set timestamps based on status changes
    if (this.isModified('status')) {
        switch (this.status) {
            case 'checked_in':
                if (!this.checkedInAt) {
                    this.checkedInAt = new Date();
                }
                break;
            case 'in_progress':
                if (!this.actualStart) {
                    this.actualStart = new Date();
                }
                break;
            case 'completed':
                if (!this.actualEnd) {
                    this.actualEnd = new Date();
                }
                if (!this.completedAt) {
                    this.completedAt = new Date();
                }
                break;
        }
    }
    
    next();
});

// ADDED: Static methods for common queries
AppointmentSchema.statics.findByTimeRange = function(
    clinicId: string, 
    startDate: Date, 
    endDate: Date, 
    options: { providerId?: string; status?: string } = {}
) {
    const query: any = {
        clinic: clinicId,
        scheduledStart: { $gte: startDate },
        scheduledEnd: { $lte: endDate }
    };
    
    if (options.providerId) query.provider = options.providerId;
    if (options.status) query.status = options.status;
    
    return this.find(query)
        .populate('patient', 'name phone email')
        .populate('provider', 'name specialties')
        .populate('appointmentType', 'name duration color category')
        .sort({ scheduledStart: 1 });
};

AppointmentSchema.statics.findAvailabilityConflicts = function(
    providerId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string
) {
    const query: any = {
        provider: providerId,
        status: { $nin: ['cancelled', 'no_show'] },
        $or: [
            // Overlapping appointments
            {
                scheduledStart: { $lt: endTime },
                scheduledEnd: { $gt: startTime }
            }
        ]
    };
    
    if (excludeAppointmentId) {
        query._id = { $ne: excludeAppointmentId };
    }
    
    return this.find(query).sort({ scheduledStart: 1 });
};

AppointmentSchema.statics.findPendingReminders = function(type: '24h' | '2h' | 'confirmation') {
    const now = new Date();
    const query: any = {
        status: { $in: ['scheduled', 'confirmed'] }
    };
    
    switch (type) {
        case '24h':
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            query.scheduledStart = { 
                $gte: tomorrow, 
                $lt: new Date(tomorrow.getTime() + 60 * 60 * 1000) 
            };
            query['remindersSent.reminder24h'] = false;
            break;
        case '2h':
            const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
            query.scheduledStart = { 
                $gte: twoHoursFromNow, 
                $lt: new Date(twoHoursFromNow.getTime() + 30 * 60 * 1000) 
            };
            query['remindersSent.reminder2h'] = false;
            break;
        case 'confirmation':
            query['remindersSent.confirmation'] = false;
            query.createdAt = { $gte: new Date(now.getTime() - 60 * 60 * 1000) }; // Last hour
            break;
    }
    
    return this.find(query)
        .populate('patient', 'name phone email')
        .populate('provider', 'name')
        .populate('clinic', 'name phone')
        .sort({ scheduledStart: 1 });
};

export const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);