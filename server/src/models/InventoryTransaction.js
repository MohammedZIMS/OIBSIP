import mongoose from 'mongoose';
import { TRANSACTION_TYPES } from '../constants/inventory.js';

// Immutable stock ledger: one row per stock change. Rows are never updated or deleted.
const transactionSchema = new mongoose.Schema(
  {
    ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    type: { type: String, enum: Object.values(TRANSACTION_TYPES), required: true },
    quantityChange: { type: Number, required: true, validate: Number.isInteger }, // signed
    quantityBefore: { type: Number, required: true, min: 0, validate: Number.isInteger },
    quantityAfter: { type: Number, required: true, min: 0, validate: Number.isInteger },
    note: { type: String, trim: true, maxlength: 300 },
    referenceNo: { type: String, trim: true, maxlength: 60 }, // PO number or lot id
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

transactionSchema.index({ ingredient: 1, createdAt: -1 });
transactionSchema.index({ order: 1 }, { sparse: true });
transactionSchema.index({ type: 1, createdAt: -1 });

const BLOCKED = ['updateOne', 'updateMany', 'findOneAndUpdate', 'findOneAndReplace', 'replaceOne', 'deleteOne', 'deleteMany', 'findOneAndDelete'];
const block = () => { throw new Error('InventoryTransaction is immutable: updates and deletes are not allowed'); };
for (const op of BLOCKED) {
  // updateOne/deleteOne also exist as document methods, so cover both.
  if (op === 'updateOne' || op === 'deleteOne') transactionSchema.pre(op, { document: true, query: true }, block);
  else transactionSchema.pre(op, block);
}
transactionSchema.pre('save', function (next) {
  if (!this.isNew) return next(new Error('InventoryTransaction is immutable'));
  next();
});

transactionSchema.set('toJSON', { versionKey: false });

export default mongoose.model('InventoryTransaction', transactionSchema);
