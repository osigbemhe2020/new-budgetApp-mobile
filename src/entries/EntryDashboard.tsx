import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, shadow } from '@/theme/tokens';
import { formatDisplayDate } from '@/utils/date';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { CATEGORIES } from './categories';
import { EntryForm } from './EntryForm';
import { formatNaira } from './money';
import type { Entry } from './types';
import { useEntries } from './useEntries';

const categoryLabel = (value: string) => CATEGORIES.find((c) => c.value === value)?.label ?? value;

function EntryRow({ entry }: { entry: Entry }) {
  const isIncome = entry.direction === 'income';
  const signed = isIncome ? entry.amountKobo : -entry.amountKobo;
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.rowLabel}>{entry.label}</Text>
        <Text style={styles.rowMeta}>
          {categoryLabel(entry.category)} · {formatDisplayDate(entry.date)}
        </Text>
      </View>
      <View style={styles.rowAmount}>
        <Text style={[styles.amount, isIncome ? styles.income : styles.expense]}>
          {isIncome ? '+' : ''}
          {formatNaira(signed)}
        </Text>
        <Text style={styles.rowMeta}>{isIncome ? 'Money in' : 'Money out'}</Text>
      </View>
    </View>
  );
}

// Drop this inside your dashboard screen: <EntriesDashboard userId={...} />
export function EntriesDashboard({ userId }: { userId: string }) {
  const { entries, balanceKobo, loadError, refresh, save } = useEntries(userId);
  const [formOpen, setFormOpen] = useState(false);

  const loaded = entries !== null;

  return (
    <>
      <FlatList
        data={entries ?? []}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => <EntryRow entry={item} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Balance (₦)</Text>
              <Text style={styles.balance}>{formatNaira(balanceKobo)}</Text>
            </View>
            <PrimaryButton label="Add entry" onPress={() => setFormOpen(true)} />
            <Text style={styles.sectionTitle}>Recent entries</Text>
            {loadError ? (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>{loadError}</Text>
                <Pressable onPress={refresh} accessibilityRole="button">
                  <Text style={styles.retry}>Try again</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loaded && !loadError ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No entries yet</Text>
              <Text style={styles.emptyText}>
                Tap Add entry to record money in or out. It stays on this phone, even offline.
              </Text>
            </View>
          ) : null
        }
      />

      <Modal
        visible={formOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFormOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modal}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New entry</Text>
            <Pressable onPress={() => setFormOpen(false)} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <EntryForm
              onSave={async (entry) => {
                await save(entry); // throws if the write failed, so the form shows its error
                setFormOpen(false); // reached only after the entry is stored
              }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 48, gap: 8 },
  header: { gap: 16, marginBottom: 8 },
  balanceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 24,
    gap: 4,
    ...shadow.card,
  },
  balanceLabel: { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0.12, color: colors.textMuted },
  balance: { fontSize: 32, lineHeight: 40, fontWeight: '700', letterSpacing: -0.64, color: colors.text },
  sectionTitle: { fontSize: 16, lineHeight: 24, fontWeight: '600', color: colors.text, marginTop: 8 },
  notice: { gap: 8, padding: 16, borderRadius: radius.field, backgroundColor: colors.fieldFilled },
  noticeText: { fontSize: 14, lineHeight: 20, color: colors.error },
  retry: { fontSize: 14, fontWeight: '600', color: colors.primary },
  empty: { alignItems: 'center', gap: 4, paddingVertical: 32, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 16, lineHeight: 24, fontWeight: '600', color: colors.text },
  emptyText: { fontSize: 14, lineHeight: 20, color: colors.textMuted, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.field,
    padding: 16,
    ...shadow.field,
  },
  rowMain: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 16, lineHeight: 24, fontWeight: '500', color: colors.text },
  rowMeta: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
  rowAmount: { alignItems: 'flex-end', gap: 2 },
  amount: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  income: { color: colors.brand },
  expense: { color: colors.text },
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  modalTitle: { fontSize: 20, lineHeight: 28, fontWeight: '600', color: colors.text },
  close: { fontSize: 14, fontWeight: '500', color: colors.primary },
  modalBody: { padding: 16, paddingBottom: 48 },
});