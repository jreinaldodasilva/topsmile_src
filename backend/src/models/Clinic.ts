// backend/src/models/Clinic.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IClinic extends Document {
    name: string;
    email: string;
    phone: string;
    address: {
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
        zipCode: string;
    };
    cnpj?: string;
    subscription: {
        plan: 'basic' | 'professional' | 'premium';
        status: 'active' | 'inactive' | 'suspended' | 'canceled';
        startDate: Date;
        endDate?: Date;
    };
    settings: {
        timezone: string;
        workingHours: {
            monday: { start: string; end: string; isWorking: boolean };
            tuesday: { start: string; end: string; isWorking: boolean };
            wednesday: { start: string; end: string; isWorking: boolean };
            thursday: { start: string; end: string; isWorking: boolean };
            friday: { start: string; end: string; isWorking: boolean };
            saturday: { start: string; end: string; isWorking: boolean };
            sunday: { start: string; end: string; isWorking: boolean };
        };
        appointmentDuration: number; // minutes
        allowOnlineBooking: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}

const ClinicSchema = new Schema<IClinic>({
    name: {
        type: String,
        required: [true, 'Nome da clínica é obrigatório'],
        trim: true,
        maxlength: [100, 'Nome deve ter no máximo 100 caracteres']
    },
    email: {
        type: String,
        required: [true, 'E-mail é obrigatório'],
        trim: true,
        lowercase: true,
        validate: {
            validator: function (email: string) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            message: 'E-mail inválido'
        }
    },
    phone: {
        type: String,
        required: [true, 'Telefone é obrigatório'],
        trim: true
    },
    address: {
        street: { type: String, required: true, trim: true },
        number: { type: String, required: true, trim: true },
        complement: { type: String, trim: true },
        neighborhood: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true, maxlength: 2 },
        zipCode: { type: String, required: true, trim: true }
    },
    cnpj: {
        type: String,
        trim: true,
        validate: {
            validator: function (cnpj: string) {
                return !cnpj || /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(cnpj);
            },
            message: 'CNPJ inválido'
        }
    },
    subscription: {
        plan: {
            type: String,
            enum: ['basic', 'professional', 'premium'],
            default: 'basic'
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'suspended', 'canceled'],
            default: 'active'
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: Date
    },
    settings: {
        timezone: {
            type: String,
            default: 'America/Sao_Paulo'
        },
        workingHours: {
            monday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
            tuesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
            wednesday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
            thursday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
            friday: { start: String, end: String, isWorking: { type: Boolean, default: true } },
            saturday: { start: String, end: String, isWorking: { type: Boolean, default: false } },
            sunday: { start: String, end: String, isWorking: { type: Boolean, default: false } }
        },
        appointmentDuration: {
            type: Number,
            default: 60 // minutes
        },
        allowOnlineBooking: {
            type: Boolean,
            default: true
        }
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete (ret as any).__v;
            return ret;
        }
    }
});

// Indexes
ClinicSchema.index({ email: 1 });
ClinicSchema.index({ 'subscription.status': 1 });

export const Clinic = mongoose.model<IClinic>('Clinic', ClinicSchema);
