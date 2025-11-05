import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Animated, Linking, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Audio } from 'expo-av';
import { useStore } from '../store/useStore';
import { theme } from '../utils/theme';
import { useTranslation } from 'react-i18next';
import { BreathAnimation } from './BreathAnimation';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface PanicModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PanicModal: React.FC<PanicModalProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentTheme = isDarkMode ? theme.dark : theme.light;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const voiceSound = useRef<Audio.Sound | null>(null);
  const musicSound = useRef<Audio.Sound | null>(null);
  const voiceAudioWeb = useRef<HTMLAudioElement | null>(null);
  const musicAudioWeb = useRef<HTMLAudioElement | null>(null);

  // Configurar modo de áudio
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });
  }, []);

  // Cleanup ao fechar
  useEffect(() => {
    if (!visible) {
      stopAllAudio();
      setIsPlaying(false);
      setIsComplete(false);
      setCurrentText('');
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      // Reset state
      setIsComplete(false);
      setIsPlaying(false);
      setCurrentText(t('panic.initialMessage'));
      
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Light haptic on open
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}

      // Iniciar sessão SOS automaticamente após 1 segundo
      setTimeout(() => {
        startSOSSession();
      }, 1000);
    }
  }, [visible]);

  const stopAllAudio = async () => {
    try {
      if (voiceSound.current) {
        await voiceSound.current.stopAsync();
        await voiceSound.current.unloadAsync();
        voiceSound.current = null;
      }
      if (musicSound.current) {
        await musicSound.current.stopAsync();
        await musicSound.current.unloadAsync();
        musicSound.current = null;
      }
    } catch (error) {
      console.error('Erro ao parar áudio:', error);
    }
  };

  const getVoiceAudio = () => {
    const language = useStore.getState().language;
    
    // Selecionar áudio baseado no idioma
    if (language === 'en') {
      return require('../assets/audio/lily_english_voice.mp3');
    } else if (language === 'es') {
      return require('../assets/audio/jhenny_spanish_voice.mp3');
    } else {
      // pt-BR (padrão)
      return require('../assets/audio/luna_sos.mp3');
    }
  };

  const startSOSSession = async () => {
    console.log('🆘 Iniciando sessão SOS...');
    setIsPlaying(true);
    setCurrentText(t('panic.breatheWithMe'));

    try {
      const voiceAudioSource = getVoiceAudio();
      console.log('🎙️ Áudio selecionado para idioma:', useStore.getState().language);

      // Carregar áudios em paralelo
      const [voiceResult, musicResult] = await Promise.all([
        Audio.Sound.createAsync(
          voiceAudioSource,
          { shouldPlay: true, volume: 1.0 }
        ),
        Audio.Sound.createAsync(
          require('../assets/audio/432hz_calmante.mp3'),
          { 
            shouldPlay: true, 
            volume: 0.35,
            isLooping: true
          }
        ),
      ]);

      voiceSound.current = voiceResult.sound;
      musicSound.current = musicResult.sound;

      console.log('✅ Áudios iniciados em paralelo');

      // Monitorar progresso da voz para sincronizar textos
      voiceSound.current.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.isPlaying) {
          const positionMs = status.positionMillis;
          
          // Sincronizar textos baseado na posição do áudio
          // Ajuste esses tempos conforme o áudio real
          if (positionMs < 10000) {
            setCurrentText(t('panic.inhale'));
          } else if (positionMs < 20000) {
            setCurrentText(t('panic.hold'));
          } else if (positionMs < 30000) {
            setCurrentText(t('panic.exhale'));
          } else if (positionMs < 40000) {
            setCurrentText(t('panic.inhale'));
          } else if (positionMs < 50000) {
            setCurrentText(t('panic.hold'));
          } else if (positionMs < 60000) {
            setCurrentText(t('panic.exhale'));
          } else {
            setCurrentText(t('panic.relax'));
          }
        }

        if (status.isLoaded && status.didJustFinish) {
          console.log('✅ Voz guiada finalizada');
          handleSessionComplete();
        }
      });

    } catch (error) {
      console.error('❌ Erro ao iniciar sessão SOS:', error);
      setIsPlaying(false);
    }
  };

  const handleSessionComplete = async () => {
    console.log('🎉 Sessão SOS completada');
    setIsComplete(true);
    setCurrentText('');
    
    // Fade out da música
    if (musicSound.current) {
      try {
        await musicSound.current.setVolumeAsync(0.35);
        
        // Fade out gradual
        for (let i = 0.35; i >= 0; i -= 0.05) {
          await musicSound.current.setVolumeAsync(i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        await musicSound.current.stopAsync();
        await musicSound.current.unloadAsync();
        musicSound.current = null;
      } catch (error) {
        console.error('Erro no fade out:', error);
      }
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  const handleClose = async () => {
    await stopAllAudio();
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleTalkToLuna = () => {
    handleClose();
    router.push('/(tabs)/');
  };

  const getEmergencyNumbers = () => {
    const language = useStore.getState().language;
    
    if (language === 'en') {
      return {
        crisis: { number: '988', label: 'Suicide & Crisis Lifeline' },
        emergency: { number: '911', label: 'Emergency Services' }
      };
    } else if (language === 'es') {
      return {
        crisis: { number: '024', label: 'Línea de Atención (ES) / 911 (LATAM)' },
        emergency: { number: '112', label: 'Emergencias (ES) / 911 (LATAM)' }
      };
    } else {
      // pt-BR (padrão)
      return {
        crisis: { number: '188', label: 'CVV' },
        emergency: { number: '192', label: 'SAMU' }
      };
    }
  };

  const handleCallCrisis = () => {
    const numbers = getEmergencyNumbers();
    Linking.openURL(`tel:${numbers.crisis.number}`);
  };

  const handleCallEmergency = () => {
    const numbers = getEmergencyNumbers();
    Linking.openURL(`tel:${numbers.emergency.number}`);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <BlurView intensity={80} style={styles.blurContainer}>
          <View style={[styles.content, { backgroundColor: currentTheme.bg + 'E6' }]}>
            {!isComplete ? (
              <>
                <Text style={[styles.title, { color: currentTheme.text }]}>
                  {t('panic.title')}
                </Text>
                
                {currentText && (
                  <Text style={[styles.subtitleText, { color: currentTheme.textSecondary }]}>
                    {currentText}
                  </Text>
                )}
                
                <View style={styles.breathContainer}>
                  <BreathAnimation />
                </View>
                
                {isPlaying && (
                  <Text style={[styles.phaseText, { color: currentTheme.accent1 }]}>
                    {currentText}
                  </Text>
                )}
                
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: currentTheme.card }]}
                  onPress={handleClose}
                >
                  <Text style={[styles.closeButtonText, { color: currentTheme.text }]}>
                    {t('panic.close')}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.completeTitle, { color: currentTheme.text }]}>
                  {t('panic.complete')}
                </Text>
                
                <Text style={[styles.finalMessage, { color: currentTheme.textSecondary }]}>
                  {t('panic.finalMessage')}
                </Text>
                
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: currentTheme.accent1 }]}
                  onPress={handleTalkToLuna}
                >
                  <Ionicons name="chatbubble-ellipses" size={20} color="white" />
                  <Text style={styles.actionButtonText}>
                    {t('panic.talkToAI')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.emergencyButton, { backgroundColor: '#FF6B6B' }]}
                  onPress={handleCallCrisis}
                >
                  <Ionicons name="call" size={20} color="white" />
                  <Text style={styles.actionButtonText}>
                    {getEmergencyNumbers().crisis.label} ({getEmergencyNumbers().crisis.number})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.emergencyButton, { backgroundColor: '#FF8C42' }]}
                  onPress={handleCallEmergency}
                >
                  <Ionicons name="medical" size={20} color="white" />
                  <Text style={styles.actionButtonText}>
                    {getEmergencyNumbers().emergency.label} ({getEmergencyNumbers().emergency.number})
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: currentTheme.card }]}
                  onPress={handleClose}
                >
                  <Text style={[styles.secondaryButtonText, { color: currentTheme.text }]}>
                    {t('panic.close')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </BlurView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    maxWidth: 400,
    borderRadius: theme.radius * 1.5,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  breathContainer: {
    marginVertical: theme.spacing.xl,
  },
  phaseText: {
    fontSize: 32,
    fontWeight: '600',
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  finalMessage: {
    fontSize: 16,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
    lineHeight: 24,
  },
  actionButton: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  emergencyButton: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
