import { Text, View, StyleSheet } from 'react-native';
import { useSession } from '@/session/SessionProvider';

export default function DashboardScreen() {
  const { session } = useSession();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.text}>Signed in as {session?.user?.FullName ?? 'User'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
  },
});
