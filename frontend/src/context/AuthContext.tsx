/**
 * AuthContext — Cognito authentication state management.
 *
 * Cognito standard attributes used:
 *   given_name  → First Name
 *   family_name → Last Name
 *   name        → Preferred Name (what the app calls "displayName")
 *
 * If Preferred Name is blank at signup, it defaults to First Name.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

const userPool = new CognitoUserPool({
  UserPoolId: process.env.REACT_APP_USER_POOL_ID || '',
  ClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID || '',
});

export interface AuthUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Preferred name — what we display throughout the app */
  displayName: string;
  householdId: string | null;
  role: string | null;
}

interface SignUpFields {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  /** Optional — defaults to firstName if blank */
  preferredName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fields: SignUpFields) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signOut: () => void;
  getToken: () => Promise<string>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const extractUser = (session: CognitoUserSession): AuthUser => {
    const idToken = session.getIdToken();
    const payload = idToken.decodePayload();

    const firstName = payload.given_name || '';
    const lastName = payload.family_name || '';
    // Preferred name (Cognito "name") falls back to firstName, then email
    const displayName = payload.name || firstName || payload.email || 'User';

    return {
      userId: payload.sub,
      email: payload.email || '',
      firstName,
      lastName,
      displayName,
      householdId: payload['custom:householdId'] || null,
      role: payload['custom:role'] || null,
    };
  };

  // Check for existing session on mount
  useEffect(() => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (!err && session?.isValid()) {
          setUser(extractUser(session));
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      const authDetails = new AuthenticationDetails({ Username: email, Password: password });

      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (session) => {
          setUser(extractUser(session));
          resolve();
        },
        onFailure: (err) => reject(err),
        newPasswordRequired: () => {
          reject(new Error('NEW_PASSWORD_REQUIRED'));
        },
      });
    });
  }, []);

  const signUp = useCallback(async (fields: SignUpFields): Promise<void> => {
    const { email, password, firstName, lastName, preferredName } = fields;
    // If no preferred name provided, default to first name
    const displayName = preferredName?.trim() || firstName;

    return new Promise((resolve, reject) => {
      const attributes = [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
        new CognitoUserAttribute({ Name: 'given_name', Value: firstName }),
        new CognitoUserAttribute({ Name: 'family_name', Value: lastName }),
        new CognitoUserAttribute({ Name: 'name', Value: displayName }),
      ];

      userPool.signUp(email, password, attributes, [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }, []);

  const confirmSignUp = useCallback(async (email: string, code: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      cognitoUser.confirmRegistration(code, true, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }, []);

  const signOut = useCallback(() => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) cognitoUser.signOut();
    setUser(null);
  }, []);

  const getToken = useCallback(async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = userPool.getCurrentUser();
      if (!cognitoUser) return reject(new Error('Not authenticated'));

      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session?.isValid()) return reject(err || new Error('Invalid session'));
        resolve(session.getIdToken().getJwtToken());
      });
    });
  }, []);

  /**
   * Refresh user session to pick up server-side Cognito attribute changes.
   * Uses refreshSession() with the refresh token — NOT getSession() which
   * returns the cached JWT (would miss server-side attribute updates).
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = userPool.getCurrentUser();
      if (!cognitoUser) return reject(new Error('Not authenticated'));

      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session) return reject(err || new Error('No session'));

        const refreshToken = session.getRefreshToken();
        cognitoUser.refreshSession(refreshToken, (refreshErr: Error | null, newSession: CognitoUserSession) => {
          if (refreshErr) {
            console.error('Failed to refresh session:', refreshErr);
            return reject(refreshErr);
          }
          setUser(extractUser(newSession));
          resolve();
        });
      });
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      signIn,
      signUp,
      confirmSignUp,
      signOut,
      getToken,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
