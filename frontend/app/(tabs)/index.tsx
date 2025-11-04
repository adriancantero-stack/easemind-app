import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../../store/useStore';
import { theme } from '../../utils/theme';
import { useTranslation } from 'react-i18next';
import { MoodPicker } from '../../components/MoodPicker';
import { GreetingCard } from '../../components/GreetingCard';
import { ChatBubble } from '../../components/ChatBubble';
import { DateSeparator } from '../../components/DateSeparator';
import { VoiceButton } from '../../components/VoiceButton';
import { LunaAvatar } from '../../components/LunaAvatar';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type AvatarState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export default function HomeScreen() {
  const { t } = useTranslation();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const language = useStore((state) => state.language);
  const currentTheme = isDarkMode ? theme.dark : theme.light;
  const messages = useStore((state) => state.messages);
  const addMessage = useStore((state) => state.addMessage);
  const getUserId = useStore((state) => state.getUserId);
  
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const [userId, setUserId] = useState<string>('');
  const scrollViewRef = useRef<ScrollView>(null);
  const isAnimatingRef = useRef(false); // Prevent multiple animations

  // Get backend URL - prioritize environment variable
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 
    Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 
    'https://speech-chat-app.preview.emergentagent.com';

  // Initialize userId on component mount
  useEffect(() => {
    const initUserId = async () => {
      const id = await getUserId();
      setUserId(id);
      console.log('🆔 User ID:', id);
    };
    initUserId();
  }, [getUserId]);

  // Voice hooks
  const { isRecording, isTranscribing, startRecording, stopRecording, transcribeAudio } = useVoiceRecording();
  const { isPlaying, isLoading: isLoadingAudio, playAudio } = useAudioPlayer();

  // Avatar state management (simple version)
  useEffect(() => {
    if (isRecording) {
      setAvatarState('listening');
    } else if (isTranscribing || isLoading) {
      setAvatarState('thinking');
    } else if (isPlaying) {
      setAvatarState('speaking');
    } else {
      setAvatarState('idle');
    }
  }, [isRecording, isTranscribing, isLoading, isPlaying]);

  // Auto-scroll quando novas mensagens chegam
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleQuickAction = async (action: string) => {
    const actionTexts: Record<string, string> = {
      breathe: t('home.quickMessages.breathe'),
      calm: t('home.quickMessages.calm'),
      note: t('home.quickMessages.note'),
    };
    await sendMessage(actionTexts[action]);
  };

  const sendMessage = async (text: string, fromVoice: boolean = false) => {
    if (!text.trim() || isLoading) return;

    const userMessage = text.trim();
    setInputText('');
    addMessage('user', userMessage);
    setIsLoading(true);

    try {
      console.log('=== SEND MESSAGE DEBUG ===');
      console.log('🚀 Backend URL:', backendUrl);
      console.log('🚀 Full endpoint:', `${backendUrl}/api/chat`);
      console.log('🆔 User ID:', userId);
      console.log('🎤 From voice:', fromVoice);
      
      // Filter messages from last 24 hours
      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
      const recentMessages = messages.filter(msg => msg.timestamp > twentyFourHoursAgo);
      
      // Format history for backend
      const history = recentMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      console.log('📦 Message:', userMessage);
      console.log('📦 History length:', history.length);
      
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage,
          user_id: userId,
          history: history
        }),
      });

      const correlationId = response.headers.get('X-Correlation-ID') || 'unknown';
      console.log('📍 Correlation-ID:', correlationId);
      console.log('✅ Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, Correlation-ID: ${correlationId}`);
      }

      const data = await response.json();
      console.log('📨 Response data:', data);
      
      if (data.response) {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Add message to UI immediately
        addMessage('assistant', data.response);
        console.log('✅ Message added successfully');
        
        // Only play audio if message was sent via voice
        if (fromVoice) {
          console.log('🎤 Starting TTS playback (from voice input)');
          handlePlayAudio(messageId, data.response);
        } else {
          console.log('✍️ Text-only response (from text input)');
        }
      }
    } catch (error) {
      console.error('❌ Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('🔍 Error details:', errorMessage);
      addMessage('assistant', 'I\'m having trouble connecting. Take a deep breath. You\'re doing great.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para lidar com Enter
  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  // Voice recording handlers
  const handleStartRecording = async () => {
    console.log('🎙️ handleStartRecording called');
    try {
      const success = await startRecording();
      console.log('🎙️ startRecording result:', success);
      if (!success) {
        Alert.alert('Permissão necessária', 'Por favor, ative o acesso ao microfone para usar a função de voz.');
      }
    } catch (error) {
      console.error('❌ handleStartRecording error:', error);
      Alert.alert('Erro', 'Não foi possível iniciar a gravação.');
    }
  };

  const handleStopRecording = async () => {
    console.log('🛑 handleStopRecording called');
    try {
      const audioUri = await stopRecording();
      console.log('🛑 stopRecording result:', audioUri);
      if (audioUri) {
        console.log('📝 Starting transcription...');
        // Transcribe audio
        const transcribedText = await transcribeAudio(audioUri, backendUrl);
        console.log('📝 Transcription result:', transcribedText);
        if (transcribedText) {
          // Auto-send transcribed text WITH voice flag (true)
          await sendMessage(transcribedText, true);
        } else {
          Alert.alert('Erro', 'Não foi possível transcrever o áudio.');
        }
      }
    } catch (error) {
      console.error('❌ handleStopRecording error:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao processar o áudio.');
    }
  };

  // Audio playback handler
  const handlePlayAudio = async (messageId: string, text: string) => {
    try {
      console.log('🎵 handlePlayAudio called:', { messageId, textPreview: text.substring(0, 30), language, backendUrl });
      setPlayingMessageId(messageId);
      await playAudio(messageId, text, language, backendUrl);
      console.log('🎵 playAudio completed for:', messageId);
      setPlayingMessageId(null);
    } catch (error) {
      console.error('❌ handlePlayAudio error:', error);
      setPlayingMessageId(null);
    }
  };

  // Handle keyboard send

  return (
    <LinearGradient
      colors={currentTheme.bgGradient}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={styles.header}>
            <Image
              source={isDarkMode 
                ? require('../../assets/images/logo-easemind-dark.png')
                : require('../../assets/images/logo-easemind.png')
              }
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <ScrollView 
            ref={scrollViewRef}
            style={styles.chatContainer}
            contentContainerStyle={[
              styles.chatContent,
              messages.length === 0 && styles.centeredContent
            ]}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {/* Luna Avatar - Oculto por enquanto */}
            {/* <View style={styles.avatarContainer}>
              <LunaAvatar state={avatarState} size={120} />
            </View> */}

            {messages.length === 0 && <GreetingCard />}

            {messages.map((msg, index) => {
              // Check if we need to show a date separator
              const showDateSeparator = index === 0 || (() => {
                const prevMsg = messages[index - 1];
                const prevDate = new Date(prevMsg.timestamp);
                const currDate = new Date(msg.timestamp);
                
                // Reset hours for day comparison
                prevDate.setHours(0, 0, 0, 0);
                currDate.setHours(0, 0, 0, 0);
                
                return prevDate.getTime() !== currDate.getTime();
              })();

              return (
                <React.Fragment key={index}>
                  {showDateSeparator && <DateSeparator timestamp={msg.timestamp} />}
                  <ChatBubble 
                    role={msg.role} 
                    content={msg.content}
                    isLatest={index === messages.length - 1}
                    messageId={msg.timestamp.toString()}
                    onPlayAudio={msg.role === 'assistant' ? handlePlayAudio : undefined}
                    isPlayingAudio={playingMessageId === msg.timestamp.toString() && isPlaying}
                    isLoadingAudio={playingMessageId === msg.timestamp.toString() && isLoadingAudio}
                  />
                </React.Fragment>
              );
            })}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={currentTheme.accent1} />
            </View>
          )}
        </ScrollView>

        {/* Input bar - always visible */}
        <View style={[styles.inputContainer, { backgroundColor: currentTheme.card, borderTopColor: currentTheme.border }]}>

            <TextInput
              style={[styles.input, { color: currentTheme.text }]}
              value={inputText}
              onChangeText={setInputText}
              onKeyPress={handleKeyPress}
              placeholder={t('home.placeholder')}
              placeholderTextColor={currentTheme.textMuted}
              multiline
              maxLength={500}
              onSubmitEditing={() => sendMessage(inputText)}
              blurOnSubmit={false}
            />
            <VoiceButton
              isRecording={isRecording}
              isTranscribing={isTranscribing}
              onPressIn={handleStartRecording}
              onPressOut={handleStopRecording}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: currentTheme.accent1, opacity: inputText.trim() ? 1 : 0.5 }]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>→</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  logo: {
    width: 150,
    height: 50,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    paddingBottom: theme.spacing.md,
  },
  centeredContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 100,
  },
  loadingContainer: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  quickActions: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  chipButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    marginBottom: theme.spacing.md, // Eleva a barra
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: theme.spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  sendButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
});
