import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '@/theme/tokens';

type Props = TextInputProps & {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string; // sign up shows labels above fields; login does not
  error?: string;
  // 'outlined' = sign up (white, bordered). 'filled' = login (grey fill).
  variant?: 'outlined' | 'filled';
  // Adds the show/hide eye toggle and manages its own visibility state.
  isPassword?: boolean;
};

export function FormField({
  icon,
  label,
  error,
  variant = 'outlined',
  isPassword = false,
  style,
  ...inputProps
}: Props) {
  const [visible, setVisible] = useState(false);
  const filled = variant === 'filled';

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.field,
          filled ? styles.filled : styles.outlined,
          error ? styles.fieldError : null,
        ]}
      >
        <Ionicons name={icon} size={20} color={filled ? colors.iconMuted : colors.icon} />
        <TextInput
          {...inputProps}
          accessibilityLabel={label ?? inputProps.placeholder}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={isPassword && !visible}
          autoCapitalize={inputProps.autoCapitalize ?? 'none'}
          style={[styles.input, { fontSize: filled ? 14 : 16 }, style]}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            onPress={() => setVisible((v) => !v)}
            hitSlop={8}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={filled ? colors.iconMuted : colors.icon}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.12,
    color: colors.text,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: radius.field,
    borderWidth: 1,
  },
  outlined: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    ...shadow.field,
  },
  filled: {
    backgroundColor: colors.fieldFilled,
    borderColor: 'transparent',
  },
  fieldError: { borderColor: colors.error },
  input: { flex: 1, color: colors.text, paddingVertical: 0 },
  error: { fontSize: 12, lineHeight: 16, color: colors.error },
});