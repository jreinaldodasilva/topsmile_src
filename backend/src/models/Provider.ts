// ============================================================================
// backend/src/models/Provider.ts - New model for dentists/hygienists
// ============================================================================
import mongoose, { Document, Schema } from 'mongoose';


export interface IProvider extends Document {
    clinic: mongoose.Types.ObjectId;
    user?: mongoose.Types.ObjectId; // Link to User if provider has system access
    name: string;
    email?: string;
    phone?: string;
    specialties: string[]; // ['general_dentistry', 'orthodontics', 'oral_surgery']
    licenseNumber?: string;
    isActive: boolean;
    workingHours: {
        monday: { start: string; end: string; isWorking: boolean };
        tuesday: { start: string; end: string; isWorking: boolean };
        wednesday: { start: string; end: string; isWorking: boolean };
        thursday: { start: string; end: string; isWorking: boolean };
        friday: { start: string; end: string; isWorking: boolean };
        saturday: { start: string; end: string; isWorking: boolean };
        sunday: { start: string; end: string; isWorking: boolean };
    };
    timeZone: string;
    bufferTimeBefore: number; // minutes
    bufferTimeAfter: number; // minutes
    appointmentTypes: mongoose.Types.ObjectId[]; // What services this provider offers
    createdAt: Date;
    updatedAt: Date;
}

// Validation functions for working hours
const validateTimeFormat = (time: string) => {
    if (!time) return true; // Allow empty times
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};

const validateWorkingHours = function(hours: any) {
    // If working, both start and end times are required
    if (hours.isWorking && (!hours.start || !hours.end)) {
        return false;
    }
    
    // If both times are provided, validate format and order
    if (hours.start && hours.end) {
        // Validate time format
        if (!validateTimeFormat(hours.start) || !validateTimeFormat(hours.end)) {
            return false;
        }
        
        // Validate that start < end
        const startMinutes = timeToMinutes(hours.start);
        const endMinutes = timeToMinutes(hours.end);
        return startMinutes < endMinutes;
    }
    
    return true;
};

