import type { CategoryId } from './categories';

export type Direction = 'income' | 'expense';

// What the form hands to the storage layer.
export type NewEntry = {
  id: string; // generated once per entry and reused on retry, so a retry can never create a duplicate
  amountKobo: number; // whole kobo, never a float
  direction: Direction;
  label: string;
  date: string; // 'YYYY-MM-DD', local time
  category: CategoryId;
};

// What the storage layer gives back.
export type Entry = NewEntry & {
  createdAt: number; // unix ms, when it was recorded
};