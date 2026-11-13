import mongoose from 'mongoose';
import { ALERT_STATUS } from '../constants/inventory.js';

// One open alert per ingredient while it is below threshold. This drives email de-duplication:
// a new email is sent only when notifiedAt is empty or older than the cool-down window.
const alertSchema = new mongoose.Schema(
  {
    ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    status: { type: String, enum: Object.values(ALERT_STATUS), default: ALERT_STATUS.OPEN },
    quantityAtAlert: { type: Number, required: true, min: 0 },
    threshold: { type: Number, required: true, min: 0 },
    lastNotifiedAt: Date,
    notifyCount: { type: Number, default: 0, min: 0 },
    lastError: String,
    resolvedAt: Date,
  },
  { timestamps: true },
);

// At most one OPEN alert per ingredient.
alertSchema.index({ ingredient: 1 }, { unique: true, partialFilterExpression: { status: ALERT_STATUS.OPEN } });
alertSchema.index({ status: 1, lastNotifiedAt: 1 });

alertSchema.set('toJSON', { versionKey: false });

export default mongoose.model('InventoryAlert', alertSchema);
