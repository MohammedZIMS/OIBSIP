// Same rules as the server (server/src/validators/auth.schema.js).
export const PASSWORD_RULES = [
  { id: 'len', label: 'At least 8 characters', test: (p) => p.length >= 8 && p.length <= 72 },
  { id: 'lower', label: 'A lowercase letter', test: (p) => /[a-z]/.test(p) },
  { id: 'upper', label: 'An uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { id: 'num', label: 'A number', test: (p) => /\d/.test(p) },
  { id: 'sym', label: 'A special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];
export const checkPassword = (p) => PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(p) }));
export const isStrongPassword = (p) => PASSWORD_RULES.every((r) => r.test(p));
export const strengthLabel = (p) => ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'][PASSWORD_RULES.filter((r) => r.test(p)).length];
