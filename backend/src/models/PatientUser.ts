import mongoose, { Document, Schema, CallbackWithoutResultAndOptionalError } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IPatientUser extends Document {
  patient: mongoose.Types.ObjectId; // References Patient
  email: string;
  password: string;
  isActive: boolean;
  emailVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  incLoginAttempts(): void;
  resetLoginAttempts(): void;
}

const PatientUserSchema = new Schema<IPatientUser>({
  patient: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    unique: true
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
    minlength: [6, 'Senha deve ter pelo menos 6 caracteres']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      delete ret.verificationToken;
      delete ret.resetPasswordToken;
      delete ret.resetPasswordExpires;
      return ret;
    }
  }
});

// Indexes
PatientUserSchema.index({ patient: 1 });
PatientUserSchema.index({ verificationToken: 1 });
PatientUserSchema.index({ resetPasswordToken: 1 });

// Pre-save middleware to hash password
PatientUserSchema.pre<IPatientUser>('save', async function (next: CallbackWithoutResultAndOptionalError) {
  const user = this as IPatientUser & mongoose.Document;

  if (!user.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Instance method to compare password
PatientUserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if account is locked
PatientUserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

// Instance method to increment login attempts
PatientUserSchema.methods.incLoginAttempts = function (): void {
  if (this.lockUntil && this.lockUntil < new Date()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
  } else {
    this.loginAttempts += 1;
    if (this.loginAttempts >= 5) {
      this.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    }
  }
};

// Instance method to reset login attempts
PatientUserSchema.methods.resetLoginAttempts = function (): void {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
};

export const PatientUser = mongoose.model<IPatientUser>('PatientUser', PatientUserSchema);
