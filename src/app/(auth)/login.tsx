import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSession } from '@/session/SessionProvider';
import { colors } from '@/theme/tokens';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { FormField } from '@/components/auth/FormField';
import { FormError } from '@/components/auth/FormError';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { AuthFooterLink } from '@/components/auth/AuthFooterLink';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://site--new-budgetapp-backend--vl2lrdxwsxyp.code.run';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, networkError, sessionRejected, clearNetworkError, retrySessionCheck } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [formError, setFormError] = useState('');
  const [isRetrying, setIsRetrying] = useState(false);

  const validateForm = () => {
    const trimmedEmail = email.trim();
    const nextErrors = { email: '', password: '' };

    if (!trimmedEmail) {
      nextErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!password) {
      nextErrors.password = 'Password is required';
    }

    setFieldErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  };

  const handleRetrySession = async () => {
    setIsRetrying(true);
    setFormError('');
    await retrySessionCheck();
    setIsRetrying(false);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setFormError('');
    clearNetworkError();
    setIsSubmitting(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const backendMessage = typeof payload?.message === 'string' ? payload.message : 'Unable to sign in';

        if (response.status === 401) {
          setFormError(backendMessage || 'Invalid credentials');
          setFieldErrors((current) => ({
            ...current,
            password: current.password || backendMessage || 'Invalid credentials',
          }));
        } else {
          setFormError(backendMessage || 'A server error occurred. Please try again.');
        }
        return;
      }

      const token = payload?.token;
      if (!token) throw new Error('Missing token in login response');

      await signIn(token, payload?.user ?? null);
      router.replace('/(app)/dashboard');
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setFormError('Request timed out. Please try again.');
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
      <AuthCard>
        <AuthHeader title="Welcome back" subtitle="Sign in to continue" logoTone="brand" />

        <View style={styles.form}>
          <FormField
            variant="filled"
            icon="mail-outline"
            placeholder="Email address"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (fieldErrors.email) setFieldErrors((c) => ({ ...c, email: '' }));
              if (networkError) clearNetworkError();
            }}
            error={fieldErrors.email}
            keyboardType="email-address"
            autoCorrect={false}
            editable={!isSubmitting}
          />

          <View>
            <FormField
              variant="filled"
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (fieldErrors.password) setFieldErrors((c) => ({ ...c, password: '' }));
              }}
              error={fieldErrors.password}
              isPassword
              autoCorrect={false}
              editable={!isSubmitting}
            />
            <Pressable style={styles.forgot}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </Pressable>
          </View>

          {sessionRejected ? <FormError message="Your session has expired. Please sign in again." /> : null}
          {networkError ? (
            <View style={styles.networkError}>
              <FormError message="Unable to reach the server. Please check your connection." />
              <Pressable style={styles.retry} onPress={handleRetrySession} disabled={isRetrying}>
                <Text style={styles.retryText}>{isRetrying ? 'Retrying...' : 'Retry Connection'}</Text>
              </Pressable>
            </View>
          ) : null}
          <FormError message={formError} />

          <PrimaryButton
            label="Sign In"
            loadingLabel="Signing In..."
            loading={isSubmitting}
            onPress={handleSubmit}
          />
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <AuthFooterLink
          prefix="Don't have an account?"
          linkLabel="Sign Up"
          onPress={() => router.push('/(auth)/signup' as any)}
        />
      </AuthCard>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  forgot: { alignSelf: 'flex-end', paddingTop: 8 },
  forgotText: { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0.12, color: colors.primary },
  networkError: { gap: 8, alignItems: 'center' },
  retry: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20 },
  retryText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
  dividerText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.12,
    textTransform: 'uppercase',
    color: colors.iconMuted,
  },
});