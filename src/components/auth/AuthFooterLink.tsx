import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/theme/tokens';

type Props = { prefix: string; linkLabel: string; onPress: () => void };

export function AuthFooterLink({ prefix, linkLabel, onPress }: Props) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress}>
      <Text style={styles.text}>
        {prefix} <Text style={styles.link}>{linkLabel}</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 14, lineHeight: 20, color: colors.textSubtle, textAlign: 'center' },
  link: { color: colors.primary, fontWeight: '500' },
});