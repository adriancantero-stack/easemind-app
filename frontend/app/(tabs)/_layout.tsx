import { Tabs } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Animated, Easing, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../store/useStore';
import { theme } from '../../utils/theme';
import { useTranslation } from 'react-i18next';
import { PanicModal } from '../../components/PanicModal';
import '../../utils/i18n';

export default function TabLayout() {
  const { t } = useTranslation();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const loadFromStorage = useStore((state) => state.loadFromStorage);
  const currentTheme = isDarkMode ? theme.dark : theme.light;
  const [showPanicModal, setShowPanicModal] = useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadFromStorage();
  }, []);

  // Pulse animation for SOS button
  useEffect(() => {
    // Slow breathing effect: 4s loop (1.0 → 1.05)
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: currentTheme.accent1,
          tabBarInactiveTintColor: currentTheme.textMuted,
          tabBarStyle: {
            backgroundColor: currentTheme.card,
            borderTopColor: currentTheme.border,
            height: 60,
            paddingBottom: 8,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.chat'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubbles-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sessions"
          options={{
            title: t('tabs.sessions'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="leaf-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="panic"
          options={{
            title: t('tabs.sos'),
            tabBarIcon: ({ focused }) => (
              <Animated.View
                style={{
                  transform: [{ scale: pulseAnim }],
                  backgroundColor: '#BDAAFF', // Lilac Serenity
                  borderRadius: 32,
                  width: 64,
                  height: 64,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: -20,
                  borderWidth: 3,
                  borderColor: '#FFFFFF',
                  elevation: 6,
                  shadowColor: 'rgba(189, 170, 255, 0.4)',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                }}
              >
                <Ionicons name="heart-outline" size={28} color="#FFFFFF" />
              </Animated.View>
            ),
            tabBarLabel: () => null, // Remove o texto "SOS" de baixo
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault(); // Previne navegação
              setShowPanicModal(true); // Abre o modal
            },
          }}
        />
        <Tabs.Screen
          name="journal"
          options={{
            title: t('tabs.journal'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="book-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('tabs.profile'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="about"
          options={{
            href: null, // Esconde da tab bar
          }}
        />
      </Tabs>

      <PanicModal visible={showPanicModal} onClose={() => setShowPanicModal(false)} />
    </>
  );
}
