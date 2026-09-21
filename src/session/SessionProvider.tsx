import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
//import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SessionUser = {
  UserID: number | string;
  FullName: string;
  Email: string;
};

export type SessionData = {
  token: string;
  user: SessionUser | null;
  expiresAt: number;
};

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

type SessionContextValue = {
  status: SessionStatus;
  session: SessionData | null;
  isReady: boolean;
  signIn: (token: string, user?: SessionUser | null, expiresAt?: number) => Promise<void>;
  signOut: () => Promise<void>;
};

const SESSION_KEY = 'budgetapp-session';
const DEFAULT_SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;


// async function clearStoredSession() {
//   await SecureStore.deleteItemAsync(SESSION_KEY);
// }

async function clearStoredSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
}


async function readStoredSession(): Promise<SessionData | null> {
  //const raw = await SecureStore.getItemAsync(SESSION_KEY);
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SessionData>;

    if (!parsed?.token || typeof parsed.expiresAt !== 'number' || !Number.isFinite(parsed.expiresAt)) {
      await clearStoredSession();
      return null;
    }

    if (parsed.expiresAt <= Date.now()) {
      await clearStoredSession();
      return null;
    }

    return {
      token: parsed.token,
      user: parsed.user ?? null,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    await clearStoredSession();
    return null;
  }
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');

  useEffect(() => {
    let active = true;

    const bootstrapSession = async () => {
      try {
        const storedSession = await readStoredSession();

        if (!active) {
          return;
        }

        setSession(storedSession);
        setStatus(storedSession ? 'authenticated' : 'unauthenticated');
      } catch {
        if (!active) {
          return;
        }

        setSession(null);
        setStatus('unauthenticated');
      }
    };

    bootstrapSession();

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (token: string, user?: SessionUser | null, expiresAt?: number) => {
    if (!token) {
      throw new Error('A session token is required.');
    }

    const computedExpiresAt =
      typeof expiresAt === 'number' && Number.isFinite(expiresAt)
        ? expiresAt
        : Date.now() + DEFAULT_SESSION_DURATION_MS;

    const nextSession: SessionData = {
      token,
      user: user ?? null,
      expiresAt: computedExpiresAt,
    };

    //await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(nextSession));
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    await clearStoredSession();
    setSession(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      session,
      isReady: status !== 'loading',
      signIn,
      signOut,
    }),
    [session, signIn, signOut, status],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession must be used inside a SessionProvider');
  }

  return context;
}
