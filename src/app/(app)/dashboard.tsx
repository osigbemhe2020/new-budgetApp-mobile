import { Text, View, StyleSheet } from 'react-native';
import { useSession } from '@/session/SessionProvider';

export default function DashboardScreen() {
  const { session } = useSession();

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <Text style={styles.greeting}>Welcome back</Text>
        <Text style={styles.userName}>{session?.user?.FullName}</Text>
        <Text style={styles.userEmail}>{session?.user?.Email}</Text>
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
