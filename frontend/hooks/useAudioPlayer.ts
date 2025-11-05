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
  const [audioDuration, setAudioDuration] = useState<number>(0);

  const playAudio = async (messageId: string, text: string, lang: string, backendUrl: string, onProgress?: (progress: number) => void) => {
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
      console.log('🔊 Playing audio from URI...');
      
      // Use HTML5 Audio API for web (better PWA support)
      if (Platform.OS === 'web') {
        const audio = new Audio(uri);
        audio.onloadedmetadata = () => {
          setAudioDuration(audio.duration * 1000);
        };
        audio.onplay = () => {
          setIsPlaying(true);
        };
        audio.onended = () => {
          setIsPlaying(false);
        };
        audio.onerror = (e) => {
          console.error('❌ Audio error:', e);
          setIsPlaying(false);
        };
        
        await audio.play();
        console.log('✅ Audio playing (HTML5)');
        setIsLoading(false);
      } else {
        // Use expo-av for native
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          (status) => {
            if (status.isLoaded && status.durationMillis) {
              setAudioDuration(status.durationMillis);
            }
          }
        );

        soundRef.current = sound;
        setIsPlaying(true);

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            if (status.didJustFinish) {
              setIsPlaying(false);
              sound.unloadAsync();
            }
          }
        });

        console.log('✅ Audio playing (expo-av)');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('❌ Failed to play audio', err);
      setIsPlaying(false);
      setIsLoading(false);
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
