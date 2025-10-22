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
  const isGuidedModeRef = useRef(false); // Ref para manter estado atualizado nos closures
  const currentStepRef = useRef(0); // Ref para manter step atual nos closures
  
  const { playAudio, isLoading: isLoadingTTS } = useAudioPlayer();
  const language = useStore((state) => state.language);
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';
  
  console.log('🔧 Backend URL configurada:', backendUrl);

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
    '1': require('../assets/audio/respiracao_caixa.mp3'),
    '2': require('../assets/audio/respiracao_4_7_8.mp3'),
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

  // Função removida - não há mais fala, apenas avanço de cards

  // Função para obter duração total da sessão
  const getSessionDuration = (sessionId: string): number => {
    // Sessão 2 (4-7-8 Breathing) dura 3 minutos
    if (sessionId === '2') {
      return 180000; // 3 minutos em ms
    }
    // Sessão 3 (Progressive Muscle Relaxation) dura 5 minutos
    if (sessionId === '3') {
      return 300000; // 5 minutos em ms
    }
    // Sessão 5 (Body Scan for Sleep) dura 5 minutos
    if (sessionId === '5') {
      return 300000; // 5 minutos em ms
    }
    // Todas as outras sessões usam 2 minutos
    return 120000; // 2 minutos em ms
  };

  // Função para obter duração do step baseada na sessão
  const getStepDuration = (sessionId: string, stepIndex: number): number => {
    // Sessão 2 (4-7-8 Breathing) tem tempos variáveis
    if (sessionId === '2') {
      const durations = [4000, 7000, 8000, 4000]; // 4s, 7s, 8s, 4s
      return durations[stepIndex] || 4000;
    }
    // Sessão 3 (Progressive Muscle Relaxation) usa 10 segundos por step
    if (sessionId === '3') {
      return 10000; // 10 segundos
    }
    // Sessão 5 (Body Scan for Sleep) usa 15 segundos por step
    if (sessionId === '5') {
      return 15000; // 15 segundos
    }
    // Todas as outras sessões usam 4 segundos
    return 4000;
  };

  // Função para avançar para o próximo step
  const advanceToNextStep = () => {
    console.log('⏭️ advanceToNextStep chamado. isGuidedModeRef:', isGuidedModeRef.current, 'currentStepRef:', currentStepRef.current, 'steps.length:', steps.length);
    
    if (!isGuidedModeRef.current || steps.length === 0) {
      console.log('⚠️ Não pode avançar - modo guiado inativo ou sem steps');
      return;
    }
    
    const nextStep = (currentStepRef.current + 1) % steps.length; // Loop circular usando ref
    console.log('📍 Avançando de step', currentStepRef.current, 'para', nextStep);
    currentStepRef.current = nextStep; // Atualizar ref
    setCurrentStep(nextStep); // Atualizar state
    
    // Sem fala - apenas avanço visual dos cards
    
    // Calcular tempo para o próximo step baseado na sessão
    const stepDuration = getStepDuration(id as string, nextStep);
    
    // Agendar próximo step
    console.log('⏰ Agendando próximo step em', stepDuration, 'ms (step', nextStep, 'da sessão', id, ')');
    const timerId = setTimeout(() => {
      console.log('⏰ Timer disparado! Chamando advanceToNextStep recursivamente...');
      advanceToNextStep();
    }, stepDuration);
    stepTimerRef.current = timerId;
    console.log('⏰ Novo timer ID criado:', timerId);
  };

  // Iniciar sessão guiada
  const startGuidedSession = async () => {
    console.log('🚀 startGuidedSession foi chamado!');
    console.log('Steps disponíveis:', steps.length);
    console.log('Steps:', steps);
    
    if (steps.length === 0) {
      console.log('⚠️ Não há steps para iniciar sessão guiada');
      return;
    }
    
    console.log('🎬 Iniciando sessão guiada com', steps.length, 'steps...');
    console.log('📝 Primeiro step:', steps[0].substring(0, 50) + '...');
    
    setIsGuidedMode(true);
    isGuidedModeRef.current = true; // Sincronizar ref
    setCurrentStep(0);
    currentStepRef.current = 0; // Sincronizar ref do step
    setElapsedTime(0);
    
    try {
      // Tocar música de fundo
      console.log('🎵 Iniciando áudio de respiração...');
      await playBackgroundAudio();
      console.log('✅ Áudio iniciado');
      
      // Iniciar timer principal (conta tempo total)
      const sessionDuration = getSessionDuration(id as string);
      const startTime = Date.now();
      
      console.log('⏱️ Timer principal iniciado, duração:', sessionDuration, 'ms (', sessionDuration/1000, 'segundos )');
      
      guidedTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setElapsedTime(elapsed);
        
        // Se completou a duração, parar
        if (elapsed >= sessionDuration) {
          console.log('⏰ Tempo da sessão completado, parando...');
          stopGuidedSession();
        }
      }, 1000); // Atualiza a cada segundo
      
      // Agendar primeiro avanço de step (duração baseada na sessão)
      const stepDuration = getStepDuration(id as string, 0);
      console.log('⏰ Agendando primeiro avanço em', stepDuration, 'ms (step 0 da sessão', id, ')...');
      const timerId = setTimeout(() => {
        console.log('⏰ Timer de', stepDuration, 'ms atingido, avançando para próximo step...');
        advanceToNextStep();
      }, stepDuration);
      stepTimerRef.current = timerId;
      console.log('⏰ Timer ID criado:', timerId);
      
      console.log('✅ Sessão guiada completamente configurada');
    } catch (error) {
      console.error('❌ Erro ao iniciar sessão guiada:', error);
      if (error instanceof Error) {
        console.error('❌ Detalhes:', error.message, error.stack);
      }
    }
  };

  // Parar sessão guiada
  const stopGuidedSession = () => {
    console.log('⏹️ Parando sessão guiada...');
    setIsGuidedMode(false);
    isGuidedModeRef.current = false; // Sincronizar ref
    
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

  // Navegação manual removida - sessão totalmente automática

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
        {(id === '1' || id === '2') && isGuidedMode && (
          <View style={styles.animationContainer}>
            <BreathAnimation />
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
          <Text style={[
            styles.instruction, 
            { color: isGuidedMode ? 'white' : currentTheme.text }
          ]}>
            {steps[currentStep]}
          </Text>
        </View>

        {/* Botão Sessão Guiada - Agora abaixo do card */}
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
              {Math.floor(elapsedTime / 1000)}s / {getSessionDuration(id as string) / 1000}s
            </Text>
          </View>
        )}
      </ScrollView>
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
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    minHeight: 75,
    justifyContent: 'center',
  },
  instruction: {
    fontSize: 18,
    lineHeight: 26,
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
