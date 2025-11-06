import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useStore } from '../../store/useStore';
import { theme } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer } from '../../components/ResponsiveContainer';

export default function LoginScreen() {
  const { t } = useTranslation();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentTheme = isDarkMode ? theme.dark : theme.light;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isHydrated, setIsHydrated] = useState(Platform.OS !== 'web');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Fix hydration error for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsHydrated(true);
    }
  }, []);

  // Verificar resultado de redirect do Google (para web)
  useEffect(() => {
    if (Platform.OS === 'web' && isHydrated) {
      getRedirectResult(auth)
        .then((result) => {
          if (result) {
            console.log('✅ Login com Google realizado via redirect');
            router.replace('/(tabs)/');
          }
        })
        .catch((error) => {
          console.error('❌ Erro no redirect:', error);
        });
    }
  }, [isHydrated]);

  // Configurar Google Sign-In apenas para plataformas nativas
  useEffect(() => {
    // TEMPORARIAMENTE DESABILITADO - Requer build customizado
    // Google Sign-In não funciona com Expo Go
    // Será habilitado após build de produção
    /*
    if (Platform.OS !== 'web') {
      // Importação dinâmica apenas para plataformas nativas
      import('@react-native-google-signin/google-signin').then(({ GoogleSignin }) => {
        GoogleSignin.configure({
          webClientId: '771193870049-qv0qmj1h8eac2802119b6dfe5009a0.apps.googleusercontent.com',
          offlineAccess: true,
        });
      }).catch((error) => {
        console.log('Google Sign-In not available in this build');
      });
    }
    */
  }, []);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert(t('auth.error'), t('auth.fillAllFields'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('auth.error'), t('auth.passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Login
        await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ Login realizado com sucesso');
        router.replace('/(tabs)/');
      } else {
        // Cadastro
        await createUserWithEmailAndPassword(auth, email, password);
        console.log('✅ Cadastro realizado com sucesso');
        router.replace('/(tabs)/');
      }
    } catch (error: any) {
      console.error('❌ Erro de autenticação:', error);
      let errorMessage = t('auth.unknownError');
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = t('auth.emailInUse');
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('auth.invalidEmail');
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = t('auth.invalidCredentials');
      } else if (error.code === 'auth/weak-password') {
        errorMessage = t('auth.weakPassword');
      }
      
      Alert.alert(t('auth.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        // Implementação para Web usando popup
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account'
        });
        
        console.log('🔐 Tentando login com Google...');
        
        try {
          // Tentar popup primeiro
          const result = await signInWithPopup(auth, provider);
          console.log('✅ Login com Google realizado (Popup)', result.user.email);
          router.replace('/(tabs)/');
        } catch (popupError: any) {
          console.error('❌ Erro no popup:', popupError);
          // Se popup foi bloqueado, usar redirect
          if (popupError.code === 'auth/popup-blocked' || 
              popupError.code === 'auth/popup-closed-by-user' ||
              popupError.code === 'auth/cancelled-popup-request') {
            console.log('⚠️ Popup bloqueado, usando redirect...');
            await signInWithRedirect(auth, provider);
            // O redirect vai recarregar a página, o useEffect vai pegar o resultado
          } else {
            throw popupError;
          }
        }
      } else {
        // Para Native: Mostrar alert informando que requer build customizado
        Alert.alert(
          t('auth.unavailable') || 'Indisponível',
          'O login com Google em dispositivos nativos requer um build customizado. Use a versão web ou email/senha.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('❌ Erro no Google Sign-In:', error);
      
      // Tratar diferentes tipos de erro
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('Login cancelado pelo usuário');
        // Não mostrar erro se usuário cancelou
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.log('Requisição de popup cancelada');
      } else if (error.code === 'auth/unauthorized-domain') {
        if (Platform.OS === 'web') {
          window.alert('Domínio não autorizado no Firebase Console. Por favor, adicione este domínio nas configurações do Firebase.');
        } else {
          Alert.alert(t('auth.error'), 'Domínio não autorizado');
        }
      } else {
        // Mostrar erro genérico
        const errorMsg = t('auth.googleSignInError') || 'Erro ao fazer login com Google';
        if (Platform.OS === 'web') {
          window.alert(errorMsg + ': ' + error.message);
        } else {
          Alert.alert(t('auth.error'), errorMsg);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      if (Platform.OS === 'web') {
        window.alert(t('auth.fillAllFields'));
      } else {
        Alert.alert(t('auth.error'), t('auth.fillAllFields'));
      }
      return;
    }
    
    setLoading(true);
    try {
      // Configure language for Firebase emails based on user's app language
      const language = useStore.getState().language;
      auth.languageCode = language;
      
      console.log(`📧 Sending password reset email to ${email} in ${language}`);
      await sendPasswordResetEmail(auth, email);
      
      console.log('✅ Password reset email sent');
      
      if (Platform.OS === 'web') {
        window.alert(t('auth.resetEmailSent'));
      } else {
        Alert.alert(t('auth.resetPassword'), t('auth.resetEmailSent'));
      }
      
      setShowForgotPassword(false);
    } catch (error: any) {
      console.error('❌ Reset password error:', error);
      
      if (Platform.OS === 'web') {
        window.alert(t('auth.resetEmailError'));
      } else {
        Alert.alert(t('auth.error'), t('auth.resetEmailError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveContainer>
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.bg }]}>
        <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Logo/Header */}
          <View style={styles.header}>
            <Image 
              source={isDarkMode 
                ? require('../../assets/images/logo-easemind-dark-new.png')
                : require('../../assets/images/logo-easemind-light.png')
              }
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={[styles.subtitle, { color: currentTheme.textSecondary }]}>
              {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
            </Text>
          </View>

          {/* Google Sign-In - FIRST AND LARGER */}
          {isHydrated ? (
            <TouchableOpacity
              style={[styles.googleButtonLarge, { backgroundColor: currentTheme.card, borderColor: currentTheme.accent1 }]}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <Ionicons name="logo-google" size={32} color="#EA4335" />
              <Text style={[styles.googleButtonLargeText, { color: currentTheme.text }]}>
                {t('auth.continueWithGoogle')}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.googleButtonLarge, { backgroundColor: currentTheme.card, borderColor: currentTheme.textSecondary + '30', opacity: 0.5 }]}>
              <Ionicons name="logo-google" size={32} color="#EA4335" />
              <Text style={[styles.googleButtonLargeText, { color: currentTheme.text }]}>
                {t('auth.continueWithGoogle')}
              </Text>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: currentTheme.textSecondary + '30' }]} />
            <Text style={[styles.dividerText, { color: currentTheme.textSecondary }]}>
              {t('auth.orContinueWith')}
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: currentTheme.textSecondary + '30' }]} />
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={currentTheme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: currentTheme.text, backgroundColor: currentTheme.card }]}
              placeholder={t('auth.email')}
              placeholderTextColor={currentTheme.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={currentTheme.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: currentTheme.text, backgroundColor: currentTheme.card }]}
              placeholder={t('auth.password')}
              placeholderTextColor={currentTheme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color={currentTheme.textSecondary} 
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password Link */}
          {isLogin && (
            <TouchableOpacity 
              onPress={() => setShowForgotPassword(true)}
              style={styles.forgotPasswordContainer}
            >
              <Text style={[styles.forgotPasswordText, { color: currentTheme.accent1 }]}>
                {t('auth.forgotPassword')}
              </Text>
            </TouchableOpacity>
          )}

          {/* Login/Signup Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: currentTheme.accent1 }]}
            onPress={handleEmailAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? t('auth.signIn') : t('auth.signUp')}
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle Login/Signup */}
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.toggleButton}>
            <Text style={[styles.toggleText, { color: currentTheme.textSecondary }]}>
              {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
              <Text style={[styles.toggleLink, { color: currentTheme.accent1 }]}>
                {isLogin ? t('auth.signUp') : t('auth.signIn')}
              </Text>
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoImage: {
    width: 280,
    height: 100,
    marginBottom: 16,
  },
  logo: {
    fontSize: 42,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    paddingLeft: 48,
    paddingRight: 48,
    fontSize: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
  },
  toggleLink: {
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialButton: {
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 24,
    alignItems: 'center',
    padding: 12,
  },
  skipText: {
    fontSize: 14,
  },
});
