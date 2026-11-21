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

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    username: '',
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
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const nextErrors = {
      username: '',
      email: '',
      password: '',
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
    return !nextErrors.username && !nextErrors.email && !nextErrors.password;
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          username: username.trim(),
          password,
        }),
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
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
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
            <Text style={styles.label}>Username</Text>
            <View style={[styles.inputWrap, fieldErrors.username ? styles.inputWrapError : null]}>
              <Text style={styles.inputIcon}>◔</Text>
              <TextInput
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (fieldErrors.username) {
                    setFieldErrors((current) => ({ ...current, username: '' }));
                  }
                  if (formError) setFormError('');
                }}
                placeholder="johndoe"
                placeholderTextColor="#6f7281"
                autoCapitalize="none"
                style={styles.input}
                editable={!isSubmitting}
              />
            </View>
            {fieldErrors.username ? <Text style={styles.errorText}>{fieldErrors.username}</Text> : null}

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