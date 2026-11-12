// All money is integer paise. Convert only for display.
export const formatPaise = (paise) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);
