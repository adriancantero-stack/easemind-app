import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt: React.FC = () => {
  const { t } = useTranslation();
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const slideAnim = useState(new Animated.Value(-100))[0];

  useEffect(() => {
    // Só funciona na web
    if (Platform.OS !== 'web') return;

    // Verificar se já foi instalado ou dismissed
    const checkInstallStatus = async () => {
      try {
        // Verifica se o app já está instalado (modo standalone)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        
        // Se já está instalado, nunca mostrar
        if (isStandalone) {
          console.log('✅ App já está instalado, não mostrando prompt');
          return;
        }

        // Verificar se foi dismissed e quando
        const dismissedData = await AsyncStorage.getItem('install_prompt_dismissed');
        
        if (dismissedData) {
          const { timestamp } = JSON.parse(dismissedData);
          const daysSinceDismissed = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
          
          // Mostrar novamente após 7 dias
          if (daysSinceDismissed < 7) {
            console.log(`⏰ Prompt dismissed há ${Math.round(daysSinceDismissed)} dias, aguardando...`);
            return;
          } else {
            console.log('🔄 Já se passaram 7 dias, mostrando prompt novamente');
          }
        }

        // Detectar se é mobile
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile) {
          console.log('📱 Dispositivo mobile detectado, mostrando prompt de instalação');
          setShowPrompt(true);
          animateIn();
        }
      } catch (error) {
        console.error('❌ Error checking install status:', error);
      }
    };

    // Listener para o evento beforeinstallprompt (Android Chrome/Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
      animateIn();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    checkInstallStatus();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const animateIn = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const animateOut = (callback: () => void) => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(callback);
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android Chrome/Edge - usar prompt nativo
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted install');
      }
      setDeferredPrompt(null);
      handleDismiss();
    } else {
      // iOS Safari ou outros - mostrar instruções
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      if (isIOS) {
        alert(t('installPrompt.iosInstructions') || 
          'Para instalar:\n1. Toque no botão "Compartilhar" ⬆️\n2. Role para baixo\n3. Toque em "Adicionar à Tela de Início"');
      } else {
        alert(t('installPrompt.androidInstructions') || 
          'Para instalar:\n1. Toque nos 3 pontinhos (menu)\n2. Toque em "Adicionar à tela inicial" ou "Instalar app"');
      }
    }
  };

  const handleDismiss = async () => {
    try {
      // Salvar timestamp de quando foi dismissed
      const dismissData = {
        timestamp: Date.now(),
        dismissed: true
      };
      await AsyncStorage.setItem('install_prompt_dismissed', JSON.stringify(dismissData));
      console.log('⏸️ Prompt dismissed, não mostrará pelos próximos 7 dias');
      animateOut(() => setShowPrompt(false));
    } catch (error) {
      console.error('Error dismissing prompt:', error);
    }
  };

  if (!showPrompt) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="download-outline" size={24} color="#C8B6FF" />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {t('installPrompt.title') || 'Instalar EaseMind'}
          </Text>
          <Text style={styles.subtitle}>
            {t('installPrompt.subtitle') || 'Acesso rápido direto da sua tela inicial'}
          </Text>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.installButton}
            onPress={handleInstall}
          >
            <Text style={styles.installButtonText}>
              {t('installPrompt.install') || 'Instalar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.dismissButton}
            onPress={handleDismiss}
          >
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingTop: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  installButton: {
    backgroundColor: '#C8B6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  installButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
