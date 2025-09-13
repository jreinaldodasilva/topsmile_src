// backend/src/models/User.ts
import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'super_admin' | 'admin' | 'manager' | 'dentist' | 'assistant';
    clinic?: mongoose.Types.ObjectId;
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
    name: {
        type: String,
        required: [true, 'Nome é obrigatório'],
        trim: true,
        minlength: [2, 'Nome deve ter pelo menos 2 caracteres'],
        maxlength: [100, 'Nome deve ter no máximo 100 caracteres']
    },
    email: {
        type: String,
        required: [true, 'E-mail é obrigatório'],
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: function (email: string) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            message: 'E-mail inválido'
        }
    },
    password: {
        type: String,
        required: [true, 'Senha é obrigatória'],
        minlength: [6, 'Senha deve ter pelo menos 6 caracteres'],
        select: false // Don't include password in queries by default
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin', 'manager', 'dentist', 'assistant'],
        default: 'admin'
    },
    clinic: {
        type: Schema.Types.ObjectId,
        ref: 'Clinic'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete (ret as any).__v;
            delete (ret as any).password; // Remove password from JSON output
            return ret;
        }
    }
});

// Password strength validation - runs before other validations
UserSchema.pre('validate', function(next) {
    if (this.isNew || this.isModified('password')) {
        const password = this.password;
        
        // Check for minimum length (additional check beyond schema validation)
        if (password.length < 8) {
            this.invalidate('password', 'Senha deve ter pelo menos 8 caracteres');
            return next();
        }
        
        // Check for uppercase letter
        if (!/(?=.*[A-Z])/.test(password)) {
            this.invalidate('password', 'Senha deve conter pelo menos uma letra maiúscula');
            return next();
        }
        
        // Check for lowercase letter
        if (!/(?=.*[a-z])/.test(password)) {
            this.invalidate('password', 'Senha deve conter pelo menos uma letra minúscula');
            return next();
        }
        
        // Check for number
        if (!/(?=.*\d)/.test(password)) {
            this.invalidate('password', 'Senha deve conter pelo menos um número');
            return next();
        }
        
        // Optional: Check for special character (uncomment if desired)
        // if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
        //     this.invalidate('password', 'Senha deve conter pelo menos um caractere especial');
        //     return next();
        // }
        
        // Check for common weak passwords
        const commonWeakPasswords = [
            '12345678', 'password', 'password123', 'admin123', 
            'qwerty123', '123456789', 'abc123456'
        ];
        
        if (commonWeakPasswords.includes(password.toLowerCase())) {
            this.invalidate('password', 'Senha muito comum. Escolha uma senha mais segura');
            return next();
        }
    }
    
    next();
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Indexes
UserSchema.index({ role: 1 });
UserSchema.index({ clinic: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);