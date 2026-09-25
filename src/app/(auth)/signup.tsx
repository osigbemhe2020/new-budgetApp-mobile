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

export default function SignUpScreen() {
  const router = useRouter();
  const { signIn } = useSession();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [formError, setFormError] = useState('');

  const validateForm = () => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const nextErrors = {
      fullName: '',
      email: '',
      password: '',
    };

    if (!trimmedName) {
      nextErrors.fullName = 'Full name is required';
    } else if (trimmedName.length < 2) {
      nextErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!trimmedEmail) {
      nextErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      nextErrors.password = 'Password is required';
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }

    setFieldErrors(nextErrors);
    return !nextErrors.fullName && !nextErrors.email && !nextErrors.password;
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
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          name: fullName.trim(),
          password,
        }),
        signal: controller.signal,
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const backendMessage = typeof payload?.message === 'string' ? payload.message : 'Unable to create account';

        if (backendMessage === 'User already exists') {
          setFieldErrors((current) => ({
            ...current,
            email: 'User already exists',
          }));
          return;
        }

        if (backendMessage === 'Email is required') {
          setFieldErrors((current) => ({ ...current, email: 'Email is required' }));
          return;
        }

        if (backendMessage === 'Name is required') {
          setFieldErrors((current) => ({ ...current, fullName: 'Full name is required' }));
          return;
        }

        if (backendMessage === 'Password is required' || backendMessage === 'Password must be at least 6 characters long') {
          setFieldErrors((current) => ({
            ...current,
            password: backendMessage === 'Password is required' ? 'Password is required' : 'Password must be at least 6 characters',
          }));
          return;
        }

        setFormError(backendMessage || 'Unable to create account');
        return;
      }

      const token = payload?.token;
      if (!token) {
        throw new Error('Missing token in signup response');
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

          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Start building your financial identity</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <View style={[styles.inputWrap, fieldErrors.fullName ? styles.inputWrapError : null]}>
            <Text style={styles.inputIcon}>◔</Text>
            <TextInput
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (fieldErrors.fullName) {
                  setFieldErrors((current) => ({ ...current, fullName: '' }));
                }
                if (formError) setFormError('');
              }}
              placeholder="John Doe"
              placeholderTextColor="#6f7281"
              autoCapitalize="words"
              style={styles.input}
              editable={!isSubmitting}
            />
          </View>
          {fieldErrors.fullName ? <Text style={styles.errorText}>{fieldErrors.fullName}</Text> : null}

          <Text style={styles.label}>Email address</Text>
          <View style={[styles.inputWrap, fieldErrors.email ? styles.inputWrapError : null]}>
            <Text style={styles.inputIcon}>✉</Text>
            <TextInput
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (fieldErrors.email) {
                  setFieldErrors((current) => ({ ...current, email: '' }));
                }
                if (formError) setFormError('');
              }}
              placeholder="you@example.com"
              placeholderTextColor="#6f7281"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              editable={!isSubmitting}
            />
          </View>
          {fieldErrors.email ? <Text style={styles.errorText}>{fieldErrors.email}</Text> : null}

          <Text style={styles.label}>Password</Text>
          <View style={[styles.inputWrap, fieldErrors.password ? styles.inputWrapError : null]}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (fieldErrors.password) {
                  setFieldErrors((current) => ({ ...current, password: '' }));
                }
                if (formError) setFormError('');
              }}
              placeholder="••••••••"
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

          <Pressable
            style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Text>
          </Pressable>

          <Pressable onPress={() => router.push('/(auth)/login' as any)}>
            <Text style={styles.signinText}>
              Already have account?{' '}
              <Text style={styles.signinLink}>Sign in</Text>
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
    paddingTop: 28,
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
    marginTop: 8,
    marginBottom: 16,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  logoBadge: {
    width: 44,
    height: 44,
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
    fontSize: 40,
    fontWeight: '800',
    color: '#0d6edb',
    letterSpacing: -1.5,
    lineHeight: 46,
  },
  title: {
    fontSize: 54,
    lineHeight: 60,
    fontWeight: '800',
    color: '#1d1f2a',
    textAlign: 'center',
    letterSpacing: -2,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 22,
    lineHeight: 28,
    color: '#5f6273',
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '400',
  },
  form: {
    marginTop: 8,
  },
  label: {
    fontSize: 23,
    lineHeight: 30,
    color: '#1d1f2a',
    fontWeight: '500',
    marginBottom: 12,
    marginTop: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8ebf0',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 8,
    minHeight: 76,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputWrapError: {
    borderColor: '#d93025',
  },
  inputIcon: {
    fontSize: 24,
    marginRight: 14,
    color: '#5b6476',
    width: 28,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    fontSize: 24,
    color: '#1d1f2a',
    minHeight: 48,
    paddingVertical: 10,
  },
  eyeButton: {
    paddingLeft: 12,
    paddingRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIcon: {
    fontSize: 24,
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
  primaryButton: {
    backgroundColor: '#0d6edb',
    borderRadius: 18,
    minHeight: 88,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0d6edb',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    marginTop: 18,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  signinText: {
    marginTop: 28,
    textAlign: 'center',
    color: '#1d1f2a',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '500',
  },
  signinLink: {
    color: '#0d6edb',
    fontWeight: '700',
  },
});