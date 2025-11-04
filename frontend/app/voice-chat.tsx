import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LunaOrb } from '../components/LunaOrb';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store/useStore';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';

export default function VoiceChatScreen() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const userProfile = useStore((state) => state.userProfile);
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [lunaResponse, setLunaResponse] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const audioStreamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 
                     Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL ||
                     'http://localhost:8001';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
      stopListening();
    };
  }, []);

  const connectWebSocket = async () => {
    try {
      setIsConnecting(true);
      setStatusMessage(t('voiceChat.connecting') || 'Conectando...');
      
      console.log('🎤 Connecting to WebSocket...');
      console.log('Backend URL:', backendUrl);
      
      // Build WebSocket URL
      const wsUrl = backendUrl.replace('http', 'ws').replace('https', 'wss') + '/api/ws/gemini-live';
      console.log('WebSocket URL:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setStatusMessage(t('voiceChat.connected') || 'Conectado');
        
        // Send initialization message
        const initMessage = {
          type: 'init',
          user_id: user?.uid || 'guest',
          user_name: userProfile?.display_name || user?.displayName || 'amigo',
          lang: i18n.language || 'pt-BR'
        };
        
        console.log('📤 Sending init message:', initMessage);
        ws.send(JSON.stringify(initMessage));
      };
      
      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📥 Received message:', data.type);
          
          if (data.type === 'ready') {
            console.log('✅ Gemini Live session ready');
            setStatusMessage(t('voiceChat.ready') || 'Pronto');
            Alert.alert(
              t('voiceChat.ready') || 'Pronto!',
              t('voiceChat.readyMessage') || 'Pode começar a falar! Pressione o botão do microfone.',
              [{ text: 'OK' }]
            );
          } else if (data.type === 'audio_response') {
            // Play audio response from Luna
            console.log('🔊 Received audio response');
            setIsSpeaking(true);
            setIsListening(false);
            setStatusMessage(t('voiceChat.lunaSpeaking') || 'Luna está falando...');
            await playAudioResponse(data.data);
            setIsSpeaking(false);
            setStatusMessage('');
          } else if (data.type === 'transcription') {
            // Display transcription
            console.log('📝 Received transcription:', data.text);
            setLunaResponse(data.text);
          } else if (data.type === 'error') {
            console.error('❌ Error from server:', data.message);
            Alert.alert(
              t('error') || 'Erro',
              data.message
            );
            setStatusMessage('');
            setIsListening(false);
            setIsSpeaking(false);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        Alert.alert(
          t('error') || 'Erro',
          t('voiceChat.connectionError') || 'Não foi possível conectar ao chat de voz'
        );
        setIsConnected(false);
        setIsConnecting(false);
        setStatusMessage('');
      };
      
      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
        setIsConnecting(false);
        setStatusMessage('');
        
        // Stop listening if active
        if (isListening) {
          stopListening();
        }
      };
      
      wsRef.current = ws;
      
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      Alert.alert(
        t('error') || 'Erro',
        t('voiceChat.connectionFailed') || 'Não foi possível estabelecer conexão'
      );
      setIsConnecting(false);
      setStatusMessage('');
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'end' }));
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  const startListening = async () => {
    try {
      console.log('🎤 Starting recording...');
      
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          t('voiceChat.permissionRequired') || 'Permissão Necessária',
          t('voiceChat.microphonePermission') || 'Acesso ao microfone é necessário para o chat de voz'
        );
        return;
      }
      
      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      setIsListening(true);
      setTranscription(t('voiceChat.listening') || 'Ouvindo...');
      setStatusMessage(t('voiceChat.lunaListening') || 'Luna está ouvindo...');
      
      // Start recording with PCM format (required by Gemini)
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.IOSOutputFormat.LINEARPCM,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/wav',
          bitsPerSecond: 128000,
        },
      });
      
      await recording.startAsync();
      recordingRef.current = recording;
      
      console.log('✅ Recording started successfully');
      
      // Start streaming audio chunks every 1 second
      audioStreamIntervalRef.current = setInterval(async () => {
        try {
          if (!recordingRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
          }
          
          // Get recording status to access URI
          const status = await recordingRef.current.getStatusAsync();
          if (status.isRecording && status.durationMillis > 500) {
            // Send audio chunk every 1 second
            console.log('📤 Sending audio chunk...');
            // Note: In production, you'd want to stream actual chunks
            // For now, we'll send the full audio when user stops
          }
        } catch (error) {
          console.error('Error in audio streaming:', error);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert(
        t('error') || 'Erro',
        t('voiceChat.recordingError') || 'Não foi possível iniciar a gravação'
      );
      setIsListening(false);
      setStatusMessage('');
    }
  };

  const stopListening = async () => {
    try {
      console.log('🛑 Stopping recording...');
      
      // Clear streaming interval
      if (audioStreamIntervalRef.current) {
        clearInterval(audioStreamIntervalRef.current);
        audioStreamIntervalRef.current = null;
      }
      
      if (!recordingRef.current) {
        console.log('No active recording');
        return;
      }
      
      setIsListening(false);
      setTranscription(t('voiceChat.processing') || 'Processando...');
      setStatusMessage(t('voiceChat.processing') || 'Processando...');
      
      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
      
      if (!uri) {
        console.error('No recording URI');
        setStatusMessage('');
        return;
      }
      
      console.log('✅ Recording stopped:', uri);
      
      // Check if WebSocket is connected
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        Alert.alert(
          t('error') || 'Erro',
          t('voiceChat.notConnected') || 'Não conectado'
        );
        setStatusMessage('');
        return;
      }
      
      // Read audio file and convert to base64
      console.log('📖 Reading audio file...');
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64data = reader.result?.toString().split(',')[1];
        
        if (base64data && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          console.log('📤 Sending audio to backend:', base64data.length, 'bytes');
          
          // Send audio to backend
          wsRef.current.send(JSON.stringify({
            type: 'audio',
            data: base64data
          }));
          
          setTranscription(t('voiceChat.sentToLuna') || 'Enviado para Luna...');
          setStatusMessage(t('voiceChat.waitingResponse') || 'Aguardando resposta...');
        } else {
          console.error('Cannot send audio: WebSocket not ready');
          setStatusMessage('');
        }
      };
      
      reader.readAsDataURL(blob);
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert(
        t('error') || 'Erro',
        t('voiceChat.processingError') || 'Não foi possível processar a gravação'
      );
      setIsListening(false);
      setStatusMessage('');
    }
  };

  const playAudioResponse = async (base64Audio: string) => {
    try {
      console.log('🔊 Playing audio response...');
      
      // Clean up previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      
      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
      
      // Create and load sound
      const sound = new Audio.Sound();
      await sound.loadAsync({
        uri: `data:audio/pcm;base64,${base64Audio}`
      });
      
      soundRef.current = sound;
      
      // Set up playback status updates
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          console.log('✅ Audio playback finished');
          sound.unloadAsync();
          setIsSpeaking(false);
          setStatusMessage('');
        }
      });
      
      // Start playback
      await sound.playAsync();
      console.log('🔊 Audio playing...');
      
    } catch (error) {
      console.error('Failed to play audio:', error);
      setIsSpeaking(false);
      setStatusMessage('');
      
      // Try to display text response if audio fails
      if (lunaResponse) {
        Alert.alert(
          'Luna',
          lunaResponse,
          [{ text: 'OK' }]
        );
      }
    }
  };

  const toggleConnection = () => {
    if (isConnecting) return; // Prevent multiple connection attempts
    
    if (isConnected) {
      disconnectWebSocket();
    } else {
      connectWebSocket();
    }
  };

  const handleMicrophonePress = () => {
    if (!isConnected) {
      Alert.alert(
        t('voiceChat.notConnected') || 'Não Conectado',
        t('voiceChat.connectFirst') || 'Por favor, conecte primeiro'
      );
      return;
    }
    
    if (isSpeaking) {
      Alert.alert(
        t('voiceChat.wait') || 'Aguarde',
        t('voiceChat.lunaIsSpeaking') || 'Luna está falando, aguarde terminar'
      );
      return;
    }
    
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('voice_chat') || 'Voice Chat with Luna'}
        </Text>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      {/* Blurred background effect */}
      <BlurView intensity={isListening || isSpeaking ? 80 : 0} style={styles.blurContainer}>
        {/* Luna Orb */}
        <View style={styles.orbContainer}>
          <LunaOrb 
            isListening={isListening}
            isSpeaking={isSpeaking}
            size={250}
          />
        </View>

        {/* Status text */}
        {isConnected && (
          <View style={styles.statusContainer}>
            {isSpeaking && (
              <Text style={styles.statusText}>
                🗣️ {t('luna_speaking') || 'Luna está falando...'}
              </Text>
            )}
            {isListening && (
              <Text style={styles.statusText}>
                👂 {t('luna_listening') || 'Luna está ouvindo...'}
              </Text>
            )}
            {!isListening && !isSpeaking && (
              <Text style={styles.statusText}>
                ✨ {t('press_to_speak') || 'Pressione para falar'}
              </Text>
            )}
          </View>
        )}

        {/* Transcription */}
        {transcription && (
          <View style={styles.transcriptionContainer}>
            <Text style={styles.transcriptionLabel}>
              {t('you') || 'Você'}:
            </Text>
            <Text style={styles.transcriptionText}>{transcription}</Text>
          </View>
        )}

        {/* Luna response */}
        {lunaResponse && (
          <View style={[styles.transcriptionContainer, styles.responseContainer]}>
            <Text style={styles.transcriptionLabel}>Luna:</Text>
            <Text style={styles.transcriptionText}>{lunaResponse}</Text>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {/* Microphone button */}
          <TouchableOpacity
            style={[
              styles.micButton,
              isListening && styles.micButtonActive,
              !isConnected && styles.micButtonDisabled
            ]}
            onPress={handleMicrophonePress}
            disabled={!isConnected || isSpeaking}
          >
            <Ionicons 
              name={isListening ? "mic" : "mic-outline"} 
              size={40} 
              color="#fff" 
            />
          </TouchableOpacity>

          {/* Connection toggle */}
          <TouchableOpacity
            style={[
              styles.connectionButton,
              isConnected && styles.connectionButtonActive
            ]}
            onPress={toggleConnection}
          >
            <Ionicons 
              name={isConnected ? "wifi" : "wifi-outline"} 
              size={24} 
              color="#fff" 
            />
            <Text style={styles.connectionButtonText}>
              {isConnected ? t('disconnect') || 'Disconnect' : t('connect') || 'Connect'}
            </Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E1A2B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  orbContainer: {
    marginBottom: 40,
  },
  statusContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  statusText: {
    fontSize: 18,
    color: '#C8B6FF',
    textAlign: 'center',
    fontWeight: '500',
  },
  transcriptionContainer: {
    marginTop: 20,
    backgroundColor: 'rgba(200, 182, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    maxWidth: '90%',
  },
  responseContainer: {
    backgroundColor: 'rgba(139, 127, 255, 0.15)',
  },
  transcriptionLabel: {
    fontSize: 12,
    color: '#C8B6FF',
    marginBottom: 8,
    fontWeight: '600',
  },
  transcriptionText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C8B6FF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#C8B6FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  micButtonActive: {
    backgroundColor: '#FF7F8B',
    shadowColor: '#FF7F8B',
  },
  micButtonDisabled: {
    backgroundColor: '#555',
    shadowColor: '#555',
  },
  connectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  connectionButtonActive: {
    backgroundColor: 'rgba(139, 127, 255, 0.3)',
  },
  connectionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
