import { koboToInputText } from './money';

const cases: Array<[number, string]> = [
  [5, '0.05'],
  [10, '0.10'],
  [100, '1.00'],
  [500000, '5000.00'],
  [123456, '1234.56'],
];

const g = globalThis as any;

if (typeof g.describe === 'function' && typeof g.it === 'function') {
  g.describe('koboToInputText', () => {
    g.it.each(cases)('formats %p as %p', (kobo: number, expected: string) => {
      g.expect(koboToInputText(kobo)).toBe(expected);
    });
  });
}

export const moneyInputCases = cases;
