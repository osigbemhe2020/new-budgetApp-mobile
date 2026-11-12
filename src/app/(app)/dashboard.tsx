import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '@/session/SessionProvider';
import { EntriesDashboard } from '@/entries/EntryDashboard';
import { colors } from '@/theme/tokens';

export default function DashboardScreen() {
  const { session, signOut } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // The backend capitalises its field names (FullName, Email), so the id may not be `id`.
  // Run console.log(session?.user) once, then keep only the field that really holds the id.
  // Never use the name or email as the id: they can change.
  const user = session?.user as any;
  const rawId = user?.id ?? user?.ID ?? user?.Id ?? user?.UserID;
  const userId = rawId !== undefined && rawId !== null ? String(rawId) : null;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await signOut();
      // Navigation is handled by SessionGate in _layout.tsx once the status becomes 'unauthenticated'.
    } catch {
      setIsLoggingOut(false);
      Alert.alert('Logout Failed', 'Unable to clear your session. Please try again.', [{ text: 'OK' }]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.userName}>{user?.FullName}</Text>
          <Text style={styles.userEmail}>{user?.Email}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <Text style={styles.logoutButtonText}>{isLoggingOut ? 'Logging out...' : 'Log Out'}</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {userId ? <EntriesDashboard userId={userId} /> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greetingContainer: { flex: 1 },
  greeting: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  userName: { fontSize: 24, lineHeight: 32, fontWeight: '700', color: colors.text },
  userEmail: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  logoutButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginLeft: 16,
  },
  logoutButtonDisabled: { opacity: 0.6 },
  logoutButtonText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  content: { flex: 1 },
});