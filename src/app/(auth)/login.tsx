import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSession } from '@/session/SessionProvider';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://site--new-budgetapp-backend--vl2lrdxwsxyp.code.run';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [formError, setFormError] = useState('');

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

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
        signal: controller.signal,
      });

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
      if (!token) {
        throw new Error('Missing token in login response');
      }

      await signIn(token, payload?.user ?? null);
      router.replace('/(app)/dashboard');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setFormError('Request timed out. Please try again.');
      } else {
        setFormError('Unable to reach the server. Please try again.');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoBadge}>
              <View style={styles.logoInner} />
            </View>
            <Text style={styles.logo}>BudgetWise</Text>
          </View>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.inputWrap, fieldErrors.email ? styles.inputWrapError : null]}>
            <Text style={styles.inputIcon}>✉</Text>
            <TextInput
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (fieldErrors.email) {
                  setFieldErrors((current) => ({ ...current, email: '' }));
                }
              }}
              placeholder="Email address"
              placeholderTextColor="#6f7281"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              editable={!isSubmitting}
            />
          </View>
          {fieldErrors.email ? <Text style={styles.errorText}>{fieldErrors.email}</Text> : null}

          <View style={[styles.inputWrap, fieldErrors.password ? styles.inputWrapError : null]}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (fieldErrors.password) {
                  setFieldErrors((current) => ({ ...current, password: '' }));
                }
              }}
              placeholder="Password"
              placeholderTextColor="#6f7281"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              editable={!isSubmitting}
            />

            <Pressable
              accessibilityRole="button"
              onPress={() => setShowPassword((current) => !current)}
              style={styles.eyeButton}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '◉' : '◌'}</Text>
            </Pressable>
          </View>
          {fieldErrors.password ? <Text style={styles.errorText}>{fieldErrors.password}</Text> : null}

          {formError ? <Text style={styles.formError}>{formError}</Text> : null}

          <Pressable style={styles.forgotButton}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>

          <Pressable
            style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.primaryButtonText}>{isSubmitting ? 'Signing In...' : 'Sign In'}</Text>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable onPress={() => router.push('/(auth)/signup' as any)}>
            <Text style={styles.signupText}>
              Don't have an account?{' '}
              <Text style={[styles.signupLink, { opacity: 0.5 }]}>Sign Up (coming soon)</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eef0f4',
    paddingVertical: 24,
  },
  card: {
    width: '92%',
    maxWidth: 540,
    minHeight: 760,
    backgroundColor: '#f7f7f8',
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 22,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#0b6edb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#0b6edb',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  logoInner: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: '#ffffff',
    backgroundColor: 'transparent',
  },
  logo: {
    fontSize: 42,
    fontWeight: '800',
    color: '#0d6edb',
    letterSpacing: -1.5,
    lineHeight: 48,
  },
  title: {
    fontSize: 54,
    lineHeight: 62,
    fontWeight: '800',
    color: '#1d1f2a',
    textAlign: 'center',
    letterSpacing: -2,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 28,
    lineHeight: 34,
    color: '#5f6273',
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '400',
  },
  form: {
    marginTop: 16,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8ebf0',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 8,
    minHeight: 84,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputWrapError: {
    borderColor: '#d93025',
  },
  inputIcon: {
    fontSize: 26,
    marginRight: 14,
    color: '#5b6476',
    width: 28,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    fontSize: 28,
    color: '#1d1f2a',
    minHeight: 52,
    paddingVertical: 10,
  },
  eyeButton: {
    paddingLeft: 12,
    paddingRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 26,
    color: '#6e7587',
  },
  errorText: {
    color: '#d93025',
    fontSize: 16,
    marginBottom: 14,
    marginLeft: 2,
  },
  formError: {
    color: '#d93025',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 26,
  },
  forgotText: {
    color: '#0d6edb',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  primaryButton: {
    backgroundColor: '#0d6edb',
    borderRadius: 18,
    minHeight: 92,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0d6edb',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 34,
    marginBottom: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#c7ccd6',
  },
  dividerText: {
    marginHorizontal: 18,
    fontSize: 22,
    fontWeight: '600',
    color: '#6e7587',
    letterSpacing: 0.5,
  },
  signupText: {
    textAlign: 'center',
    color: '#1d1f2a',
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '500',
  },
  signupLink: {
    color: '#0d6edb',
    fontWeight: '700',
  },
});
