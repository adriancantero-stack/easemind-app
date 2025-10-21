import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { theme } from '../../utils/theme';
import { useTranslation } from 'react-i18next';
import i18n, { setStoredLanguage } from '../../utils/i18n';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const themeMode = useStore((state) => state.themeMode);
  const setThemeMode = useStore((state) => state.setThemeMode);
  const currentTheme = isDarkMode ? theme.dark : theme.light;
  const router = useRouter();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'pt-BR', name: 'Português (BR)' },
    { code: 'es', name: 'Español' },
  ];

  const handleLanguageChange = async (code: string) => {
    await i18n.changeLanguage(code);
    await setStoredLanguage(code);
  };

  const openExternalLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: currentTheme.text }]}>
          {t('profile.title')}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Theme Section */}
        <View style={[styles.section, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            {t('profile.theme')}
          </Text>
          <TouchableOpacity
            style={[
              styles.themeButton,
              themeMode === 'light' && { backgroundColor: currentTheme.accent1 + '20' },
            ]}
            onPress={() => setThemeMode('light')}
          >
            <Text
              style={[
                styles.themeText,
                { color: themeMode === 'light' ? currentTheme.accent1 : currentTheme.text },
              ]}
            >
              ☀️ {t('profile.lightMode')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.themeButton,
              themeMode === 'dark' && { backgroundColor: currentTheme.accent1 + '20' },
            ]}
            onPress={() => setThemeMode('dark')}
          >
            <Text
              style={[
                styles.themeText,
                { color: themeMode === 'dark' ? currentTheme.accent1 : currentTheme.text },
              ]}
            >
              🌙 {t('profile.darkMode')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.themeButton,
              themeMode === 'auto' && { backgroundColor: currentTheme.accent1 + '20' },
            ]}
            onPress={() => setThemeMode('auto')}
          >
            <Text
              style={[
                styles.themeText,
                { color: themeMode === 'auto' ? currentTheme.accent1 : currentTheme.text },
              ]}
            >
              🔄 Auto (System)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Language Section */}
        <View style={[styles.section, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            {t('profile.language')}
          </Text>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageButton,
                i18n.language === lang.code && {
                  backgroundColor: currentTheme.accent1 + '20',
                },
              ]}
              onPress={() => handleLanguageChange(lang.code)}
            >
              <Text
                style={[
                  styles.languageText,
                  {
                    color: i18n.language === lang.code ? currentTheme.accent1 : currentTheme.text,
                  },
                ]}
              >
                {lang.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Privacy Section */}
        <View style={[styles.section, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            {t('profile.privacy')}
          </Text>
          <Text style={[styles.infoText, { color: currentTheme.textMuted }]}>
            {t('profile.privacyText')}
          </Text>
        </View>

        {/* About & Legal Section */}
        <View style={[styles.section, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            {t('profile.about')}
          </Text>
          
          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => router.push('/about')}
          >
            <Text style={[styles.linkText, { color: currentTheme.text }]}>🪷 {t('profile.aboutEasemind')}</Text>
            <Text style={[styles.linkArrow, { color: currentTheme.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => openExternalLink('https://easemind.io/privacy')}
          >
            <Text style={[styles.linkText, { color: currentTheme.text }]}>🔐 {t('profile.privacyPolicy')}</Text>
            <Text style={[styles.linkArrow, { color: currentTheme.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkItem}
            onPress={() => openExternalLink('https://easemind.io/terms')}
          >
            <Text style={[styles.linkText, { color: currentTheme.text }]}>📄 {t('profile.termsOfUse')}</Text>
            <Text style={[styles.linkArrow, { color: currentTheme.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.version, { color: currentTheme.textMuted }]}>
          EaseMind v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  section: {
    padding: theme.spacing.md,
    borderRadius: theme.radius,
    marginBottom: theme.spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
  },
  languageButton: {
    padding: theme.spacing.sm + 4,
    borderRadius: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  languageText: {
    fontSize: 16,
  },
  themeButton: {
    padding: theme.spacing.sm + 4,
    borderRadius: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  themeText: {
    fontSize: 16,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  crisisBox: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.spacing.sm,
  },
  crisisText: {
    fontSize: 14,
    marginBottom: theme.spacing.sm,
  },
  helplineText: {
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: theme.spacing.lg,
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  linkText: {
    fontSize: 15,
    flex: 1,
  },
  linkArrow: {
    fontSize: 24,
    fontWeight: '300',
  },
});
