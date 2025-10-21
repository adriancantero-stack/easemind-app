import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

interface AudioCache {
  [key: string]: string; // messageId -> data URI
}

export const useAudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const cacheRef = useRef<AudioCache>({});

  const playAudio = async (messageId: string, text: string, lang: string, backendUrl: string) => {
    try {
      // Check cache first
      if (cacheRef.current[messageId]) {
        console.log('🔊 Playing from cache:', messageId);
        await playFromUri(cacheRef.current[messageId]);
        return;
      }

      setIsLoading(true);
      console.log('🔊 Fetching audio from TTS...', { messageId, text: text.substring(0, 50) });

      // Request TTS from backend (now using OpenAI)
      const response = await fetch(`${backendUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, lang, provider: 'openai' }),
      });

      console.log('📥 TTS Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ TTS Error:', errorText);
        throw new Error(`TTS failed: ${response.status} - ${errorText}`);
      }

      // For web/mobile - use data URI directly
      const blob = await response.blob();
      console.log('📦 Blob received:', blob.size, 'bytes');
      
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          const dataUri = reader.result as string;
          
          // Cache the data URI
          cacheRef.current[messageId] = dataUri;
          
          console.log('✅ Audio cached as data URI, playing now...');
          await playFromUri(dataUri);
        } catch (playError) {
          console.error('❌ Play error:', playError);
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        console.error('❌ FileReader error');
        setIsLoading(false);
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('❌ Audio playback error:', error);
      setIsLoading(false);
    }
  };

  const playFromUri = async (uri: string) => {
    try {
      console.log('🔊 playFromUri called with uri length:', uri.length);
      
      // Stop and cleanup any currently playing sound
      if (soundRef.current) {
        console.log('🛑 Stopping previous sound...');
        try {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
        } catch (e) {
          console.log('⚠️ Error stopping previous sound:', e);
        }
        soundRef.current = null;
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      console.log('🔊 Creating new sound from data URI...');
      
      // Create sound without autoplay first
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false }, // Don't autoplay yet
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      console.log('✅ Sound created successfully');
      
      // Check if sound is loaded
      const status = await sound.getStatusAsync();
      console.log('📊 Sound status:', status);
      
      if (status.isLoaded) {
        console.log('▶️ Playing sound now...');
        await sound.playAsync();
        setIsPlaying(true);
        console.log('✅ Sound playing!');
      } else {
        throw new Error('Sound failed to load');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Failed to play audio:', error);
      if (error instanceof Error) {
        console.error('❌ Error details:', error.message, error.stack);
      }
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.didJustFinish) {
      console.log('✅ Audio finished playing');
      setIsPlaying(false);
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    }
  };

  const stopAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsPlaying(false);
  };

  return {
    isPlaying,
    isLoading,
    playAudio,
    stopAudio,
  };
};
