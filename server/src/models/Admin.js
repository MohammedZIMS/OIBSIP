import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { AUTH } from '../constants/auth.js';

// Separate collection from users: no field on a user can ever grant admin rights.
const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^\S+@\S+\.\S+$/ },
    passwordHash: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true },
    failedAttempts: { type: Number, default: 0, min: 0 },
    lockedUntil: Date,
    lastLoginAt: Date,
    passwordChangedAt: Date,
  },
  { timestamps: true },
);

adminSchema.virtual('isLocked').get(function () {
  return Boolean(this.lockedUntil && this.lockedUntil > new Date());
});
adminSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};
adminSchema.statics.hashPassword = (plain) => bcrypt.hash(plain, AUTH.BCRYPT_COST);

adminSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Admin', adminSchema);
