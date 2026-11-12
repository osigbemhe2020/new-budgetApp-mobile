import * as SQLite from 'expo-sqlite';
import type { Entry, NewEntry } from './types';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function open() {
  const db = await SQLite.openDatabaseAsync('budget.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((row?.user_version ?? 0) < 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS entries (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          direction TEXT NOT NULL CHECK (direction IN ('income','expense')),
          amount_kobo INTEGER NOT NULL CHECK (amount_kobo > 0),
          label TEXT NOT NULL,
          category TEXT NOT NULL,
          entry_date TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_entries_user_created
          ON entries (user_id, created_at DESC);
        PRAGMA user_version = 1;
      `);
    });
  }
  return db;
}

export function getDb() {
  if (!dbPromise) {
    dbPromise = open().catch((e) => {
      dbPromise = null; // don't cache a failure, allow a retry
      throw e;
    });
  }
  return dbPromise;
}

export type EntryUpdate = Pick<NewEntry, 'direction' | 'amountKobo' | 'label' | 'category' | 'date'>;

// Updates the editable fields on a row while preserving created_at.
// The match is by both id and user_id, so one account cannot edit another user's row.
// A no-op update indicates the row did not change, so it is surfaced as an error.
export async function updateEntry(userId: string, id: string, e: EntryUpdate): Promise<void> {
  const db = await getDb();
  const result = await db.runAsync(
    `UPDATE entries
        SET direction = ?,
            amount_kobo = ?,
            label = ?,
            category = ?,
            entry_date = ?
      WHERE id = ?
        AND user_id = ?`,
    e.direction, e.amountKobo, e.label, e.category, e.date, id, userId
  );

  const changed = typeof (result as { changes?: number } | undefined)?.changes === 'number'
    ? (result as { changes: number }).changes
    : 0;

  if (changed === 0) {
    throw new Error('Entry not found or not editable by this user');
  }
}

// Resolves only after SQLite has committed the row. Throws on any failure.
// A single INSERT is atomic, so no explicit transaction is needed.
// INSERT OR IGNORE + a stable id means retrying the same entry cannot create a duplicate.
export async function addEntry(userId: string, e: NewEntry): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO entries
       (id, user_id, direction, amount_kobo, label, category, entry_date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    e.id, userId, e.direction, e.amountKobo, e.label, e.category, e.date, Date.now()
  );
}

// Sort by the actual money movement date, newest first, with created_at only as
// the tie-breaker for rows that share the same day. This keeps a past-dated entry
// above newer records when the day is later, without creating a migration.
export async function listRecentEntries(userId: string, limit = 20): Promise<Entry[]> {
  const db = await getDb();
  return db.getAllAsync<Entry>(
    `SELECT id, direction, amount_kobo AS amountKobo, label, category,
            entry_date AS date, created_at AS createdAt
       FROM entries
      WHERE user_id = ?
      ORDER BY entry_date DESC, created_at DESC
      LIMIT ?`,
    userId, limit
  );
}

// Balance = money in minus money out, worked out from the rows every time (never stored),
// so it can't drift out of sync with the list. Negative is allowed.
export async function getBalanceKobo(userId: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ balance: number }>(
    `SELECT COALESCE(SUM(CASE direction WHEN 'income' THEN amount_kobo ELSE -amount_kobo END), 0) AS balance
       FROM entries
      WHERE user_id = ?`,
    userId
  );
  return row?.balance ?? 0;
}
