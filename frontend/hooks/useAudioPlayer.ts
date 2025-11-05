import { useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

interface AudioCache {
  [key: string]: string; // messageId -> data URI
}

// Global flag to track if audio context is unlocked
let audioContextUnlocked = false;
let globalAudioElement: HTMLAudioElement | null = null;

export const useAudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const cacheRef = useRef<AudioCache>({});
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Unlock audio context on mount for web/mobile
  useEffect(() => {
    if (Platform.OS === 'web' && !audioContextUnlocked) {
      const unlockAudio = () => {
        console.log('🔓 Attempting to unlock audio context...');
        
        // Create and play silent audio to unlock
        if (!globalAudioElement) {
          globalAudioElement = new window.Audio();
          globalAudioElement.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
          globalAudioElement.setAttribute('playsinline', 'true');
          globalAudioElement.setAttribute('webkit-playsinline', 'true');
        }
        
        globalAudioElement.play()
          .then(() => {
            console.log('✅ Audio context unlocked!');
            audioContextUnlocked = true;
            // Clean up event listeners
            document.removeEventListener('touchstart', unlockAudio);
            document.removeEventListener('touchend', unlockAudio);
            document.removeEventListener('click', unlockAudio);
          })
          .catch(err => {
            console.log('⚠️ Audio unlock failed (will retry):', err);
          });
      };

      // Listen for first user interaction
      document.addEventListener('touchstart', unlockAudio, { once: true });
      document.addEventListener('touchend', unlockAudio, { once: true });
      document.addEventListener('click', unlockAudio, { once: true });

      return () => {
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('touchend', unlockAudio);
        document.removeEventListener('click', unlockAudio);
      };
    }
  }, []);

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
      console.log('🔊 Playing audio from URI...', Platform.OS);
      console.log('📱 User agent:', typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A');
      console.log('🔓 Audio context unlocked:', audioContextUnlocked);
      
      // Use HTML5 Audio API for web (better PWA support)
      if (Platform.OS === 'web') {
        console.log('🌐 Using HTML5 Audio for web');
        
        // Reuse global audio element if exists and context is unlocked
        let audio: HTMLAudioElement;
        
        if (audioContextUnlocked && globalAudioElement) {
          console.log('♻️ Reusing unlocked audio element');
          audio = globalAudioElement;
          // Stop any currently playing audio
          audio.pause();
          audio.currentTime = 0;
        } else {
          console.log('🆕 Creating new audio element');
          audio = new window.Audio();
          audioRef.current = audio;
        }
        
        // Critical for mobile: set attributes before setting src
        audio.setAttribute('playsinline', 'true');
        audio.setAttribute('webkit-playsinline', 'true');
        audio.preload = 'auto';
        
        console.log('📱 Mobile-friendly attributes set');
        
        // Set up event listeners BEFORE setting src
        audio.onloadedmetadata = () => {
          console.log('✅ Audio metadata loaded, duration:', audio.duration);
          setAudioDuration(audio.duration * 1000);
        };
        
        audio.onloadeddata = () => {
          console.log('✅ Audio data loaded');
        };
        
        audio.oncanplay = () => {
          console.log('✅ Audio can play');
        };
        
        audio.oncanplaythrough = () => {
          console.log('✅ Audio can play through');
        };
        
        audio.onplay = () => {
          console.log('✅ Audio started playing');
          setIsPlaying(true);
          setIsLoading(false);
        };
        
        audio.onended = () => {
          console.log('✅ Audio finished playing');
          setIsPlaying(false);
        };
        
        audio.onerror = (e) => {
          console.error('❌ Audio error:', e);
          if (audio.error) {
            console.error('❌ Audio error code:', audio.error.code);
            console.error('❌ Audio error message:', audio.error.message);
          }
          setIsPlaying(false);
          setIsLoading(false);
        };
        
        audio.onstalled = () => {
          console.warn('⚠️ Audio stalled');
        };
        
        audio.onsuspend = () => {
          console.warn('⚠️ Audio suspended');
        };
        
        // Now set the src
        audio.src = uri;
        console.log('🔊 Audio src set, data URI length:', uri.length);
        
        // Load and play
        try {
          // load() is synchronous, doesn't return promise
          audio.load();
          console.log('🔊 Audio load() called');
          
          // Wait a bit for mobile devices
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // play() returns a promise
          console.log('🔊 Attempting to play...');
          const playPromise = audio.play();
          
          if (playPromise !== undefined) {
            await playPromise;
            console.log('✅ Audio play() promise resolved');
          } else {
            console.log('✅ Audio play() called (no promise)');
          }
        } catch (playError: any) {
          console.error('❌ Error calling play():', playError);
          console.error('❌ Error name:', playError.name);
          console.error('❌ Error message:', playError.message);
          
          // Try one more time after user interaction (for mobile)
          if (playError.name === 'NotAllowedError' || playError.name === 'NotSupportedError') {
            console.log('⚠️ Autoplay blocked, will retry...');
            // Store audio reference for manual retry if needed
            (window as any).__pendingAudio = audio;
          }
          
          setIsLoading(false);
          setIsPlaying(false);
        }
      } else {
        // Use expo-av for native
        console.log('📱 Using expo-av for native');
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
