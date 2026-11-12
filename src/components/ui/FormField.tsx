import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '@/theme/tokens';

export type FieldVariant = 'outlined' | 'filled';

export const fieldIconColor = (variant: FieldVariant) =>
  variant === 'filled' ? colors.iconMuted : colors.icon;

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function FieldError({ message }: { message?: string }) {
  return message ? <Text style={styles.error}>{message}</Text> : null;
}

type FrameProps = {
  label?: string;
  error?: string;
  variant?: FieldVariant;
  onPress?: () => void; // makes the whole field tappable (used by DateField)
  accessibilityLabel?: string;
  children: React.ReactNode;
};

// Label + bordered box + error text. Every field type builds on this so they all look the same.
export function FieldFrame({
  label,
  error,
  variant = 'outlined',
  onPress,
  accessibilityLabel,
  children,
}: FrameProps) {
  const frameStyle = [
    styles.field,
    variant === 'filled' ? styles.filled : styles.outlined,
    error ? styles.fieldError : null,
  ];

  return (
    <View style={styles.wrapper}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? label}
          onPress={onPress}
          style={frameStyle}
        >
          {children}
        </Pressable>
      ) : (
        <View style={frameStyle}>{children}</View>
      )}
      <FieldError message={error} />
    </View>
  );
}

type Props = TextInputProps & {
  icon?: keyof typeof Ionicons.glyphMap;
  prefix?: string; // text shown instead of an icon, e.g. "₦"
  label?: string;
  error?: string;
  variant?: FieldVariant;
  isPassword?: boolean; // adds the show/hide eye and manages its own state
};

export function FormField({
  icon,
  prefix,
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
    <FieldFrame label={label} error={error} variant={variant}>
      {icon ? (
        <Ionicons name={icon} size={20} color={fieldIconColor(variant)} />
      ) : prefix ? (
        <Text style={styles.prefix}>{prefix}</Text>
      ) : null}

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
            color={fieldIconColor(variant)}
          />
        </Pressable>
      ) : null}
    </FieldFrame>
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
  prefix: { fontSize: 18, fontWeight: '600', color: colors.text, width: 20, textAlign: 'center' },
  input: { flex: 1, color: colors.text, paddingVertical: 0 },
  error: { fontSize: 12, lineHeight: 16, color: colors.error },
});