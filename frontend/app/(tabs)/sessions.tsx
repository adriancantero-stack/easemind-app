import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { theme } from '../../utils/theme';
import { useTranslation } from 'react-i18next';
import { SessionCard } from '../../components/SessionCard';
import { sessions } from '../../data/sessions';

export default function SessionsScreen() {
  const { t, i18n } = useTranslation();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentTheme = isDarkMode ? theme.dark : theme.light;
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Force re-render when language changes
  const [currentLanguage, setCurrentLanguage] = React.useState(i18n.language);
  React.useEffect(() => {
    const onLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };
    i18n.on('languageChanged', onLanguageChange);
    return () => {
      i18n.off('languageChanged', onLanguageChange);
    };
  }, [i18n]);

  const categories = [
    { id: 'all', label: t('sessions.all') },
    { id: 'breathing', label: t('sessions.breathing') },
    { id: 'relaxation', label: t('sessions.relaxation') },
    { id: 'gratitude', label: t('sessions.gratitude') },
    { id: 'sleep', label: t('sessions.sleep') },
  ];

  const filteredSessions =
    selectedCategory === 'all'
      ? sessions
      : sessions.filter((s) => s.category === selectedCategory);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentTheme.text }]}>
          {t('sessions.title')}
        </Text>
      </View>

      {/* Categories - Botões Retangulares Compactos */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categories}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryButton,
              { backgroundColor: currentTheme.card },
              selectedCategory === cat.id && {
                backgroundColor: currentTheme.accent1,
              },
            ]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text
              style={[
                styles.categoryText,
                { color: currentTheme.text },
                selectedCategory === cat.id && { color: '#FFF', fontWeight: '600' },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {filteredSessions.map((session) => (
          <SessionCard key={`${session.id}-${currentLanguage}`} session={session} forceLanguage={currentLanguage} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  categoriesScroll: {
    maxHeight: 50,
  },
  categories: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
});
