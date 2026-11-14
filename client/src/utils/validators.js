export const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v.trim());
export const isPhone = (v) => /^\+?[0-9 ()-]{7,15}$/.test(v.trim());
