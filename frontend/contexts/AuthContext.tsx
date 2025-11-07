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
    }, 3000); // 3 seconds timeout

    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log('🔐 Auth state changed:', firebaseUser ? 'Logged in' : 'Logged out');
        
        // Clear timeout since we got a response
        clearTimeout(timeoutId);
        
        if (firebaseUser) {
        // Usuário logado com Firebase
        setUser(firebaseUser);
        
        // Sincronizar com backend
        try {
          console.log('📡 Syncing user with backend:', firebaseUser.uid);
          console.log('📡 Backend URL:', backendUrl);
          console.log('📡 User data:', {
            firebase_uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            display_name: firebaseUser.displayName || 'Usuário',
            photo_url: firebaseUser.photoURL || null,
          });
          
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

          console.log('📡 Response status:', response.status);
          const responseText = await response.text();
          console.log('📡 Response body:', responseText);
          
          if (response.ok) {
            const data = JSON.parse(responseText);
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

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
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
