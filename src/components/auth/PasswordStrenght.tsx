import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/tokens';
import { evaluatePassword } from '@/utils/Passwordrules';

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const { rules, score, label } = evaluatePassword(password);

  return (
    <View style={styles.wrap}>
      <View style={styles.bars}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.bar, i <= score && styles.barOn]} />
        ))}
      </View>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.rules}>
        {rules.map((rule) => (
          <View key={rule.id} style={styles.rule}>
            <Ionicons
              name={rule.met ? 'checkmark-circle-outline' : 'ellipse-outline'}
              size={16}
              color={rule.met ? colors.brand : colors.icon}
            />
            <Text style={[styles.ruleText, rule.met && styles.ruleMet]}>{rule.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 8, gap: 4 },
  bars: { flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 4, borderRadius: 9999, backgroundColor: colors.meterOff },
  barOn: { backgroundColor: colors.brand },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '500', letterSpacing: 0.22, color: colors.textMuted },
  rules: { paddingTop: 8, gap: 4 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleText: { fontSize: 14, lineHeight: 20, color: colors.icon },
  ruleMet: { color: colors.brand },
});