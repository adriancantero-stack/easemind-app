import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { useStore } from '../store/useStore';
import { useTypingEffect } from '../hooks/useTypingEffect';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  isLatest?: boolean;
  messageId?: string;
  onPlayAudio?: (messageId: string, text: string) => void;
  isPlayingAudio?: boolean;
  isLoadingAudio?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  role, 
  content, 
  isLatest = false, 
  messageId,
  onPlayAudio,
  isPlayingAudio = false,
  isLoadingAudio = false
}) => {
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentTheme = isDarkMode ? theme.dark : theme.light;
  const isUser = role === 'user';
  
  // Aplicar efeito de digitação apenas para mensagens da IA e apenas na última mensagem
  const shouldAnimate = !isUser && isLatest;
  const { displayedText, isTyping } = useTypingEffect(
    shouldAnimate ? content : '', 
    25 // velocidade: 25ms por caractere
  );

  // Se não deve animar, mostra o conteúdo completo
  const textToShow = shouldAnimate ? displayedText : content;

  const handlePlayAudio = () => {
    if (onPlayAudio && messageId) {
      onPlayAudio(messageId, content);
    }
  };

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? currentTheme.accent1 : currentTheme.card,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              color: isUser ? '#FFFFFF' : currentTheme.text,
            },
          ]}
        >
          {textToShow}
          {shouldAnimate && isTyping && (
            <Text style={styles.cursor}>▊</Text>
          )}
        </Text>
        
        {/* Play audio button for assistant messages */}
        {!isUser && onPlayAudio && messageId && !isTyping && (
          <TouchableOpacity 
            style={styles.audioButton}
            onPress={handlePlayAudio}
            disabled={isLoadingAudio}
          >
            {isLoadingAudio ? (
              <ActivityIndicator size="small" color={currentTheme.accent1} />
            ) : (
              <Ionicons 
                name={isPlayingAudio ? "volume-high" : "volume-medium-outline"} 
                size={18} 
                color={currentTheme.accent1} 
              />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
    borderRadius: theme.radius,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  cursor: {
    opacity: 0.7,
  },
  audioButton: {
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
    padding: 4,
  },
});
