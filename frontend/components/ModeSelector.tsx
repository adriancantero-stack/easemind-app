import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface ModeSelectorProps {
  onSelectText: () => void;
  onSelectVoice: () => void;
  isDarkMode: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ 
  onSelectText, 
  onSelectVoice,
  isDarkMode 
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#0E1A2B' }]}>
        {t('modeSelector.title') || 'Como você prefere conversar?'}
      </Text>
      
      <View style={styles.buttonsContainer}>
        {/* Botão Chat de Texto */}
        <TouchableOpacity 
          style={[styles.button, styles.textButton]}
          onPress={onSelectText}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="chatbubble-ellipses" size={32} color="#fff" />
            <Text style={styles.buttonTitle}>
              {t('modeSelector.writeButton') || 'Escrever'}
            </Text>
            <Text style={styles.buttonSubtitle}>
              {t('modeSelector.writeDescription') || 'Chat de texto'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Botão Chat de Voz */}
        <TouchableOpacity 
          style={[styles.button, styles.voiceButton]}
          onPress={onSelectVoice}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="mic" size={32} color="#fff" />
            <Text style={styles.buttonTitle}>
              {t('modeSelector.voiceButton') || 'Falar'}
            </Text>
            <Text style={styles.buttonSubtitle}>
              {t('modeSelector.voiceDescription') || 'Chat de voz'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  textButton: {
    backgroundColor: '#8B7FFF',
  },
  voiceButton: {
    backgroundColor: '#C8B6FF',
  },
  buttonContent: {
    alignItems: 'center',
    gap: 8,
  },
  buttonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
});
