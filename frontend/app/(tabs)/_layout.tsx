import { Stack } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useStore } from '../../store/useStore';
import { theme } from '../../utils/theme';
import { PanicModal } from '../../components/PanicModal';
import { ResponsiveContainer } from '../../components/ResponsiveContainer';
import { InstallPrompt } from '../../components/InstallPrompt';
import { CustomHeader } from '../../components/CustomHeader';
import { FixedSOSButton } from '../../components/FixedSOSButton';
import '../../utils/i18n';

export default function TabLayout() {
  const isDarkMode = useStore((state) => state.isDarkMode);
  const loadFromStorage = useStore((state) => state.loadFromStorage);
  const currentTheme = isDarkMode ? theme.dark : theme.light;
  const [showPanicModal, setShowPanicModal] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, []);

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
