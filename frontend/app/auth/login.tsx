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
  getRedirectResult
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

  // Verificar resultado de redirect do Google (para web)
  useEffect(() => {
    if (Platform.OS === 'web') {
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
  }, []);

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
    // TEMPORARIAMENTE DESABILITADO - Requer build customizado
    Alert.alert(
      t('auth.unavailable') || 'Indisponível',
      t('auth.googleSignInRequiresBuild') || 'O login com Google requer um build customizado do app. Por favor, use email e senha por enquanto.',
      [{ text: 'OK' }]
    );
    return;
    
    /* CÓDIGO ORIGINAL - SERÁ REATIVADO NO BUILD DE PRODUÇÃO
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        // Implementação para Web usando popup
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account'
        });
        
        try {
          // Tentar popup primeiro
          await signInWithPopup(auth, provider);
          console.log('✅ Login com Google realizado (Popup)');
          router.replace('/(tabs)/');
        } catch (popupError: any) {
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
        // Implementação para Native (iOS/Android)
        const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
        
        // Verificar se o Play Services está disponível
        await GoogleSignin.hasPlayServices();
        
        // Fazer login no Google
        const userInfo = await GoogleSignin.signIn();
        
        // Obter o ID token do Google
        const { idToken } = userInfo.data!;
        
        // Criar credencial do Firebase com o token do Google
        const googleCredential = GoogleAuthProvider.credential(idToken);
        
        // Fazer sign in no Firebase com a credencial do Google
        await signInWithCredential(auth, googleCredential);
        
        console.log('✅ Login com Google realizado (Native)');
        router.replace('/(tabs)/');
      }
    } catch (error: any) {
      console.error('❌ Erro no Google Sign-In:', error);
      
      // Tratar diferentes tipos de erro
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('Login cancelado pelo usuário');
      } else if (error.code === 'SIGN_IN_CANCELLED') {
        console.log('Login cancelado pelo usuário');
      } else if (error.code === 'IN_PROGRESS') {
        console.log('Login já está em andamento');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        if (Platform.OS === 'web') {
          window.alert('Google Play Services não disponível');
        } else {
          Alert.alert(t('auth.error'), 'Google Play Services não disponível');
        }
      } else if (error.code === 'auth/unauthorized-domain') {
        if (Platform.OS === 'web') {
          window.alert('Domínio não autorizado no Firebase Console. Configure o domínio no Firebase.');
        } else {
          Alert.alert(t('auth.error'), 'Domínio não autorizado');
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert(t('auth.googleSignInError') + ': ' + error.message);
        } else {
          Alert.alert(t('auth.error'), t('auth.googleSignInError'));
        }
      }
    } finally {
      setLoading(false);
    }
    */
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

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: currentTheme.textSecondary + '30' }]} />
            <Text style={[styles.dividerText, { color: currentTheme.textSecondary }]}>
              {t('auth.or')}
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: currentTheme.textSecondary + '30' }]} />
          </View>

          {/* Google Sign-In */}
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: currentTheme.card, borderColor: currentTheme.textSecondary + '30' }]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <Ionicons name="logo-google" size={24} color="#EA4335" />
            <Text style={[styles.socialButtonText, { color: currentTheme.text }]}>
              {t('auth.continueWithGoogle')}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
