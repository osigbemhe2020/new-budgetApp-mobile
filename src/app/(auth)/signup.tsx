import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSession, type SessionUser } from '@/session/SessionProvider';
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

type SignupField = 'username' | 'email' | 'password' | 'confirmPassword';
type SignupPayload = {
  message?: unknown;
  field?: unknown;
  token?: unknown;
  user?: SessionUser | null;
};

export default function SignUpScreen() {
  const router = useRouter();
  const { signIn } = useSession();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<SignupField, string>>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState('');

  const updateField = (field: SignupField, value: string) => {
    if (field === 'username') setUsername(value);
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    if (field === 'confirmPassword') setConfirmPassword(value);
    setFieldErrors((current) => ({ ...current, [field]: '' }));
    setFormError('');
  };

  const validateForm = () => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const nextErrors: Record<SignupField, string> = {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    };

    if (!trimmedUsername) {
      nextErrors.username = 'Username is required';
    }

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
    return Object.values(nextErrors).every((error) => !error);
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
        body: JSON.stringify({
          email: email.trim(),
          username: username.trim(),
          password,
        }),
        signal: controller.signal,
      });

      const payload: SignupPayload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const backendMessage =
          typeof payload.message === 'string' ? payload.message : 'Unable to create account';

        if (backendMessage === 'User already exists') {
          setFieldErrors((current) => ({
            ...current,
            email: 'An account with this email already exists. Try signing in instead.',
          }));
          return;
        }

        const backendField = payload.field;
        if (
          backendField === 'username' ||
          backendField === 'email' ||
          backendField === 'password'
        ) {
          setFieldErrors((current) => ({
            ...current,
            [backendField]: backendMessage,
          }));
          return;
        }

        setFormError(backendMessage);
        return;
      }

      if (typeof payload.token !== 'string' || !payload.token) {
        throw new Error('Missing token in signup response');
      }

      await signIn(payload.token, payload.user ?? null);
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
      <AuthCard tone="tinted">
        <AuthHeader
          title="Create account"
          subtitle="Start building your financial identity"
          logoTone="dark"
        />

        <View style={styles.form}>
          <FormField
            label="Username"
            icon="person-outline"
            placeholder="johndoe"
            value={username}
            onChangeText={(text) => updateField('username', text)}
            error={fieldErrors.username}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSubmitting}
          />

          <FormField
            label="Email address"
            icon="mail-outline"
            placeholder="you@example.com"
            value={email}
            onChangeText={(text) => updateField('email', text)}
            error={fieldErrors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSubmitting}
          />

          <View>
            <FormField
              label="Password"
              icon="lock-closed-outline"
              placeholder="Create a password"
              value={password}
              onChangeText={(text) => updateField('password', text)}
              error={fieldErrors.password}
              isPassword
              autoCorrect={false}
              editable={!isSubmitting}
            />
            <PasswordStrength password={password} />
          </View>

          <FormField
            label="Confirm password"
            icon="lock-closed-outline"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={(text) => updateField('confirmPassword', text)}
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
        </View>

        <AuthFooterLink
          prefix="Already have an account?"
          linkLabel="Sign in"
          onPress={() => router.push('/(auth)/login' as any)}
        />
      </AuthCard>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
});
