import mongoose from 'mongoose';
import { DEFAULT_THRESHOLD, INGREDIENT_CATEGORIES, INGREDIENT_UNITS } from '../constants/inventory.js';
import { count, paise } from '../utils/schemaTypes.js';

const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    category: { type: String, enum: INGREDIENT_CATEGORIES, required: true },
    description: { type: String, trim: true, maxlength: 300 },
    imageUrl: String,
    dietaryTags: [{ type: String, enum: ['vegetarian', 'vegan', 'spicy', 'gluten-friendly'] }],
    price: paise({ required: true }), // paise added to a pizza when selected
    quantity: count({ required: true, default: 0 }), // current stock; never below 0
    unit: { type: String, enum: INGREDIENT_UNITS, default: 'unit' },
    threshold: count({ default: DEFAULT_THRESHOLD }), // low-stock alert level (per item)
    isActive: { type: Boolean, default: true },
    supplierNote: { type: String, trim: true, maxlength: 200 },
  },
  { timestamps: true },
);

ingredientSchema.index({ category: 1, name: 1 }, { unique: true });
ingredientSchema.index({ category: 1, isActive: 1 });

ingredientSchema.virtual('stockStatus').get(function () {
  if (this.quantity <= 0) return 'out';
  return this.quantity < this.threshold ? 'low' : 'ok';
});

ingredientSchema.set('toJSON', { virtuals: true, versionKey: false, transform: (_d, ret) => { delete ret.id; return ret; } });

export default mongoose.model('Ingredient', ingredientSchema);
