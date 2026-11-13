import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: Date,
    requestedIp: String,
    userAgent: { type: String, maxlength: 200 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL cleanup

export default mongoose.model('PasswordResetToken', schema);
