import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { ORDER_STATUS, ORDER_STATUSES } from '../constants/orderStatus.js';
import { count, paise } from '../utils/schemaTypes.js';

const oid = (ref, extra = {}) => ({ type: mongoose.Schema.Types.ObjectId, ref, ...extra });

// Frozen copy of what was ordered, so later catalogue edits never rewrite history.
const componentSnapshot = new mongoose.Schema(
  {
    ingredient: oid('Ingredient', { required: true }),
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: paise({ required: true }),
  },
  { _id: false },
);

const itemSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['preset', 'custom'], required: true },
    pizza: oid('Pizza'), // preset only
    name: { type: String, required: true }, // snapshot, e.g. "Custom pizza" or the preset name
    components: { type: [componentSnapshot], validate: (v) => v.length > 0 },
    unitPrice: paise({ required: true }),
    qty: { type: Number, required: true, min: 1, max: 10, validate: Number.isInteger },
  },
  { _id: true },
);
itemSchema.pre('validate', function (next) {
  if (this.kind === 'preset' && !this.pizza) this.invalidate('pizza', 'pizza is required for preset items');
  next();
});

const addressSnapshot = new mongoose.Schema(
  {
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: String,
    pincode: { type: String, required: true },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, immutable: true }, // human-friendly, e.g. FF-LZ3K9A2B
    user: oid('User', { required: true, index: true }),
    items: { type: [itemSchema], validate: (v) => v.length > 0 },

    subtotal: paise({ required: true }),
    tax: paise({ required: true, default: 0 }),
    deliveryFee: paise({ required: true, default: 0 }),
    packagingFee: paise({ required: true, default: 0 }),
    total: paise({ required: true }),

    address: { type: addressSnapshot, required: true },
    phone: { type: String, required: true },
    notes: { type: String, trim: true, maxlength: 300 }, // kitchen / allergy notes
    dropoffInstructions: { type: String, trim: true, maxlength: 200 },

    status: { type: String, enum: ORDER_STATUSES, default: ORDER_STATUS.PENDING_PAYMENT },
    statusHistory: [
      new mongoose.Schema(
        { status: { type: String, enum: ORDER_STATUSES, required: true }, at: { type: Date, default: Date.now }, by: oid('Admin') },
        { _id: false },
      ),
    ],

    payment: oid('Payment'), // current payment record
    paidAt: Date,
    needsReview: { type: Boolean, default: false }, // e.g. stock conflict after payment
    reviewReason: String,
  },
  { timestamps: true },
);

orderSchema.pre('validate', function (next) {
  if (this.isNew) {
    if (!this.orderNumber) this.orderNumber = `FF-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    if (!this.statusHistory.length) this.statusHistory.push({ status: this.status });
    const expected = this.subtotal + this.tax + this.deliveryFee + this.packagingFee;
    if (Number.isInteger(expected) && this.total !== expected) this.invalidate('total', 'total must equal subtotal + tax + fees');
  }
  next();
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ needsReview: 1 }, { partialFilterExpression: { needsReview: true } });

orderSchema.set('toJSON', { versionKey: false });

export default mongoose.model('Order', orderSchema);
