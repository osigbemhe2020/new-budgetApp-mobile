import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius, shadow } from '@/theme/tokens';

type Props = ViewProps & {
  // 'white' = login card. 'tinted' = sign up panel (same colour as the page, shadow only).
  tone?: 'white' | 'tinted';
};

export function AuthCard({ tone = 'white', style, children, ...rest }: Props) {
  return (
    <View
      {...rest}
      style={[
        styles.card,
        { backgroundColor: tone === 'white' ? colors.surface : colors.background },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    padding: 24,
    gap: 24,
    ...shadow.card,
  },
});