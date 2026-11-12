import React, { useState } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors } from '@/theme/tokens';
import { formatDisplayDate, fromDateString, toDateString } from '@/utils/date';
import { FieldFrame, fieldIconColor } from './FormField';

type Props = {
  label?: string;
  value: string; // 'YYYY-MM-DD'
  onChange: (value: string) => void;
  error?: string;
};

export function DateField({ label, value, onChange, error }: Props) {
  const [open, setOpen] = useState(false);

  const handleChange = (event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === 'android') setOpen(false); // Android shows a dialog that closes itself
    if (event.type === 'set' && picked) onChange(toDateString(picked));
  };

  return (
    <>
      <FieldFrame
        label={label}
        error={error}
        onPress={() => setOpen((o) => !o)}
        accessibilityLabel={`${label ?? 'Date'}: ${formatDisplayDate(value)}. Tap to change`}
      >
        <Ionicons name="calendar-outline" size={20} color={fieldIconColor('outlined')} />
        <Text style={styles.value}>{formatDisplayDate(value)}</Text>
      </FieldFrame>

      {open ? (
        <DateTimePicker
          value={fromDateString(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleChange}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  value: { flex: 1, fontSize: 16, color: colors.text },
});