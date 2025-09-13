// backend/src/models/Contact.ts - FIXED VERSION
import mongoose, { Document, Schema } from 'mongoose';

export interface IContact extends Document {
    name: string;
    email: string;
    clinic: string; // Clinic name as string (for external leads)
    specialty: string;
    phone: string;
    status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
    source: string;
    notes: string;
    // FIXED: Link assignedTo to a clinic context for data isolation
    assignedTo?: mongoose.Types.ObjectId; // refs User
    assignedToClinic?: mongoose.Types.ObjectId; // refs Clinic - for data isolation
    followUpDate?: Date;
    // ADDED: Additional tracking fields
    priority: 'low' | 'medium' | 'high';
    leadScore?: number; // 0-100 scoring system
    lastContactedAt?: Date;
    conversionDetails?: {
        convertedAt: Date;
        convertedBy: mongoose.Types.ObjectId;
        conversionNotes: string;
        estimatedValue?: number;
    };
    metadata: {
        ipAddress?: string;
        userAgent?: string;
        referrer?: string;
        utmSource?: string;
        utmMedium?: string;
        utmCampaign?: string;
    };
    // Soft delete fields
    deletedAt?: Date;
    deletedBy?: mongoose.Types.ObjectId;
    // Merge tracking
    mergedInto?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ContactSchema = new Schema<IContact>({
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
        trim: true,
        lowercase: true,
        validate: {
            validator: function (email: string) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            message: 'E-mail inválido'
        }
    },
    clinic: {
        type: String,
        required: [true, 'Nome da clínica é obrigatório'],
        trim: true,
        maxlength: [100, 'Nome da clínica deve ter no máximo 100 caracteres']
    },
    specialty: {
        type: String,
        required: [true, 'Especialidade é obrigatória'],
        trim: true,
        maxlength: [100, 'Especialidade deve ter no máximo 100 caracteres']
    },
    phone: {
        type: String,
        required: [true, 'Telefone é obrigatório'],
        trim: true,
        validate: {
            validator: function (phone: string) {
                return /^[\d\s\-()+]{10,20}$/.test(phone);
            },
            message: 'Telefone inválido'
        }
    },
    status: {
        type: String,
        enum: ['new', 'contacted', 'qualified', 'converted', 'closed'],
        default: 'new',
        index: true // IMPROVED: Add index for frequent queries
    },
    source: {
        type: String,
        default: 'website_contact_form',
        index: true // IMPROVED: Add index for analytics
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notas devem ter no máximo 1000 caracteres']
    },
    // FIXED: Proper clinic association for data isolation
    assignedTo: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedToClinic: {
        type: Schema.Types.ObjectId,
        ref: 'Clinic',
        index: true // CRITICAL: Index for data isolation
    },
    followUpDate: {
        type: Date,
        index: true // IMPROVED: Index for follow-up queries
    },
    // ADDED: Priority field for lead management
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
        index: true
    },
    leadScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
    },
    lastContactedAt: {
        type: Date,
        index: true
    },
    conversionDetails: {
        convertedAt: Date,
        convertedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        conversionNotes: String,
        estimatedValue: {
            type: Number,
            min: 0
        }
    },
    metadata: {
        ipAddress: String,
        userAgent: String,
        referrer: String,
        utmSource: String,
        utmMedium: String,
        utmCampaign: String
    },
    // Soft delete fields
    deletedAt: Date,
    deletedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    // Merge tracking
    mergedInto: {
        type: Schema.Types.ObjectId,
        ref: 'Contact'
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

// IMPROVED: Performance indexes for common queries
ContactSchema.index({ email: 1 });
ContactSchema.index({ status: 1, createdAt: -1 }); // Status with time sorting
ContactSchema.index({ assignedToClinic: 1, status: 1 }); // Clinic isolation + status
ContactSchema.index({ priority: 1, status: 1 }); // Priority management
ContactSchema.index({ createdAt: -1 }); // Chronological queries
ContactSchema.index({ followUpDate: 1, status: 1 }); // Follow-up management
ContactSchema.index({ leadScore: -1 }); // Lead scoring queries
ContactSchema.index({ source: 1, createdAt: -1 }); // Source analytics

// ADDED: Text search index for name, email, clinic
ContactSchema.index({
    name: 'text',
    email: 'text',
    clinic: 'text',
    specialty: 'text'
}, {
    name: 'contact_text_search'
});

// IMPROVED: Compound indexes for complex queries
ContactSchema.index({ 
    assignedToClinic: 1, 
    status: 1, 
    priority: -1, 
    createdAt: -1 
}); // Clinic dashboard queries

// ADDED: Pre-save middleware for data validation
ContactSchema.pre('save', function(next) {
    // Auto-assign clinic based on assignedTo user if not set
    if (this.assignedTo && !this.assignedToClinic) {
        // Note: This would require populating the user to get their clinic
        // For now, we'll handle this in the service layer
    }
    
    // Update lastContactedAt when status changes to 'contacted'
    if (this.isModified('status') && this.status === 'contacted') {
        this.lastContactedAt = new Date();
    }
    
    // Auto-fill conversion details when status becomes 'converted'
    if (this.isModified('status') && this.status === 'converted' && !this.conversionDetails?.convertedAt) {
        if (!this.conversionDetails) {
            this.conversionDetails = {
                convertedAt: new Date(),
                convertedBy: this.assignedTo as any,
                conversionNotes: ''
            };
        } else {
            this.conversionDetails.convertedAt = new Date();
        }
    }
    
    next();
});

// ADDED: Static methods for common queries
ContactSchema.statics.findByClinic = function(clinicId: string) {
    return this.find({ assignedToClinic: clinicId }).sort({ createdAt: -1 });
};

ContactSchema.statics.findActiveLeads = function(clinicId?: string) {
    const query: any = { 
        status: { $in: ['new', 'contacted', 'qualified'] } 
    };
    if (clinicId) {
        query.assignedToClinic = clinicId;
    }
    return this.find(query).sort({ priority: -1, createdAt: -1 });
};

ContactSchema.statics.findOverdueFollowUps = function(clinicId?: string) {
    const query: any = {
        followUpDate: { $lt: new Date() },
        status: { $nin: ['converted', 'closed'] }
    };
    if (clinicId) {
        query.assignedToClinic = clinicId;
    }
    return this.find(query).sort({ followUpDate: 1 });
};

export const Contact = mongoose.model<IContact>('Contact', ContactSchema);