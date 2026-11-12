import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { FieldError, FieldLabel } from './FormField';

export type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label?: string;
  options: readonly Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  error?: string;
  // fill = options share the row equally (good for 2 choices, like money in / out).
  // Otherwise options wrap onto several lines (good for a category list).
  fill?: boolean;
  disabled?: boolean;
};

// Pick exactly one option from a fixed set.
export function ChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  fill = false,
  disabled = false,
}: Props<T>) {
  return (
    <View style={styles.wrapper}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <View style={styles.row}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(option.value)}
              style={[
                styles.pill,
                fill && styles.pillFill,
                selected && styles.pillSelected,
                !selected && !!error && styles.pillError,
              ]}
            >
              <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <FieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillFill: { flex: 1, height: 48 },
  pillSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillError: { borderColor: colors.error },
  pillText: { fontSize: 14, lineHeight: 20, fontWeight: '500', color: colors.text },
  pillTextSelected: { color: colors.white },
});