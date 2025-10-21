import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../store/useStore';
import { theme } from '../utils/theme';
import { useTranslation } from 'react-i18next';

interface SessionCardProps {
  session: {
    id: string;
    title: string;
    description: string;
    duration: number;
    category: string;
  };
  forceLanguage?: string; // Force re-render when language changes
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, forceLanguage }) => {
  const { t } = useTranslation();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentTheme = isDarkMode ? theme.dark : theme.light;

  const handlePress = () => {
    router.push(`/session-details?id=${session.id}`);
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: currentTheme.card }]}
      activeOpacity={0.7}
      onPress={handlePress}
    >
      <Text style={[styles.title, { color: currentTheme.text }]}>
        {t(`sessions.list.${session.id}.title`)}
      </Text>
      <Text style={[styles.description, { color: currentTheme.textSecondary }]}>
        {t(`sessions.list.${session.id}.description`)}
      </Text>
      <Text style={[styles.duration, { color: currentTheme.accent1 }]}>
        {session.duration} min
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
  },
});
