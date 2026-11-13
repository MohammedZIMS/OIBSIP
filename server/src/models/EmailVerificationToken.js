import mongoose from 'mongoose';

// Only hashes are stored. The raw link token and 6-digit backup code exist only in the email.
const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true, lowercase: true }, // address being verified
    tokenHash: { type: String, required: true, unique: true },
    codeHash: { type: String, required: true },
    codeAttempts: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, required: true },
    usedAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB removes expired documents (TTL)

export default mongoose.model('EmailVerificationToken', schema);
