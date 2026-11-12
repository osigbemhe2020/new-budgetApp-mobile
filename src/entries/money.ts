// Money is handled as whole kobo (integer). Never use floats: 0.1 + 0.2 !== 0.3 in JavaScript.

// Used while typing: allows only digits and a dot, with at most 2 decimal places.
export function isValidNairaInput(text: string): boolean {
  return /^\d{0,12}(\.\d{0,2})?$/.test(text);
}

// "12.5" -> 1250, "5000" -> 500000. Returns null for empty, zero or invalid input.
export function parseNairaToKobo(text: string): number | null {
  const m = /^(\d*)(?:\.(\d{0,2}))?$/.exec(text.trim());
  if (!m || (!m[1] && !m[2])) return null;
  const kobo = Number(m[1] || '0') * 100 + Number((m[2] ?? '').padEnd(2, '0'));
  return Number.isSafeInteger(kobo) && kobo > 0 ? kobo : null;
}

// 1500000 -> "15,000.00", -500000 -> "−5,000.00". Integer maths only, so no floating-point tail.
// No ₦ symbol: add it where you display it.
export function formatNaira(kobo: number): string {
  const sign = kobo < 0 ? '\u2212' : '';
  const abs = Math.abs(kobo);
  const naira = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const rest = String(abs % 100).padStart(2, '0');
  return `${sign}${naira}.${rest}`;
}