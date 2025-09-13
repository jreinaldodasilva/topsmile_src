// backend/src/models/RefreshToken.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IRefreshToken extends Document {
    token: string;
    userId: mongoose.Types.ObjectId | any;
    expiresAt: Date;
    isRevoked: boolean;
    deviceInfo?: {
        userAgent?: string;
        ipAddress?: string;
        deviceId?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    isRevoked: {
        type: Boolean,
        default: false,
        index: true
    },
    deviceInfo: {
        userAgent: String,
        ipAddress: String,
        deviceId: String
    }
}, {
    timestamps: true
});

// TTL index for automatic cleanup
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for active token queries
RefreshTokenSchema.index({ userId: 1, isRevoked: 1 });

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
