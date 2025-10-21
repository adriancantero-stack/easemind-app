import { Tabs } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Animated, Easing, Image, Text } from 'react-native';
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

  // Breathing animation for SOS button (inhale/exhale rhythm)
  useEffect(() => {
    // Realistic breathing: 4.5s inhale, 4.5s exhale (1.0 → 1.08)
    const breathe = Animated.loop(
      Animated.sequence([
        // Inhale
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 4500,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Smooth ease-in-out
        }),
        // Exhale
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 4500,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        }),
      ])
    );
    breathe.start();
    return () => breathe.stop();
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
                  marginTop: -20,
                  alignItems: 'center',
                }}
              >
                <Image
                  source={require('../../assets/images/panic-button.png')}
                  style={{
                    width: 70,
                    height: 70,
                    resizeMode: 'contain',
                  }}
                />
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '600',
                    color: '#BDAAFF',
                    marginTop: 2,
                    letterSpacing: 1,
                    opacity: 0.8,
                  }}
                >
                  SOS
                </Text>
              </Animated.View>
            ),
            tabBarLabel: () => null,
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