// Helper function to convert time string to minutes for comparison
const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const ProviderSchema = new Schema<IProvider>({
    clinic: {
        type: Schema.Types.ObjectId,
        ref: 'Clinic',
        required: [true, 'Clínica é obrigatória']
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    name: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true,
        maxlength: [100, 'Nome deve ter no máximo 100 caracteres']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(email: string) {
                return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            message: 'E-mail inválido'
        }
    },
    phone: {
        type: String,
        trim: true
    },
    specialties: [{
        type: String,
        enum: [
            'general_dentistry',
            'orthodontics', 
            'oral_surgery',
            'periodontics',
            'endodontics',
            'prosthodontics',
            'pediatric_dentistry',
            'oral_pathology',
            'dental_hygiene'
        ]
    }],
    licenseNumber: String,
    isActive: {
        type: Boolean,
        default: true
    },
    workingHours: {
        monday: { 
            start: { 
                type: String, 
                validate: {
                    validator: validateTimeFormat,
                    message: 'Formato de hora inválido. Use HH:MM (ex: 09:00)'
                }
            },
            end: { 
                type: String, 
                validate: {
                    validator: validateTimeFormat,
                    message: 'Formato de hora inválido. Use HH:MM (ex: 18:00)'
                }
            },
            isWorking: { type: Boolean, default: true }
        },
        tuesday: { 
            start: { 
                type: String, 
                validate: {
                    validator: validateTimeFormat,
                    message: 'Formato de hora inválido. Use HH:MM (ex: 09:00)'
                }
            },
            end: { 
                type: String, 
                validate: {
                    validator: validateTimeFormat,
                    message: 'Formato de hora inválido. Use HH:MM (ex: 18:00)'
                }
            },
            isWorking: { type: Boolean, default: true }
        },
        wednesday: { 
            start: { 
                type: String, 
                validate: {
                    validator: validateTimeFormat,
                    message: 'Formato de hora inválido. Use HH:MM (ex: 09:00)'
                }
            },
            end: { 
                type: String, 
                validate: {
                    validator: validateTimeFormat,
                    message: 'Formato de hora inválido. Use HH:MM (ex: 18:00)'
                }
            },
            isWorking: { type: Boolean, default: true }
        },
        thursday: { 
            start: { 
                type: String, 
                validate: {
                    validator: validateTimeFormat,
                    message: 'Formato de hora inválido. Use HH:MM (ex: 09:00)'
                }
            },
            end: { 
                type: String, 
                validate: {
                    validator: validateTimeFormat,
                    message: 'Formato de hora inválido. Use HH:MM (ex: 18:00)'
                }
            },
            isWorking: { type: Boolean, default: true }
        },
        friday: { 
            start: { 
                type: String, 
                validate: {
                    validator: validateTimeFormat,
                    message: 'Formato de hora inválido. Use HH:MM (ex: 09:00)'
                }
            },
            end: { 
                type: String, 
                validate: {
                    validator: validateTimeFormat,
                    message: 'Formato de hora inválido. Use HH:MM (ex: 18:00)'
                }
            },
            isWorking: { type: Boolean, default: true }
        },
        saturday: { 
            start: { 
                type: String, 
                validate: {
                    validator: validateTimeFormat,
                    message: 'Formato de hora inválido. Use HH:MM (ex: 09:00)'
                }
            },
            end: { 
                type: String, 
                validate: {
                    validator: validateTimeFormat,
                    message: 'Formato de hora inválido. Use HH:MM (ex: 18:00)'
                }
            },
            isWorking: { type: Boolean, default: false }
        },
        sunday: { 
            start: { 
                type: String, 
                validate: {
                    validator: validateTimeFormat,
                    message: 'Formato de hora inválido. Use HH:MM (ex: 09:00)'
                }
            },
            end: { 
                type: String, 
                validate: {
                    validator: validateTimeFormat,
                    message: 'Formato de hora inválido. Use HH:MM (ex: 18:00)'
                }
            },
            isWorking: { type: Boolean, default: false }
        }
    },
    timeZone: {
        type: String,
        default: 'America/Sao_Paulo'
    },
    bufferTimeBefore: {
        type: Number,
        default: 15,
        min: [0, 'Tempo de intervalo antes deve ser positivo'],
        max: [60, 'Tempo de intervalo antes deve ser no máximo 60 minutos']
    },
    bufferTimeAfter: {
        type: Number,
        default: 15,
        min: [0, 'Tempo de intervalo depois deve ser positivo'],
        max: [60, 'Tempo de intervalo depois deve ser no máximo 60 minutos']
    },
    appointmentTypes: [{
        type: Schema.Types.ObjectId,
        ref: 'AppointmentType'
    }]
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

// Pre-save middleware to validate working hours logic
ProviderSchema.pre('save', function(next) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of days) {
        const dayHours = this.workingHours[day as keyof typeof this.workingHours];
        
        if (!validateWorkingHours(dayHours)) {
            if (dayHours.isWorking && (!dayHours.start || !dayHours.end)) {
                return next(new Error(`Horário de trabalho para ${day}: horários de início e fim são obrigatórios quando está trabalhando`));
            }
            
            if (dayHours.start && dayHours.end) {
                const startMinutes = timeToMinutes(dayHours.start);
                const endMinutes = timeToMinutes(dayHours.end);
                
                if (startMinutes >= endMinutes) {
                    return next(new Error(`Horário de trabalho para ${day}: horário de início deve ser anterior ao horário de fim`));
                }
            }
        }
    }
    
    next();
});

// Indexes
ProviderSchema.index({ clinic: 1, isActive: 1 });
ProviderSchema.index({ email: 1 });

export const Provider = mongoose.model<IProvider>('Provider', ProviderSchema);