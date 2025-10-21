import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { theme } from '../../utils/theme';
import { useTranslation } from 'react-i18next';

export default function AboutScreen() {
  const { t } = useTranslation();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentTheme = isDarkMode ? theme.dark : theme.light;
  const language = useStore((state) => state.language);

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.bg }]} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.emoji, { fontSize: 48 }]}>🪷</Text>
          <Text style={[styles.title, { color: currentTheme.text }]}>
            {t('about.title')}
          </Text>
        </View>

        {/* Description */}
        <View style={[styles.section, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.description, { color: currentTheme.text }]}>
            {t('about.description')}
          </Text>
          <Text style={[styles.description, { color: currentTheme.text, marginTop: 12 }]}>
            {t('about.luna_description')}
          </Text>
          <Text style={[styles.description, { color: currentTheme.text, marginTop: 12 }]}>
            {t('about.methods')}
          </Text>
        </View>

        {/* Features */}
        <View style={[styles.section, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            🎧 {t('about.features_title')}
          </Text>
          {[
            t('about.feature_1'),
            t('about.feature_2'),
            t('about.feature_3'),
            t('about.feature_4'),
            t('about.feature_5'),
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={[styles.bullet, { color: currentTheme.accent1 }]}>•</Text>
              <Text style={[styles.featureText, { color: currentTheme.textSecondary }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* Warning */}
        <View style={[styles.section, styles.warningSection, { backgroundColor: currentTheme.accent2 + '20', borderColor: currentTheme.accent2 }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.accent2 }]}>
            ⚠️ {t('about.warning_title')}
          </Text>
          <Text style={[styles.description, { color: currentTheme.text }]}>
            {t('about.warning_text')}
          </Text>
          <Text style={[styles.description, { color: currentTheme.text, marginTop: 8, fontWeight: '600' }]}>
            {t('about.crisis_help')}
          </Text>
        </View>

        {/* Emergency Contacts */}
        <View style={[styles.section, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            📞 {t('about.emergency_title')}
          </Text>
          <Text style={[styles.contactText, { color: currentTheme.text }]}>
            🇧🇷 Brasil: <Text style={{ fontWeight: '700' }}>CVV – 188</Text> (24h)
          </Text>
          <Text style={[styles.contactText, { color: currentTheme.text }]}>
            🇺🇸 USA: <Text style={{ fontWeight: '700' }}>988</Text> Suicide & Crisis Lifeline
          </Text>
          <Text style={[styles.contactText, { color: currentTheme.text }]}>
            🌍 {t('about.other_countries')}
          </Text>
        </View>

        {/* Privacy */}
        <View style={[styles.section, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            🔒 {t('about.privacy_title')}
          </Text>
          <Text style={[styles.description, { color: currentTheme.text }]}>
            {t('about.privacy_text')}
          </Text>
          <Text style={[styles.description, { color: currentTheme.text, marginTop: 8 }]}>
            {t('about.data_deletion')}
          </Text>
        </View>

        {/* Links */}
        <View style={styles.linksSection}>
          <TouchableOpacity
            style={[styles.linkButton, { backgroundColor: currentTheme.accent1 }]}
            onPress={() => openLink('https://easemind.io/terms')}
          >
            <Text style={styles.linkButtonText}>📄 {t('about.terms')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkButton, { backgroundColor: currentTheme.accent1 }]}
            onPress={() => openLink('https://easemind.io/privacy')}
          >
            <Text style={styles.linkButtonText}>🔐 {t('about.privacy_policy')}</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: currentTheme.textSecondary }]}>
            EaseMind.io
          </Text>
          <Text style={[styles.footerText, { color: currentTheme.textSecondary, fontSize: 12, marginTop: 4 }]}>
            {t('about.made_with')} 💜
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  emoji: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  warningSection: {
    borderWidth: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 20,
    marginRight: 8,
    fontWeight: '700',
  },
  featureText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  contactText: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 8,
  },
  linksSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  linkButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  linkButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
