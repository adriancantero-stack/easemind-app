import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useStore } from '../store/useStore';
import { theme } from '../utils/theme';
import { useTranslation } from 'react-i18next';
import { BreathAnimation } from '../components/BreathAnimation';

export default function SessionDetailsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentTheme = isDarkMode ? theme.dark : theme.light;

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Dados das sessões (simplificado - em produção viria de uma fonte de dados)
  const sessionSteps: { [key: string]: string[] } = {
    '1': [
      'Encontre uma posição confortável',
      'Inspire por 4 segundos',
      'Segure por 4 segundos',
      'Expire por 4 segundos',
      'Segure por 4 segundos',
      'Repita este ciclo',
    ],
    '2': [
      'Sente-se confortavelmente',
      'Inspire pelo nariz por 4 segundos',
      'Segure a respiração por 7 segundos',
      'Expire pela boca por 8 segundos',
      'Repita o ciclo 3-4 vezes',
    ],
    '3': [
      'Deite-se ou sente-se confortavelmente',
      'Contraia os músculos dos pés por 5 segundos',
      'Relaxe completamente',
      'Suba para as pernas, depois abdômen',
      'Continue até a cabeça',
      'Sinta o relaxamento total',
    ],
    '4': [
      'Pense em 3 coisas pelas quais é grato',
      'Visualize cada uma delas',
      'Sinta a gratidão no seu coração',
      'Respire profundamente',
    ],
    '5': [
      'Deite-se confortavelmente',
      'Escaneie seu corpo da cabeça aos pés',
      'Note cada sensação',
      'Relaxe cada parte do corpo',
      'Deixe-se levar ao sono',
    ],
    '6': [
      'Respire fundo 3 vezes',
      'Feche os olhos',
      'Solte os ombros',
      'Sinta a calma',
    ],
    '7': [
      'Desligue dispositivos eletrônicos',
      'Faça alguns alongamentos suaves',
      'Pratique respiração calma',
      'Prepare-se para descansar',
    ],
    '8': [
      'Feche os olhos',
      'Concentre-se na sua respiração',
      'Note sons ao seu redor',
      'Esteja presente neste momento',
    ],
  };

  const steps = sessionSteps[id as string] || [];

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

  const playAudio = async () => {
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

        {/* Progresso */}
        <Text style={[styles.stepIndicator, { color: currentTheme.textSecondary }]}>
          {t('sessions.step')} {currentStep + 1} {t('sessions.of')} {steps.length}
        </Text>

        {/* Instrução atual */}
        <View style={[styles.instructionCard, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.instruction, { color: currentTheme.text }]}>
            {steps[currentStep]}
          </Text>
        </View>

        {/* Controle de áudio */}
        <TouchableOpacity
          style={[styles.audioButton, { backgroundColor: currentTheme.accent1 }]}
          onPress={isPlaying ? stopAudio : playAudio}
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
});
