import mongoose from 'mongoose';
import { paise } from '../utils/schemaTypes.js';

const ref = (required = false) => ({ type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required });

// A ready-made pizza: a fixed recipe built from ingredients (so stock is consumed the same way as custom pizzas).
const pizzaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 300 },
    imageUrl: String,
    tags: [{ type: String, trim: true }], // e.g. Rosso, Bianca, Truffle, Spicy
    components: {
      base: ref(true),
      sauce: ref(true),
      cheese: ref(true),
      veggies: [ref()],
    },
    priceOverride: paise({ default: null }), // otherwise price = sum of component prices
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

pizzaSchema.index({ isActive: 1, tags: 1 });
pizzaSchema.set('toJSON', { versionKey: false });

export default mongoose.model('Pizza', pizzaSchema);
