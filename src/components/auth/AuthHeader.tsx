import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/theme/tokens';

type Props = {
  title: string;
  subtitle: string;
  // 'dark' = sign up (dark wordmark), 'brand' = login (blue wordmark)
  logoTone?: 'dark' | 'brand';
};

export function AuthHeader({ title, subtitle, logoTone = 'brand' }: Props) {
  const logoColor = logoTone === 'brand' ? colors.brand : colors.text;
  return (
    <View style={styles.header}>
      <View style={styles.logoRow}>
        {/* Placeholder icon: swap for the exported Figma logo SVG when you have it. */}
        <MaterialCommunityIcons name="bank" size={28} color={colors.brand} />
        <Text style={[styles.logoText, { color: logoColor }]}>BudgetWise</Text>
      </View>
      <View style={styles.titles}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: 8, paddingTop: 8, paddingBottom: 16 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoText: { fontSize: 24, lineHeight: 32, fontWeight: '600', letterSpacing: -0.24 },
  titles: { alignItems: 'center', gap: 4 },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.64,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textMuted,
    textAlign: 'center',
  },
});