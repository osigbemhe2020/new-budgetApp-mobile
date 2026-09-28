import { Text, View, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '@/session/SessionProvider';
import { useState } from 'react';

export default function DashboardScreen() {
  const { session, signOut } = useSession();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await signOut();
      router.replace('/(auth)/login');
    } catch (error) {
      setIsLoggingOut(false);
      Alert.alert(
        'Logout Failed',
        'Unable to clear your session. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.headerRow}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.userName}>{session?.user?.FullName}</Text>
            <Text style={styles.userEmail}>{session?.user?.Email}</Text>
          </View>
          <Pressable
            style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <Text style={styles.logoutButtonText}>
              {isLoggingOut ? 'Logging out...' : 'Log Out'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyText}>Nothing here yet.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f8',
    padding: 24,
  },
  profileSection: {
    marginTop: 60,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#6e7587',
    marginBottom: 8,
  },
  userName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1d1f2a',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#5f6273',
  },
  logoutButton: {
    backgroundColor: '#0d6edb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 16,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 24,
    color: '#6e7587',
    textAlign: 'center',
  },
});
