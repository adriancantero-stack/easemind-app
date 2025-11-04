import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
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
  const { t } = useTranslation();
  const userProfile = useStore((state) => state.userProfile);
  
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [lunaResponse, setLunaResponse] = useState('');
  
  const wsRef = useRef<WebSocket | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 
                     Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL ||
                     'http://localhost:8001';

  useEffect(() => {
    // Request audio permissions
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('permission_required') || 'Permission Required',
          t('microphone_permission') || 'Microphone access is required for voice chat'
        );
      }
    })();

    // Configure audio mode
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    return () => {
      // Cleanup
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const connectWebSocket = async () => {
    try {
      // Por enquanto, mostrar mensagem que está em desenvolvimento
      Alert.alert(
        t('voiceChat.comingSoon') || 'Em Breve',
        t('voiceChat.comingSoonMessage') || 'O chat de voz com Gemini Live está em desenvolvimento. Por enquanto, use o chat de texto ou o botão de microfone na conversa.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
      
      /* IMPLEMENTAÇÃO FUTURA - Gemini Live WebSocket
      const wsUrl = backendUrl.replace('http', 'ws').replace('https', 'wss') + '/ws/gemini-live';
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('🎤 WebSocket connected');
        setIsConnected(true);
        
        // Send initialization message
        ws.send(JSON.stringify({
          type: 'init',
          user_id: user?.uid || 'guest',
          user_name: userProfile?.display_name || user?.displayName || 'amigo'
        }));
      };
      
      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'ready') {
            console.log('✅ Gemini Live session ready');
          } else if (data.type === 'audio_response') {
            // Play audio response from Luna
            setIsSpeaking(true);
            await playAudioResponse(data.data);
            setIsSpeaking(false);
          } else if (data.type === 'transcription') {
            // Display transcription
            setLunaResponse(data.text);
          } else if (data.type === 'error') {
            console.error('❌ Error from server:', data.message);
            Alert.alert('Error', data.message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        Alert.alert('Connection Error', 'Failed to connect to voice chat');
        setIsConnected(false);
      };
      
      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      Alert.alert('Error', 'Could not establish connection');
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
      setIsListening(true);
      setTranscription('Listening...');
      
      // Start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });
      
      await recording.startAsync();
      recordingRef.current = recording;
      
      console.log('🎤 Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Could not start recording');
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      if (!recordingRef.current) return;
      
      setIsListening(false);
      setTranscription('Processing...');
      
      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      
      if (!uri) {
        console.error('No recording URI');
        return;
      }
      
      console.log('✅ Recording stopped:', uri);
      
      // Read audio file and convert to base64
      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64data = reader.result?.toString().split(',')[1];
        if (base64data && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          // Send audio to backend
          wsRef.current.send(JSON.stringify({
            type: 'audio',
            data: base64data
          }));
          
          setTranscription('Sent to Luna...');
        }
      };
      
      reader.readAsDataURL(blob);
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Could not process recording');
      setIsListening(false);
    }
  };

  const playAudioResponse = async (base64Audio: string) => {
    try {
      // Decode base64 to audio
      const sound = new Audio.Sound();
      await sound.loadAsync({
        uri: `data:audio/mp3;base64,${base64Audio}`
      });
      
      soundRef.current = sound;
      await sound.playAsync();
      
      // Wait for playback to finish
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          setIsSpeaking(false);
        }
      });
      
    } catch (error) {
      console.error('Failed to play audio:', error);
      setIsSpeaking(false);
    }
  };

  const toggleConnection = () => {
    if (isConnected) {
      disconnectWebSocket();
    } else {
      connectWebSocket();
    }
  };

  const handleMicrophonePress = () => {
    if (!isConnected) {
      Alert.alert(
        t('not_connected') || 'Not Connected',
        t('connect_first') || 'Please connect first'
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
