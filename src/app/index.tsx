import { Redirect } from 'expo-router';

import { useSession } from '@/session/SessionProvider';

export default function AppEntry() {
  const { status } = useSession();

  if (status === 'loading') {
    return null;
  }

  return (
    <Redirect
      href={status === 'authenticated' ? '/(app)/dashboard' : '/(auth)/login'}
    />
  );
}
