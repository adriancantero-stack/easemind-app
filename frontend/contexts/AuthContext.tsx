import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useStore } from '../store/useStore';
import Constants from 'expo-constants';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Backend URL - usar URL completa para produção
  const getBackendUrl = () => {
    // Sempre usar URL completa do backend (web e mobile)
    return process.env.EXPO_PUBLIC_BACKEND_URL ||
      Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL ||
      'https://api.easemind.io';
  };

  const backendUrl = getBackendUrl();

  useEffect(() => {
    // Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('⏰ Auth timeout reached - setting loading to false');
      setLoading(false);
      setUser(null); // Set to null to continue as guest
    }, 2000); // 2 seconds timeout

    let unsubscribe: () => void;

    try {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log('🔐 Auth state changed:', firebaseUser ? 'Logged in' : 'Logged out');

        // Clear timeout since we got a response
        clearTimeout(timeoutId);

        if (firebaseUser) {
          // Sincronizar com backend ANTES de liberar o usuário
          try {
            console.log('📡 Syncing user with backend:', firebaseUser.uid);

            const response = await fetch(`${backendUrl}/api/user/sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                firebase_uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                display_name: firebaseUser.displayName || 'Usuário',
                photo_url: firebaseUser.photoURL || null,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              console.log('✅ User synced with backend:', data);

              // Atualizar userId no store
              const store = useStore.getState();
              if (store.userId !== firebaseUser.uid) {
                await store.setUserId(firebaseUser.uid);
              }

              // Carregar preferências
              await store.loadPreferencesFromBackend();
            } else {
              console.error('❌ Failed to sync user with backend');
            }
          } catch (error) {
            console.error('❌ Error syncing user:', error);
          }

          // Só agora liberar o usuário para o app
          setUser(firebaseUser);
        } else {
          // Usuário não logado
          setUser(null);
          console.log('👤 Modo visitante ativo');
        }

        setLoading(false);
      });
    } catch (error) {
      console.error('❌ Firebase auth initialization error:', error);
      // If Firebase fails, continue as guest
      setLoading(false);
      setUser(null);
    }

    return () => {
      clearTimeout(timeoutId);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [backendUrl]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
