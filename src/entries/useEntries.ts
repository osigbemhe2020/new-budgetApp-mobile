import { useCallback, useEffect, useState } from 'react';
import { addEntry, getBalanceKobo, listRecentEntries, updateEntry } from './db';
import type { Entry, NewEntry } from './types';

export function useEntries(userId: string | null) {
  const [entries, setEntries] = useState<Entry[] | null>(null); // null = not loaded yet
  const [balanceKobo, setBalanceKobo] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const [list, balance] = await Promise.all([listRecentEntries(userId), getBalanceKobo(userId)]);
      setEntries(list);
      setBalanceKobo(balance);
      setLoadError(null);
    } catch {
      // Don't fall back to the empty state here: it would look like the data was lost.
      setLoadError('Could not read your entries. They have not been deleted.');
    }
  }, [userId]);

  useEffect(() => {
    setEntries(null); // never show the previous user's entries while the new ones load
    setBalanceKobo(0);
    refresh();
  }, [refresh]);

  // Pass this to <EntryForm onSave={save} />.
  // Rejects if the write fails. A failed refresh afterwards does NOT reject, because the entry is already saved.
  const save = useCallback(
    async (entry: NewEntry) => {
      if (!userId) throw new Error('Not signed in');
      await addEntry(userId, entry);
      await refresh();
    },
    [userId, refresh]
  );

  // Writes the update, then reloads the canonical list and balance from SQLite so they
  // stay in sync without manually patching state.
  const update = useCallback(
    async (id: string, update: Pick<NewEntry, 'direction' | 'amountKobo' | 'label' | 'category' | 'date'>) => {
      if (!userId) throw new Error('Not signed in');
      await updateEntry(userId, id, update);
      await refresh();
    },
    [userId, refresh]
  );

  return { entries, balanceKobo, loadError, refresh, save, update };
}