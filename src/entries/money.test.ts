import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { calculateBalanceKobo, koboToInputText, sortEntriesByDate } from './money';

describe('money helpers', () => {
  it('formats whole-kobo values for the amount input', () => {
    assert.equal(koboToInputText(5), '0.05');
    assert.equal(koboToInputText(10), '0.10');
    assert.equal(koboToInputText(100), '1.00');
    assert.equal(koboToInputText(500000), '5000.00');
    assert.equal(koboToInputText(123456), '1234.56');
  });

  it('orders entries by date then createdAt', () => {
    const rows = [
      { id: 'older', date: '2026-11-04', createdAt: 10, direction: 'expense' as const, amountKobo: 5000, label: 'old', category: 'food' as const },
      { id: 'newer-date', date: '2026-11-05', createdAt: 1, direction: 'income' as const, amountKobo: 4000, label: 'newer date', category: 'salary' as const },
      { id: 'same-date', date: '2026-11-05', createdAt: 20, direction: 'expense' as const, amountKobo: 2000, label: 'same day', category: 'rent' as const },
    ];

    const sorted = sortEntriesByDate(rows);

    assert.deepEqual(sorted.map((row) => row.id), ['same-date', 'newer-date', 'older']);
  });

  it('computes the same balance from income and expense rows', () => {
    const rows = [
      { direction: 'income' as const, amountKobo: 1500000 },
      { direction: 'expense' as const, amountKobo: 500000 },
      { direction: 'income' as const, amountKobo: 300000 },
    ];

    assert.equal(calculateBalanceKobo(rows), 1500000 - 500000 + 300000);
  });
});
