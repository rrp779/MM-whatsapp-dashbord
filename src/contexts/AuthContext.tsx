/**
 * Authentication Context
 *
 * Provides authentication state and functions throughout the application.
 * Handles bot user authentication via BOT_USER_API.
 */

import { createContext, useContext, useEffect, useState, useRef, type ReactNode, type ReactElement } from 'react';
import type { BotUser } from '../types/bot';
import { authenticate, getBotUser, clearBotUser, isAuthenticated as checkAuth } from '../utils/auth';
import { useToast } from './ToastContext';

/**
 * Authentication context value
 */
interface AuthContextValue {
  /** Current bot user data if authenticated */
  botUser: BotUser | null;
  /** Whether authentication is in progress */
  isLoading: boolean;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Error message if authentication failed */
  error: string | null;
  /** Function to authenticate (call BOT_USER_API) */
  login: () => Promise<void>;
  /** Function to clear authentication */
  logout: () => void;
  /** Function to refresh authentication */
  refreshAuth: () => Promise<void>;
}

/**
 * Authentication context
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Authentication provider props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication provider component
 * Handles bot user authentication on mount and provides auth state
 */
export function AuthProvider({ children }: AuthProviderProps): ReactElement {
  const [botUser, setBotUser] = useState<BotUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();
  // Ref to prevent duplicate authentication calls (React StrictMode double-invokes effects)
  const authenticationInProgressRef = useRef(false);
  // Ensure initial auth runs only once per app load (avoids duplicate BOT_USER_API calls)
  const initialAuthRunRef = useRef(false);

  /**
   * Performs authentication by calling BOT_USER_API
   */
  const login = async (): Promise<void> => {
    // Prevent duplicate authentication calls
    if (authenticationInProgressRef.current) {
      return;
    }

    authenticationInProgressRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const user = await authenticate();

      if (user) {
        setBotUser(user);
        setError(null);
        showSuccess('Authentication successful', `Welcome, ${user.name}!`);
      } else {
        setBotUser(null);
        const errorMsg = 'Authentication failed: Unable to fetch bot user data';
        setError(errorMsg);
        showError('Authentication Failed', errorMsg);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication error occurred';
      setError(errorMessage);
      setBotUser(null);
      showError('Authentication Error', errorMessage);
      console.error('Authentication error:', err);
    } finally {
      setIsLoading(false);
      authenticationInProgressRef.current = false;
    }
  };

  /**
   * Clears authentication state
   */
  const logout = (): void => {
    clearBotUser();
    setBotUser(null);
    setError(null);
  };

  /**
   * Refreshes authentication
   */
  const refreshAuth = async (): Promise<void> => {
    await login();
  };

  // Check for existing authentication on mount (once per app load; avoids duplicate BOT_USER_API)
  useEffect(() => {
    if (initialAuthRunRef.current) return;
    initialAuthRunRef.current = true;

    const checkExistingAuth = async (): Promise<void> => {
      await login();
    };

    checkExistingAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextValue = {
    botUser,
    isLoading,
    isAuthenticated: botUser !== null,
    error,
    login,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context
 *
 * @returns Authentication context value
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
