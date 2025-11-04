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
            <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
            <Text style={styles.buttonTitle}>
              {t('modeSelector.writeButton') || 'Escrever'}
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
            <Ionicons name="mic" size={24} color="#fff" />
            <Text style={styles.buttonTitle}>
              {t('modeSelector.voiceButton') || 'Falar'}
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
    paddingVertical: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    maxWidth: 120,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  textButton: {
    backgroundColor: '#8B7FFF',
  },
  voiceButton: {
    backgroundColor: '#C8B6FF',
  },
  buttonContent: {
    alignItems: 'center',
    gap: 6,
  },
  buttonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
