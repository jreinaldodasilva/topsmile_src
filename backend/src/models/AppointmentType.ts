// ============================================================================
// backend/src/models/AppointmentType.ts - Service/treatment types
// ============================================================================
import mongoose, { Document, Schema } from 'mongoose';

export interface IAppointmentType extends Document {
    clinic: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    duration: number; // minutes
    price?: number;
    color: string; // Hex color for calendar display
    isActive: boolean;
    category: 'consultation' | 'cleaning' | 'treatment' | 'surgery' | 'emergency';
    allowOnlineBooking: boolean;
    requiresApproval: boolean; // Staff must approve before confirming
    bufferBefore: number; // Override provider buffer if needed
    bufferAfter: number;
    preparationInstructions?: string; // Patient prep instructions
    postTreatmentInstructions?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AppointmentTypeSchema = new Schema<IAppointmentType>({
    clinic: {
        type: Schema.Types.ObjectId,
        ref: 'Clinic',
        required: [true, 'Clínica é obrigatória']
    },
    name: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true,
        maxlength: [100, 'Nome deve ter no máximo 100 caracteres']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Descrição deve ter no máximo 500 caracteres']
    },
    duration: {
        type: Number,
        required: [true, 'Duração é obrigatória'],
        min: [15, 'Duração mínima é 15 minutos'],
        max: [480, 'Duração máxima é 8 horas']
    },
    price: {
        type: Number,
        min: [0, 'Preço deve ser positivo']
    },
    color: {
        type: String,
        required: [true, 'Cor é obrigatória'],
        validate: {
            validator: function(color: string) {
                return /^#[0-9A-F]{6}$/i.test(color);
            },
            message: 'Cor deve estar no formato hexadecimal (#RRGGBB)'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    category: {
        type: String,
        enum: ['consultation', 'cleaning', 'treatment', 'surgery', 'emergency'],
        required: [true, 'Categoria é obrigatória']
    },
    allowOnlineBooking: {
        type: Boolean,
        default: true
    },
    requiresApproval: {
        type: Boolean,
        default: false
    },
    bufferBefore: {
        type: Number,
        default: 0,
        min: [0, 'Tempo de intervalo antes deve ser positivo'],
        max: [120, 'Tempo de intervalo antes deve ser no máximo 2 horas']
    },
    bufferAfter: {
        type: Number,
        default: 0,
        min: [0, 'Tempo de intervalo depois deve ser positivo'], 
        max: [120, 'Tempo de intervalo depois deve ser no máximo 2 horas']
    },
    preparationInstructions: {
        type: String,
        maxlength: [1000, 'Instruções de preparo devem ter no máximo 1000 caracteres']
    },
    postTreatmentInstructions: {
        type: String,
        maxlength: [1000, 'Instruções pós-tratamento devem ter no máximo 1000 caracteres']
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

// Indexes
AppointmentTypeSchema.index({ clinic: 1, isActive: 1 });
AppointmentTypeSchema.index({ category: 1 });

export const AppointmentType = mongoose.model<IAppointmentType>('AppointmentType', AppointmentTypeSchema);
