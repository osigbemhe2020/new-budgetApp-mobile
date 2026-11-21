import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, shadow } from '@/theme/tokens';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  loadingLabel?: string;
};

export function PrimaryButton({ label, onPress, loading = false, loadingLabel }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [styles.button, (loading || pressed) && styles.dimmed]}
    >
      <Text style={styles.text}>{loading ? loadingLabel ?? label : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.field,
  },
  dimmed: { opacity: 0.7 },
  // Figma uses 20px on Login and 12px on Sign Up. 16 is used for both; change here to adjust everywhere.
  text: { color: colors.white, fontSize: 16, lineHeight: 24, fontWeight: '600' },
});