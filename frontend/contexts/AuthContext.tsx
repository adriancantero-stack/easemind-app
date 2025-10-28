import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useStore } from '../store/useStore';

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔐 Auth state changed:', firebaseUser ? 'Logged in' : 'Logged out');
      
      if (firebaseUser) {
        // Usuário logado com Firebase
        setUser(firebaseUser);
        
        // Sincronizar com Zustand store
        const store = useStore.getState();
        
        // Atualizar userId no store para usar o UID do Firebase
        if (store.userId !== firebaseUser.uid) {
          console.log('📝 Atualizando userId no store:', firebaseUser.uid);
          // Aqui poderíamos migrar dados locais para o usuário Firebase
          // Por enquanto, apenas atualiza o userId
        }
      } else {
        // Usuário não logado - usar modo visitante
        setUser(null);
        console.log('👤 Modo visitante ativo');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
