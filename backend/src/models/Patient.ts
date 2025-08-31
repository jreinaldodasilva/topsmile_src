
// backend/src/models/Patient.ts (Future feature)
import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
    name: string;
    email?: string;
    phone: string;
    birthDate?: Date;
    gender?: 'male' | 'female' | 'other';
    cpf?: string;
    address: {
        street?: string;
        number?: string;
        complement?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
        zipCode?: string;
    };
    clinic: mongoose.Types.ObjectId;
    emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
    };
    medicalHistory: {
        allergies?: string[];
        medications?: string[];
        conditions?: string[];
        notes?: string;
    };
    status: 'active' | 'inactive';
    createdAt: Date;
    updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>({
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
            validator: function (email: string) {
                return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            message: 'E-mail inválido'
        }
    },
    phone: {
        type: String,
        required: [true, 'Telefone é obrigatório'],
        trim: true
    },
    birthDate: Date,
    gender: {
        type: String,
        enum: ['male', 'female', 'other']
    },
    cpf: {
        type: String,
        trim: true,
        validate: {
            validator: function (cpf: string) {
                return !cpf || /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf);
            },
            message: 'CPF inválido'
        }
    },
    address: {
        street: String,
        number: String,
        complement: String,
        neighborhood: String,
        city: String,
        state: String,
        zipCode: String
    },
    clinic: {
        type: Schema.Types.ObjectId,
        ref: 'Clinic',
        required: true
    },
    emergencyContact: {
        name: String,
        phone: String,
        relationship: String
    },
    medicalHistory: {
        allergies: [String],
        medications: [String],
        conditions: [String],
        notes: String
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
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
PatientSchema.index({ clinic: 1 });
PatientSchema.index({ email: 1 });
PatientSchema.index({ phone: 1 });
PatientSchema.index({ status: 1 });

export const Patient = mongoose.model<IPatient>('Patient', PatientSchema);