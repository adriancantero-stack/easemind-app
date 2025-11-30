import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../contexts/AuthContext';
import Constants from 'expo-constants';

// Manter a splash screen visível
SplashScreen.preventAutoHideAsync();

export default function Index() {
  const { user, loading } = useAuth();
  const [appIsReady, setAppIsReady] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        // Aguardar até que o loading termine
        if (!loading) {
          // Se usuário está logado, verificar perfil
          if (user) {
            await checkProfileCompletion();
          }
          setAppIsReady(true);
        }
      } catch (e) {
        console.warn(e);
        setAppIsReady(true); // Continuar mesmo com erro
      }
    }

    prepare();
  }, [loading, user]);

  const checkProfileCompletion = async () => {
    try {
      if (!user?.uid) return;

      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL ||
        Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL;

      const response = await fetch(`${backendUrl}/api/user/profile/${user.uid}`);

      if (response.ok) {
        const data = await response.json();
        const profile = data.user;

        // Verificar se perfil está completo
        const isCompleted = profile.profile_completed === true &&
          profile.display_name !== 'Usuário';

        setProfileCompleted(isCompleted);
      } else {
        // Se erro, assumir que perfil está completo (fallback)
        setProfileCompleted(true);
      }
    } catch (error) {
      console.error('Erro ao verificar perfil:', error);
      // Se erro, assumir que perfil está completo (fallback)
      setProfileCompleted(true);
    }
  };

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

  // Redirecionar baseado no estado de autenticação e perfil
  if (user) {
    // Se ainda está verificando perfil, não redirecionar
    if (profileCompleted === null) {
      return null;
    }

    // Se perfil incompleto, ir para onboarding
    if (!profileCompleted) {
      return <Redirect href="/profile/edit-profile?onboarding=true" />;
    }

    // Perfil completo, ir para app
    return <Redirect href="/(tabs)/" />;
  }

  return <Redirect href="/auth/login" />;
}
