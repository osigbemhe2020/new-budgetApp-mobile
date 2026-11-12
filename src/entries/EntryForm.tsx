import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Crypto from 'expo-crypto';
import { FormField } from '@/components/ui/FormField';
import { ChoiceGroup } from '@/components/ui/ChoiceGroup';
import { DateField } from '@/components/ui/DateField';
import { FormError } from '@/components/auth/FormError';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { todayString } from '@/utils/date';
import { CATEGORIES, CategoryId } from './categories';
import { isValidNairaInput, parseNairaToKobo } from './money';
import type { Direction, NewEntry } from './types';

const DIRECTIONS = [
  { value: 'income', label: 'Money in' },
  { value: 'expense', label: 'Money out' },
] as const;

type Props = {
  // Must resolve only after the entry is really stored, and throw if it was not.
  onSave: (entry: NewEntry) => Promise<void>;
};

export function EntryForm({ onSave }: Props) {
  const [direction, setDirection] = useState<Direction>('expense');
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [date, setDate] = useState(todayString());
  const [errors, setErrors] = useState({ amount: '', label: '', category: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const savingRef = useRef(false); // blocks a second tap before the screen re-renders
  const pendingId = useRef(Crypto.randomUUID());

  const resetForm = () => {
    setDirection('expense');
    setAmount('');
    setLabel('');
    setCategory(null);
    setDate(todayString());
    setErrors({ amount: '', label: '', category: '' });
  };

  const handleSave = async () => {
    if (savingRef.current) return;

    const amountKobo = parseNairaToKobo(amount);
    const next = { amount: '', label: '', category: '' };

    if (!amount) next.amount = 'Enter an amount';
    else if (amountKobo === null) next.amount = 'Enter an amount above ₦0 with up to 2 decimal places';
    if (!label.trim()) next.label = 'Add a short label';
    if (!category) next.category = 'Choose a category';

    setErrors(next);
    if (amountKobo === null || !category || next.label) return;

    savingRef.current = true;
    setSaving(true);
    setFormError('');

    try {
      await onSave({
        id: pendingId.current,
        amountKobo,
        direction,
        label: label.trim(),
        date,
        category,
      });
      // Only now is the entry stored. Start a fresh form with a fresh id.
      pendingId.current = Crypto.randomUUID();
      resetForm();
    } catch {
      // Keep everything the user typed so they can retry.
      setFormError('Not saved. Your entry is still here, so you can try again.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <View style={styles.form}>
      <ChoiceGroup
        fill
        options={DIRECTIONS}
        value={direction}
        onChange={setDirection}
        disabled={saving}
      />

      <FormField
        label="Amount"
        prefix="₦"
        placeholder="0.00"
        value={amount}
        onChangeText={(text) => {
          // Ignore keystrokes that would make the amount invalid (letters, a 3rd decimal, ...)
          if (!isValidNairaInput(text)) return;
          setAmount(text);
          if (errors.amount) setErrors((e) => ({ ...e, amount: '' }));
          if (formError) setFormError('');
        }}
        error={errors.amount}
        keyboardType="decimal-pad"
        editable={!saving}
      />

      <FormField
        label="Label"
        icon="pricetag-outline"
        placeholder="e.g. Bread, Salary"
        value={label}
        onChangeText={(text) => {
          setLabel(text);
          if (errors.label) setErrors((e) => ({ ...e, label: '' }));
          if (formError) setFormError('');
        }}
        error={errors.label}
        autoCapitalize="sentences"
        maxLength={60}
        editable={!saving}
      />

      <ChoiceGroup
        label="Category"
        options={CATEGORIES}
        value={category}
        onChange={(value) => {
          setCategory(value);
          if (errors.category) setErrors((e) => ({ ...e, category: '' }));
        }}
        error={errors.category}
        disabled={saving}
      />

      <DateField label="Date" value={date} onChange={setDate} />

      <FormError message={formError} />

      <PrimaryButton
        label="Save entry"
        loadingLabel="Saving..."
        loading={saving}
        onPress={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
});