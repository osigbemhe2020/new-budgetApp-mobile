import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSession } from '@/session/SessionProvider';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { FormField } from '@/components/auth/FormField';
import { FormError } from '@/components/auth/FormError';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AuthFooterLink } from '@/components/auth/AuthFooterLink';
import { PasswordStrength } from '@/components/auth/PasswordStrenght';
import { isPasswordValid } from '@/utils/Passwordrules';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://site--new-budgetapp-backend--vl2lrdxwsxyp.code.run';

export default function SignUpScreen() {
  const router = useRouter();
  const { signIn } = useSession();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState('');

  const clearField = (name: keyof typeof fieldErrors) => {
    if (fieldErrors[name]) setFieldErrors((current) => ({ ...current, [name]: '' }));
    if (formError) setFormError('');
  };

  const validateForm = () => {
    const nextErrors = { fullName: '', email: '', password: '', confirmPassword: '' };
    const trimmedEmail = email.trim();

    if (!fullName.trim()) nextErrors.fullName = 'Full name is required';

    if (!trimmedEmail) {
      nextErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!password) {
      nextErrors.password = 'Password is required';
    } else if (!isPasswordValid(password)) {
      nextErrors.password = 'Password must meet all the requirements below';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Confirm your password';
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(nextErrors);
    return Object.values(nextErrors).every((message) => !message);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setFormError('');
    setIsSubmitting(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: fullName.trim(), password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const backendMessage = typeof payload?.message === 'string' ? payload.message : 'Unable to create account';

        if (backendMessage === 'User already exists') {
          setFieldErrors((current) => ({
            ...current,
            email: 'An account with this email already exists. Try signing in instead.',
          }));
          return;
        }

        // Note: duplicate names return 500 Internal Server Error due to a backend defect
        // (see docs/api/auth.md: Probe: signup, duplicate name)
        setFormError(backendMessage || 'Unable to create account');
        return;
      }

      const token = payload?.token;
      if (!token) throw new Error('Missing token in signup response');

      await signIn(token, payload?.user ?? null);
      router.replace('/(app)/dashboard');
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setFormError('Request timed out. Your account may have been created - try signing in.');
        } else if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
          setFormError('Unable to reach the server. Please check your connection and try again.');
        } else {
          setFormError(`An error occurred: ${error.message}`);
        }
      } else {
        setFormError('An unexpected error occurred. Please try again.');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreen>
      <AuthHeader
        title="Create account"
        subtitle="Start building your financial identity"
        logoTone="dark"
      />

      <AuthCard tone="tinted" style={styles.card}>
        <FormField
          label="Full Name"
          icon="person-outline"
          placeholder="John Doe"
          value={fullName}
          onChangeText={(text) => {
            setFullName(text);
            clearField('fullName');
          }}
          error={fieldErrors.fullName}
          autoCapitalize="words"
          editable={!isSubmitting}
        />

        <FormField
          label="Email address"
          icon="mail-outline"
          placeholder="you@example.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            clearField('email');
          }}
          error={fieldErrors.email}
          keyboardType="email-address"
          autoCorrect={false}
          editable={!isSubmitting}
        />

        <View>
          <FormField
            label="Password"
            icon="lock-closed-outline"
            placeholder="••••••••"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearField('password');
            }}
            error={fieldErrors.password}
            isPassword
            autoCorrect={false}
            editable={!isSubmitting}
          />
          <PasswordStrength password={password} />
        </View>

        <FormField
          label="Confirm Password"
          icon="lock-closed-outline"
          placeholder="••••••••"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            clearField('confirmPassword');
          }}
          error={fieldErrors.confirmPassword}
          isPassword
          autoCorrect={false}
          editable={!isSubmitting}
        />

        <FormError message={formError} />

        <PrimaryButton
          label="Create Account"
          loadingLabel="Creating Account..."
          loading={isSubmitting}
          onPress={handleSubmit}
        />

        <AuthFooterLink
          prefix="Already have account?"
          linkLabel="Sign in"
          onPress={() => router.push('/(auth)/login' as any)}
        />
      </AuthCard>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: 32, paddingHorizontal: 16 },
});