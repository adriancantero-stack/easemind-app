import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../contexts/AuthContext';

// Manter a splash screen visível
SplashScreen.preventAutoHideAsync();

export default function Index() {
  const { user, loading } = useAuth();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Aguardar até que o loading termine
        if (!loading) {
          setAppIsReady(true);
        }
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, [loading]);

  useEffect(() => {
    if (appIsReady) {
      // Ocultar a splash screen quando estiver pronto
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // Não renderizar nada até estar pronto
  if (!appIsReady) {
    return null;
  }

  // Redirecionar baseado no estado de autenticação
  if (user) {
    return <Redirect href="/(tabs)/" />;
  }

  return <Redirect href="/auth/login" />;
}
