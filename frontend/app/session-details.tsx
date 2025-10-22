import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useStore } from '../store/useStore';
import { theme } from '../utils/theme';
import { useTranslation } from 'react-i18next';
import { BreathAnimation } from '../components/BreathAnimation';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import Constants from 'expo-constants';

export default function SessionDetailsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentTheme = isDarkMode ? theme.dark : theme.light;

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isGuidedMode, setIsGuidedMode] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const guidedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { playAudio, isLoading: isLoadingTTS } = useAudioPlayer();
  const language = useStore((state) => state.language);
  const backendUrl = Constants.expoConfig?.extra?.backendUrl || 'http://localhost:8001';

  // Get session steps from translations
  const getSessionSteps = (sessionId: string): string[] => {
    const stepsKey = `sessions.list.${sessionId}.steps`;
    const stepsData = t(stepsKey, { returnObjects: true });
    
    // If translation exists and is an array, return it
    if (Array.isArray(stepsData)) {
      return stepsData;
    }
    
    // Fallback to empty array
    return [];
  };

  const steps = getSessionSteps(id as string);

  // Mapear sons para cada sessão
  const sessionAudio: { [key: string]: any } = {
    '1': require('../assets/audio/neutral_breath.mp3'),
    '2': require('../assets/audio/neutral_breath.mp3'),
    '3': require('../assets/audio/gentle_rain.mp3'),
    '4': require('../assets/audio/sunrise_soft.mp3'),
    '5': require('../assets/audio/night_wind.mp3'),
    '6': require('../assets/audio/chime_up.mp3'),
    '7': require('../assets/audio/deep_piano.mp3'),
    '8': require('../assets/audio/forest_birds.mp3'),
  };

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playBackgroundAudio = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const audioFile = sessionAudio[id as string];
      if (!audioFile) return;

      const { sound: newSound } = await Audio.Sound.createAsync(
        audioFile,
        { shouldPlay: true, isLooping: true, volume: 0.5 }
      );
      setSound(newSound);
      setIsPlaying(true);
    } catch (error) {
      console.error('Erro ao tocar áudio:', error);
    }
  };

  const stopAudio = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Erro ao parar áudio:', error);
    }
  };

  // Função para falar um step usando TTS
  const speakStep = async (stepText: string) => {
    try {
      const messageId = `step_${Date.now()}`;
      // Usar o playAudio do hook para TTS
      await playAudio(messageId, stepText, language, backendUrl);
      console.log('🗣️ Luna falou:', stepText);
    } catch (error) {
      console.error('Erro ao falar step:', error);
    }
  };

  // Função para avançar para o próximo step
  const advanceToNextStep = async () => {
    if (!isGuidedMode || steps.length === 0) return;
    
    const nextStep = (currentStep + 1) % steps.length; // Loop circular
    setCurrentStep(nextStep);
    
    // Falar o próximo step
    await speakStep(steps[nextStep]);
    
    // Calcular tempo para o próximo step (4 segundos por padrão)
    const stepDuration = 4000; // 4 segundos
    
    // Agendar próximo step
    stepTimerRef.current = setTimeout(() => {
      advanceToNextStep();
    }, stepDuration);
  };

  // Iniciar sessão guiada
  const startGuidedSession = async () => {
    if (steps.length === 0) return;
    
    console.log('🎬 Iniciando sessão guiada...');
    setIsGuidedMode(true);
    setCurrentStep(0);
    setElapsedTime(0);
    
    // Tocar música de fundo
    await playBackgroundAudio();
    
    // Falar o primeiro step
    await speakStep(steps[0]);
    
    // Iniciar timer principal (conta tempo total)
    const sessionDuration = 120000; // 2 minutos em ms
    const startTime = Date.now();
    
    guidedTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedTime(elapsed);
      
      // Se completou a duração, parar
      if (elapsed >= sessionDuration) {
        stopGuidedSession();
      }
    }, 1000); // Atualiza a cada segundo
    
    // Agendar primeiro avanço de step (após 4 segundos)
    stepTimerRef.current = setTimeout(() => {
      advanceToNextStep();
    }, 4000);
  };

  // Parar sessão guiada
  const stopGuidedSession = () => {
    console.log('⏹️ Parando sessão guiada...');
    setIsGuidedMode(false);
    
    // Limpar timers
    if (guidedTimerRef.current) {
      clearInterval(guidedTimerRef.current);
      guidedTimerRef.current = null;
    }
    
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    
    // Parar música de fundo
    stopAudio();
  };

  // Cleanup ao desmontar componente
  useEffect(() => {
    return () => {
      if (guidedTimerRef.current) {
        clearInterval(guidedTimerRef.current);
      }
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
      }
    };
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Sessão finalizada
      stopAudio();
      router.back();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.bg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { stopAudio(); router.back(); }}>
          <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>
          {t(`sessions.list.${id}.title`)}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Animação de respiração (apenas para sessões 1 e 2) */}
        {(id === '1' || id === '2') && (
          <View style={styles.animationContainer}>
            <BreathAnimation />
          </View>
        )}

        {/* Botão Sessão Guiada */}
        {!isGuidedMode ? (
          <TouchableOpacity
            style={[styles.guidedButton, { backgroundColor: currentTheme.accent1 }]}
            onPress={startGuidedSession}
            disabled={isLoadingTTS}
          >
            <Ionicons name="play-circle" size={24} color="white" />
            <Text style={styles.guidedButtonText}>
              {t('sessions.startGuided') || 'Iniciar Sessão Guiada'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.guidedStatusContainer}>
            <TouchableOpacity
              style={[styles.stopButton, { backgroundColor: '#EF4444' }]}
              onPress={stopGuidedSession}
            >
              <Ionicons name="stop-circle" size={24} color="white" />
              <Text style={styles.stopButtonText}>
                {t('sessions.stop') || 'Parar'}
              </Text>
            </TouchableOpacity>
            
            {/* Indicador de tempo */}
            <Text style={[styles.timerText, { color: currentTheme.text }]}>
              {Math.floor(elapsedTime / 1000)}s / 120s
            </Text>
          </View>
        )}

        {/* Progresso */}
        <Text style={[styles.stepIndicator, { color: currentTheme.textSecondary }]}>
          {t('sessions.step')} {currentStep + 1} {t('sessions.of')} {steps.length}
        </Text>

        {/* Instrução atual */}
        <View style={[
          styles.instructionCard, 
          { 
            backgroundColor: isGuidedMode ? currentTheme.accent1 : currentTheme.card,
            borderWidth: isGuidedMode ? 3 : 0,
            borderColor: currentTheme.accent2,
          }
        ]}>
          {isGuidedMode && (
            <View style={styles.speakingIndicator}>
              <Ionicons name="volume-high" size={20} color="white" />
              <Text style={styles.speakingText}>Luna está falando...</Text>
            </View>
          )}
          <Text style={[
            styles.instruction, 
            { color: isGuidedMode ? 'white' : currentTheme.text }
          ]}>
            {steps[currentStep]}
          </Text>
        </View>

        {/* Controle de áudio */}
        <TouchableOpacity
          style={[styles.audioButton, { backgroundColor: currentTheme.accent1 }]}
          onPress={isPlaying ? stopAudio : playBackgroundAudio}
        >
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#FFF" />
          <Text style={styles.audioButtonText}>
            {isPlaying ? 'Pausar Som' : 'Tocar Som'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Botões de navegação */}
      <View style={[styles.footer, { backgroundColor: currentTheme.card }]}>
        <TouchableOpacity
          style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
          onPress={handleBack}
          disabled={currentStep === 0}
        >
          <Text style={[styles.navButtonText, { color: currentTheme.text }]}>
            {t('sessions.back')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButtonPrimary, { backgroundColor: currentTheme.accent1 }]}
          onPress={handleNext}
        >
          <Text style={styles.navButtonPrimaryText}>
            {currentStep === steps.length - 1 ? t('sessions.finish') : t('sessions.next')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  animationContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  stepIndicator: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  instructionCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    minHeight: 150,
    justifyContent: 'center',
  },
  instruction: {
    fontSize: 20,
    lineHeight: 32,
    textAlign: 'center',
    fontWeight: '500',
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  audioButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  navButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  navButtonPrimary: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  navButtonPrimaryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  guidedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    gap: 12,
  },
  guidedButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  guidedStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    gap: 8,
  },
  stopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  speakingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
