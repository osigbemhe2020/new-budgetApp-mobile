import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors } from '@/theme/tokens';

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return <Text style={styles.text}>{message}</Text>;
}

const styles = StyleSheet.create({
  text: { fontSize: 14, lineHeight: 20, color: colors.error, textAlign: 'center' },
});