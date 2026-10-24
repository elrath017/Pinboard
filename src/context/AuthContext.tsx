import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured, signInWithGoogle, signOutUser } from '../firebase/config';
import { checkAndSeedUserData } from '../firebase/firestoreService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  isSetupModalOpen: boolean;
  openSetupModal: () => void;
  closeSetupModal: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isConfigured: false,
  signIn: async () => {},
  logOut: async () => {},
  isSetupModalOpen: false,
  openSetupModal: () => {},
  closeSetupModal: () => {},
  error: null,
  clearError: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!configured || !auth) {
      setLoading(false);
      return;
    }

    // Safety timeout: auth state loading must NEVER hang for more than 1.5s
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    const unsubscribe = onAuthStateChanged(
      auth,
      currentUser => {
        clearTimeout(safetyTimer);
        setUser(currentUser);
        setLoading(false); // Resolve auth loading immediately!

        // Seed or check initial data asynchronously in background
        if (currentUser) {
          checkAndSeedUserData(currentUser.uid).catch(err => {
            console.warn('Background user seed check:', err);
          });
        }
      },
      err => {
        clearTimeout(safetyTimer);
        console.error('Auth state change error:', err);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, [configured]);

  const signIn = async () => {
    setError(null);
    if (!configured) {
      setIsSetupModalOpen(true);
      return;
    }
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed popup, do not show error
        return;
      }
      if (err.code === 'auth/unauthorized-domain') {
        setError(
          'Unauthorized Domain: Please add your Netlify domain or localhost to Firebase Console > Authentication > Settings > Authorized Domains.'
        );
      } else {
        setError(err.message || 'Failed to sign in with Google');
      }
    }
  };

  const logOut = async () => {
    setError(null);
    try {
      await signOutUser();
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: configured,
        signIn,
        logOut,
        isSetupModalOpen,
        openSetupModal: () => setIsSetupModalOpen(true),
        closeSetupModal: () => setIsSetupModalOpen(false),
        error,
        clearError: () => setError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
