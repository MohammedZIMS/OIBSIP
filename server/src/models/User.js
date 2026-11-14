import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { AUTH } from '../constants/auth.js';

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
    line1: { type: String, required: true, trim: true, maxlength: 120 },
    line2: { type: String, trim: true, maxlength: 120 },
    city: { type: String, required: true, trim: true, maxlength: 60 },
    state: { type: String, trim: true, maxlength: 60 },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
    instructions: { type: String, trim: true, maxlength: 200 },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^\S+@\S+\.\S+$/ },
    phone: { type: String, trim: true, match: /^\+?[0-9 ()-]{7,15}$/ },
    passwordHash: { type: String, required: true, select: false },
    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
    addresses: { type: [addressSchema], default: [] },
    // JWTs issued before this moment are rejected (password change / "revoke sessions").
    passwordChangedAt: Date,
    lastLoginAt: Date,
  },
  { timestamps: true },
);

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};
userSchema.statics.hashPassword = (plain) => bcrypt.hash(plain, AUTH.BCRYPT_COST);
userSchema.statics.compareHash = (plain, hash) => bcrypt.compare(plain, hash);

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
