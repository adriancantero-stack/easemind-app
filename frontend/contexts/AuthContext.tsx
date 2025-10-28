import React, { createContext, useContext, useState, useEffect } from 'react';
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

  const backendUrl =
    Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL ||
    process.env.EXPO_PUBLIC_BACKEND_URL ||
    'http://localhost:8001';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔐 Auth state changed:', firebaseUser ? 'Logged in' : 'Logged out');
      
      if (firebaseUser) {
        // Usuário logado com Firebase
        setUser(firebaseUser);
        
        // Sincronizar com backend
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
            
            // Atualizar userId no store com o Firebase UID
            const store = useStore.getState();
            if (store.userId !== firebaseUser.uid) {
              console.log('📝 Atualizando userId no store:', firebaseUser.uid);
              // Aqui poderíamos migrar dados locais para o usuário Firebase
              // Por enquanto, apenas atualiza o userId
              store.userId = firebaseUser.uid;
            }
          } else {
            console.error('❌ Failed to sync user with backend');
          }
        } catch (error) {
          console.error('❌ Error syncing user:', error);
        }
      } else {
        // Usuário não logado - usar modo visitante
        setUser(null);
        console.log('👤 Modo visitante ativo');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
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
