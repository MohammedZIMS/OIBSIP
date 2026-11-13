// Reusable Mongoose field definitions.
const isInt = { validator: Number.isInteger, message: '{PATH} must be a whole number' };

/** Integer paise (never floats). */
export const paise = (extra = {}) => ({ type: Number, min: 0, validate: isInt, ...extra });
/** Non-negative integer count (stock units, quantities). */
export const count = (extra = {}) => ({ type: Number, min: 0, validate: isInt, ...extra });
