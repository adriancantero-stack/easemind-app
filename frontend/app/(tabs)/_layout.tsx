import { Stack } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Platform } from 'react-native';
import { useStore } from '../../store/useStore';
import { theme } from '../../utils/theme';
import { PanicModal } from '../../components/PanicModal';
import { ResponsiveContainer } from '../../components/ResponsiveContainer';
import { InstallPrompt } from '../../components/InstallPrompt';
import { CustomHeader } from '../../components/CustomHeader';
import { FixedSOSButton } from '../../components/FixedSOSButton';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import { Alert } from 'react-native';
import '../../utils/i18n';

export default function TabLayout() {
  const isDarkMode = useStore((state) => state.isDarkMode);
  const loadFromStorage = useStore((state) => state.loadFromStorage);
  const currentTheme = isDarkMode ? theme.dark : theme.light;
  const [showPanicModal, setShowPanicModal] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, []);

  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  // Verificar perfil incompleto após 10 segundos
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const checkProfile = async () => {
      if (!user?.uid) return;

      try {
        const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL;
        const response = await fetch(`${backendUrl}/api/user/profile/${user.uid}`);

        if (response.ok) {
          const data = await response.json();
          const profile = data.user;

          // Verificar se perfil está completo (nome não é 'Usuário')
          const isCompleted = profile.profile_completed === true && profile.display_name !== 'Usuário';

          console.log('🔍 [Popup Debug] Profile check:', {
            uid: user.uid,
            profile_completed: profile.profile_completed,
            display_name: profile.display_name,
            isCompleted
          });

          if (!isCompleted) {
            if (Platform.OS === 'web') {
              // Web implementation
              const shouldComplete = window.confirm(
                `${t('profile.completeProfile')}\n\n${t('profile.completeProfileMessage')}`
              );

              if (shouldComplete) {
                router.push('/profile/edit-profile?onboarding=true');
              } else {
                console.log('Lembrete de perfil adiado (Web)');
              }
            } else {
              // Native implementation
              Alert.alert(
                t('profile.completeProfile'),
                t('profile.completeProfileMessage'),
                [
                  {
                    text: t('common.later'),
                    style: 'cancel',
                    onPress: () => console.log('Lembrete de perfil adiado')
                  },
                  {
                    text: t('common.completeNow'),
                    onPress: () => router.push('/profile/edit-profile?onboarding=true')
                  }
                ]
              );
            }
          }
        }
      } catch (error) {
        console.error('Erro ao verificar perfil para popup:', error);
      }
    };

    if (user) {
      timeout = setTimeout(checkProfile, 10000); // 10 segundos
    }

    return () => clearTimeout(timeout);
  }, [user]);

  return (
    <View style={{ flex: 1 }}>
      <InstallPrompt />
      <ResponsiveContainer>
        <View style={{ flex: 1, backgroundColor: currentTheme.bg }}>
          {/* Custom Header with Logo and Hamburger Menu */}
          <CustomHeader onSOSPress={() => setShowPanicModal(true)} />

          {/* Stack Navigator for all screens */}
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: currentTheme.bg,
              },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="sessions" />
            <Stack.Screen name="journal" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="about" />
            <Stack.Screen name="panic" options={{ presentation: 'modal' }} />
          </Stack>

          {/* Panic Modal */}
          <PanicModal visible={showPanicModal} onClose={() => setShowPanicModal(false)} />
        </View>
      </ResponsiveContainer>
    </View>
  );
}
