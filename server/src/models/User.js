import mongoose from 'mongoose';
import { ROLES } from '../config/permissions.js';
import { basePlugin } from './plugins.js';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, index: true },
    // Admin permissions: { bookings: ['view','add','edit'], ... }
    permissions: { type: Schema.Types.Mixed, default: {} },
    // Admin data scope. Empty arrays = no restriction.
    scope: {
      brands: [{ type: Schema.Types.ObjectId, ref: 'Brand' }],
      regions: [{ type: String, trim: true }],
    },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee' },
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },
    mustChangePassword: { type: Boolean, default: false },
    failedLogins: { type: Number, default: 0 },
    lockUntil: Date,
    twoFactor: {
      enabled: { type: Boolean, default: false },
      secretEnc: { type: String, select: false },
      pendingSecretEnc: { type: String, select: false },
    },
    // SHA-256 hashes of the active refresh-token ids (max 10 sessions). Raw tokens are never stored.
    refreshTokens: { type: [String], select: false },
    lastLoginAt: Date,
    passwordChangedAt: Date,
  },
  { timestamps: true },
);

userSchema.plugin(basePlugin, {
  hide: ['passwordHash', 'refreshTokens', 'twoFactor.secretEnc', 'twoFactor.pendingSecretEnc', 'failedLogins'],
});

export const User = mongoose.model('User', userSchema);
