import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { jwtDecode } from 'jwt-decode';

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
  signIn: (token: string, user?: SessionUser | null) => Promise<void>;
  signOut: () => Promise<void>;
};

const SESSION_KEY = 'budgetapp-session';
const DEFAULT_SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const API_BASE_URL = 'https://site--new-budgetapp-backend--vl2lrdxwsxyp.code.run';

async function clearStoredSession() {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch (error) {
    // Fail loudly if SecureStore operation fails - this is a critical invariant
    // for logout. If we can't clear the session, the user will remain logged in
    // despite thinking they've logged out.
    throw new Error(`Failed to clear session from SecureStore: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Per the auth contract's Token table, the JWT's exp claim is the only
// server-issued expiry on record (iat/exp differ by 7 days on the probed
// token). Decoding it directly replaces the client's invented duration.
function decodeTokenExpiry(token: string): number | null {
  try {
    const decoded = jwtDecode<{ exp?: number }>(token);
    if (typeof decoded.exp !== 'number' || !Number.isFinite(decoded.exp)) {
      return null;
    }
    return decoded.exp * 1000;
  } catch {
    return null;
  }
}

async function readStoredSession(): Promise<SessionData | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SessionData>;

    if (!parsed?.token || typeof parsed.expiresAt !== 'number' || !Number.isFinite(parsed.expiresAt)) {
      await clearStoredSession();
      return null;
    }

    // First gate: local shape + clock check. Cheap, avoids a network
    // round trip for the obviously-expired case. Not sufficient alone —
    // see checkSessionWithServer, the second gate, below.
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

type ProfileCheckResult =
  | { outcome: 'valid'; user: SessionUser | null }
  | { outcome: 'invalid' }
  | { outcome: 'unreachable' };

// Second gate: GET /auth/profile per the auth contract. 200 = token still
// good server-side. 401 ("no token") and 403 ("invalid token") are the
// only non-2xx statuses the contract establishes, but any non-2xx is
// treated as a rejection, since revoked/deleted-user/expired-token
// behavior isn't documented and shouldn't be assumed to be 200.
//
// A request that never settles (no network, black-holed connection) is
// bounded with an AbortController timeout below, so it always resolves
// to 'unreachable' rather than hanging bootstrapSession indefinitely.
//
// Per AC04 ("an expired or invalid session lands on login... never the
// dashboard"), 'unreachable' is NOT treated as valid — an unconfirmed
// session is not a confirmed session. See bootstrapSession: 'invalid'
// and 'unreachable' both clear storage and route to login.
const PROFILE_CHECK_TIMEOUT_MS = 8000;

async function checkSessionWithServer(token: string): Promise<ProfileCheckResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROFILE_CHECK_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });

    if (!response.ok) {
      return { outcome: 'invalid' };
    }

    const body = await response.json();
    return { outcome: 'valid', user: body?.user ?? null };
  } catch {
    // Covers both a real network failure and an aborted (timed-out) request —
    // AbortController rejects the fetch promise with an AbortError, which
    // lands here indistinguishably from a DNS/connection failure.
    return { outcome: 'unreachable' };
  } finally {
    clearTimeout(timeoutId);
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

        if (!active) return;

        if (!storedSession) {
          setSession(null);
          setStatus('unauthenticated');
          return;
        }

      const check = await checkSessionWithServer(storedSession.token);

        if (!active) return;

        if (check.outcome === 'valid') {
          // Server confirmed the token; refresh the cached user in case
          // it's changed since sign-in.
          setSession({ ...storedSession, user: check.user ?? storedSession.user });
          setStatus('authenticated');
          return;
        }

        if (check.outcome === 'invalid') {
          // Server actively rejected the token (401/403/etc.) — confirmed
          // expired or invalid. AC04 requires clearing storage here.
          await clearStoredSession();
          setSession(null);
          setStatus('unauthenticated');
          return;
        }

        // check.outcome === 'unreachable': the server never confirmed OR
        // rejected the token — this is not the same case AC04 covers.
        // Show login (no confirmed-valid session, so no dashboard), but
        // deliberately do NOT clear SecureStore: the credential itself was
        // never rejected, only unreachable, and a transient network blip
        // (or an 8s timeout on a slow-but-working connection) shouldn't
        // destroy a token that's still good. Leaving it in storage means
        // the next launch, once connectivity returns, can revalidate and
        // reach the dashboard without asking the user to sign in again.
        setSession(null);
        setStatus('unauthenticated');
      } catch {
        if (!active) return;

        setSession(null);
        setStatus('unauthenticated');
      } finally {
        if (active) {
          await SplashScreen.hideAsync();
        }
      }
    };

    bootstrapSession();

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (token: string, user?: SessionUser | null) => {
    if (!token) {
      throw new Error('A session token is required.');
    }

    const decodedExpiresAt = decodeTokenExpiry(token);
    const expiresAt = decodedExpiresAt ?? Date.now() + DEFAULT_SESSION_DURATION_MS;

    const nextSession: SessionData = {
      token,
      user: user ?? null,
      expiresAt,
    };

    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(nextSession));

    setSession(nextSession);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    const token = session?.token;

    // INVARIANT: Local session is always cleared, even if backend is unreachable.
    // This is enforced by executing clearStoredSession() before any async operations
    // that could fail. The backend logout call is fire-and-forget and cannot block
    // the local cleanup.
    //
    // CRITICAL: If clearStoredSession fails, we do NOT update local state. This prevents
    // a mismatch where the UI shows "logged out" but the token is still stored and will
    // restore the session on next launch. The user remains on the dashboard and can retry.
    try {
      await clearStoredSession();
    } catch (error) {
      // Fail loudly if session cannot be cleared - this is a critical failure mode
      console.error('Failed to clear session during logout:', error);
      throw error; // Re-throw so caller can handle (e.g., show error to user)
    }

    setSession(null);
    setStatus('unauthenticated');

    // Fire-and-forget backend logout call (doesn't block local cleanup or navigation)
    if (token) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      }).catch(() => {
        // Backend unreachable: session already cleared locally per invariant above
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    }
  }, [session]);

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      session,
      isReady: status !== 'loading',
      signIn,
      signOut,
    }),
    [status, session, signIn, signOut],
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