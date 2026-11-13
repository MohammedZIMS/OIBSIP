import mongoose from 'mongoose';
import { CURRENCY, PAYMENT_PROVIDER, PAYMENT_STATUS } from '../constants/payment.js';
import { paise } from '../utils/schemaTypes.js';

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: String, default: PAYMENT_PROVIDER, immutable: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, unique: true, sparse: true },
    razorpaySignature: { type: String, select: false },
    amount: paise({ required: true }), // paise, equals Order.total
    currency: { type: String, default: CURRENCY },
    status: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.CREATED },
    method: String, // upi, card, netbanking (from Razorpay)
    failureReason: String,
    paidAt: Date,
    // Idempotency: ids of webhook events already applied.
    processedEvents: { type: [String], select: false, default: [] },
  },
  { timestamps: true },
);

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.set('toJSON', { versionKey: false });

export default mongoose.model('Payment', paymentSchema);
