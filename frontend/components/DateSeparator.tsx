import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStore } from '../store/useStore';
import { theme } from '../utils/theme';
import { useTranslation } from 'react-i18next';

interface DateSeparatorProps {
  timestamp: number;
}

export const DateSeparator: React.FC<DateSeparatorProps> = ({ timestamp }) => {
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentTheme = isDarkMode ? theme.dark : theme.light;
  const { t, i18n } = useTranslation();

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Resetar horas para comparação de dias
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      // Hoje
      return i18n.language === 'pt-BR' ? 'Hoje' : i18n.language === 'es' ? 'Hoy' : 'Today';
    } else if (date.getTime() === yesterday.getTime()) {
      // Ontem
      return i18n.language === 'pt-BR' ? 'Ontem' : i18n.language === 'es' ? 'Ayer' : 'Yesterday';
    } else {
      // Data completa
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      };
      return date.toLocaleDateString(i18n.language, options);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.separator, { backgroundColor: currentTheme.textSecondary + '30' }]}>
        <Text style={[styles.dateText, { color: currentTheme.textSecondary }]}>
          {formatDate(timestamp)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  separator: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
