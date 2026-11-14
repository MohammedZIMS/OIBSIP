// Reusable Mongoose field definitions.
// null/undefined are allowed (optional fields); anything else must be a whole number
const isInt = { validator: (v) => v == null || Number.isInteger(v), message: '{PATH} must be a whole number' };

/** Integer paise (never floats). */
export const paise = (extra = {}) => ({ type: Number, min: 0, validate: isInt, ...extra });
/** Non-negative integer count (stock units, quantities). */
export const count = (extra = {}) => ({ type: Number, min: 0, validate: isInt, ...extra });
