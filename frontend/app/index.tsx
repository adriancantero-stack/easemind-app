import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // Usuário não logado e não está na tela de auth -> redirecionar para login
      console.log('🔒 User not authenticated, redirecting to login');
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // Usuário logado e está na tela de auth -> redirecionar para app
      console.log('✅ User authenticated, redirecting to app');
      router.replace('/(tabs)/');
    } else if (!user && inAuthGroup) {
      // Usuário não logado e já está no login -> OK
      console.log('👤 User in login screen');
    } else if (user) {
      // Usuário logado -> redirecionar para app
      console.log('✅ User authenticated, redirecting to app');
      router.replace('/(tabs)/');
    }
  }, [user, loading, segments]);

  // Mostrar loading enquanto verifica autenticação
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0E1A2B' }}>
      <ActivityIndicator size="large" color="#C8B6FF" />
    </View>
  );
}
