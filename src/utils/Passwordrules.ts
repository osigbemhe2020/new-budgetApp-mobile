export type PasswordRule = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  {
    id: 'symbol',
    label: 'One number or special character',
    test: (p) => /[0-9]/.test(p) || /[^A-Za-z0-9\s]/.test(p),
  },
];

const LEVELS = ['Weak', 'Fair', 'Good', 'Strong', 'Very strong'];

export function evaluatePassword(password: string) {
  const rules = PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(password) }));
  const metCount = rules.filter((r) => r.met).length;
  const isValid = metCount === rules.length;
  // 4 meter bars: one per rule met, plus a 4th for a long password (12+) that meets every rule.
  const score = metCount + (isValid && password.length >= 12 ? 1 : 0);
  return { rules, isValid, score, label: LEVELS[score] };
}

export function isPasswordValid(password: string) {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}