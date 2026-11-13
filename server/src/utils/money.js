// All money is integer paise. Convert only for display.
export const toPaise = (rupees) => Math.round(Number(rupees) * 100);
export const toRupees = (paise) => paise / 100;
export const percentOf = (paise, percent) => Math.round((paise * percent) / 100);
