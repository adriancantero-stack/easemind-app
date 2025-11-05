import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Linking, Alert, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../../store/useStore';
import { theme } from '../../utils/theme';
import { useTranslation } from 'react-i18next';
import i18n, { setStoredLanguage } from '../../utils/i18n';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const themeMode = useStore((state) => state.themeMode);
  const setThemeMode = useStore((state) => state.setThemeMode);
  const setLanguage = useStore((state) => state.setLanguage);
  const currentTheme = isDarkMode ? theme.dark : theme.light;
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [userProfile, setUserProfile] = React.useState<any>(null);

  // Buscar perfil do usuário
  React.useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;
      
      try {
        const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
        const response = await fetch(`${backendUrl}/api/user/profile/${user.uid}`);
        
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data.user);
        }
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
      }
    };

    if (isAuthenticated) {
      fetchProfile();
    }
  }, [user?.uid, isAuthenticated]);

  const handleLogout = async () => {
    // Platform-specific confirmation
    if (Platform.OS === 'web') {
      // Use browser confirm dialog for web
      const confirmed = window.confirm(t('profile.logoutConfirm'));
      if (!confirmed) return;
      
      try {
        console.log('🚪 Iniciando logout...');
        await signOut(auth);
        console.log('✅ Logout realizado com sucesso');
        // O AuthContext detectará automaticamente a mudança de estado
      } catch (error) {
        console.error('❌ Erro ao fazer logout:', error);
        window.alert(t('profile.logoutError'));
      }
    } else {
      // Use native Alert for mobile
      Alert.alert(
        t('profile.logout'),
        t('profile.logoutConfirm'),
        [
          { text: t('profile.cancel'), style: 'cancel' },
          {
            text: t('profile.logout'),
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('🚪 Iniciando logout...');
                await signOut(auth);
                console.log('✅ Logout realizado com sucesso');
              } catch (error) {
                console.error('❌ Erro ao fazer logout:', error);
                Alert.alert(t('profile.error'), t('profile.logoutError'));
              }
            },
          },
        ]
      );
    }
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'pt-BR', name: 'Português (BR)' },
    { code: 'es', name: 'Español' },
  ];

  const handleLanguageChange = async (code: string) => {
    await i18n.changeLanguage(code);
    await setStoredLanguage(code);
    // CORREÇÃO: Sincronizar com useStore para que PanicModal use o idioma correto
    await setLanguage(code);
    console.log('🌐 Idioma alterado para:', code);
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
        {/* Auth Section */}
        {isAuthenticated ? (
          <View style={[styles.section, { backgroundColor: currentTheme.card }]}>
            <View style={styles.userInfo}>
              {userProfile?.profile_photo ? (
                <Image 
                  source={{ uri: userProfile.profile_photo }} 
                  style={styles.profileAvatar}
                />
              ) : (
                <Ionicons name="person-circle" size={48} color={currentTheme.accent1} />
              )}
              <View style={styles.userDetails}>
                <Text style={[styles.userName, { color: currentTheme.text }]}>
                  {userProfile?.display_name || user?.email}
                </Text>
                {userProfile?.display_name && (
                  <Text style={[styles.userEmail, { color: currentTheme.textMuted }]}>
                    {user?.email}
                  </Text>
                )}
                <Text style={[styles.userStatus, { color: currentTheme.textSecondary }]}>
                  ✅ {t('profile.verified')}
                </Text>
              </View>
            </View>
            
            {/* Botão Editar Perfil */}
            <TouchableOpacity
              style={[styles.editProfileButton, { backgroundColor: currentTheme.accent1 }]}
              onPress={() => router.push('/profile/edit-profile')}
            >
              <Ionicons name="create-outline" size={20} color="#FFF" />
              <Text style={styles.editProfileButtonText}>
                {t('profile.editProfile')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: '#FF6B6B' }]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#FFF" />
              <Text style={styles.logoutButtonText}>
                {t('profile.logout')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: currentTheme.accent1 }]}
            onPress={() => router.push('/auth/login')}
          >
            <Ionicons name="log-in-outline" size={20} color="#FFF" />
            <Text style={styles.loginButtonText}>
              {t('profile.signInUp')}
            </Text>
          </TouchableOpacity>
        )}

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
  loginButton: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userStatus: {
    fontSize: 14,
  },
  userEmail: {
    fontSize: 13,
    marginBottom: 2,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  editProfileButton: {
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  editProfileButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
