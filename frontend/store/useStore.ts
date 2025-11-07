import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import * as Localization from 'expo-localization';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isTyping?: boolean; // Para efeito de digitação
  fullContent?: string; // Conteúdo completo quando está em modo typing
}

interface MoodEntry {
  id: string;
  date: string;
  mood: number;
  note?: string;
}

interface SessionLog {
  id: string;
  sessionId: string;
  date: string;
  completed: boolean;
  notes?: string;
}

type ThemeMode = 'light' | 'dark' | 'auto';

interface AppState {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  language: string;
  hasCompletedOnboarding: boolean;
  currentMood: number | null;
  messages: Message[];
  moodEntries: MoodEntry[];
  sessionLogs: SessionLog[];
  voiceEnabled: boolean;
  userId: string; // User ID for memory/context
  
  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (value: string) => void;
  setVoiceEnabled: (enabled: boolean) => void;
  completeOnboarding: () => void;
  setCurrentMood: (mood: number) => void;
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  addTypingMessage: (role: 'user' | 'assistant', fullContent: string) => void;
  updateTypingMessage: (timestamp: number, content: string) => void;
  completeTypingMessage: (timestamp: number) => void;
  addMoodEntry: (mood: number, note?: string) => void;
  addSessionLog: (sessionId: string, notes?: string) => void;
  loadFromStorage: () => Promise<void>;
  detectSystemSettings: () => void;
  getUserId: () => Promise<string>;
  syncPreferencesWithBackend: () => Promise<void>;
  loadPreferencesFromBackend: () => Promise<void>;
}

const STORAGE_KEYS = {
  THEME_MODE: '@easemind_theme_mode',
  LANGUAGE: '@easemind_lang',
  ONBOARDING: '@easemind_onboarding',
  MOOD: '@easemind_current_mood',
  MESSAGES: '@easemind_messages',
  MOOD_ENTRIES: '@easemind_mood_entries',
  SESSION_LOGS: '@easemind_session_logs',
  VOICE_ENABLED: '@easemind_voice_enabled',
  USER_ID: '@easemind_user_id',
};

// Helper to detect if dark mode based on theme mode
const getIsDarkMode = (mode: ThemeMode): boolean => {
  if (mode === 'auto') {
    return Appearance.getColorScheme() === 'dark';
  }
  return mode === 'dark';
};

// Helper to detect system language
const getSystemLanguage = (): string => {
  const locale = Localization.locale || 'en-US';
  if (locale.startsWith('pt')) return 'pt-BR';
  if (locale.startsWith('es')) return 'es';
  return 'en';
};

export const useStore = create<AppState>((set, get) => ({
  themeMode: 'light', // Default to light mode
  isDarkMode: false,
  language: 'en',
  hasCompletedOnboarding: false,
  currentMood: null,
  messages: [],
  moodEntries: [],
  sessionLogs: [],
  voiceEnabled: true, // Default: voice ON
  userId: '', // Will be generated on first use

  getUserId: async () => {
    // Primeiro, verificar se há um Firebase user autenticado
    try {
      const { auth } = require('../config/firebase');
      const currentFirebaseUser = auth.currentUser;
      
      if (currentFirebaseUser?.uid) {
        // Usuário autenticado - retornar Firebase UID
        const firebaseUid = currentFirebaseUser.uid;
        
        // Atualizar store se necessário
        const currentUserId = get().userId;
        if (currentUserId !== firebaseUid) {
          set({ userId: firebaseUid });
          try {
            await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, firebaseUid);
          } catch {}
        }
        
        console.log('👤 Using Firebase UID:', firebaseUid);
        return firebaseUid;
      }
    } catch (error) {
      // Firebase não disponível ou erro - continuar com fallback
      console.log('⚠️ Firebase not available, using local user ID');
    }
    
    // Fallback: usar ID local
    const currentUserId = get().userId;
    if (currentUserId) {
      return currentUserId;
    }
    
    // Try to load from storage
    try {
      const storedUserId = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
      if (storedUserId) {
        set({ userId: storedUserId });
        return storedUserId;
      }
    } catch {}
    
    // Generate new UUID (modo visitante)
    const newUserId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    set({ userId: newUserId });
    
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, newUserId);
    } catch {}
    
    console.log('👤 Generated guest ID:', newUserId);
    return newUserId;
  },

  setThemeMode: async (mode: ThemeMode) => {
    const isDark = getIsDarkMode(mode);
    set({ themeMode: mode, isDarkMode: isDark });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
      // Sync with backend
      get().syncPreferencesWithBackend();
    } catch {}
  },

  setLanguage: async (value: string) => {
    set({ language: value });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, value);
      // Sync with backend
      get().syncPreferencesWithBackend();
    } catch {}
  },

  setVoiceEnabled: async (enabled: boolean) => {
    set({ voiceEnabled: enabled });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.VOICE_ENABLED, JSON.stringify(enabled));
    } catch {}
  },

  completeOnboarding: async () => {
    set({ hasCompletedOnboarding: true });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING, 'true');
    } catch {}
  },

  setCurrentMood: async (mood: number) => {
    set({ currentMood: mood });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MOOD, JSON.stringify(mood));
    } catch {}
  },

  addMessage: async (role: 'user' | 'assistant', content: string, timestamp?: string, isVoice?: boolean, audioUri?: string, audioDuration?: number) => {
    const newMessage: Message = {
      role,
      content,
      timestamp: timestamp ? new Date(timestamp).getTime() : Date.now(),
      isVoice: isVoice || false,
      audioUri: audioUri,
      audioDuration: audioDuration,
    };
    const messages = [...get().messages, newMessage];
    set({ messages });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    } catch {}
  },

  addTypingMessage: async (role: 'user' | 'assistant', fullContent: string) => {
    const newMessage: Message = {
      role,
      content: '', // Start empty
      timestamp: Date.now(),
      isTyping: true,
      fullContent,
    };
    const messages = [...get().messages, newMessage];
    set({ messages });
  },

  updateTypingMessage: (timestamp: number, content: string) => {
    const messages = get().messages.map(msg =>
      msg.timestamp === timestamp ? { ...msg, content } : msg
    );
    set({ messages });
  },

  completeTypingMessage: async (timestamp: number) => {
    const messages = get().messages.map(msg =>
      msg.timestamp === timestamp 
        ? { ...msg, content: msg.fullContent || msg.content, isTyping: false, fullContent: undefined }
        : msg
    );
    set({ messages });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    } catch {}
  },

  addMoodEntry: async (mood: number, note?: string) => {
    const entry: MoodEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      mood,
      note,
    };
    const moodEntries = [...get().moodEntries, entry];
    set({ moodEntries });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MOOD_ENTRIES, JSON.stringify(moodEntries));
    } catch {}
  },

  addSessionLog: async (sessionId: string, notes?: string) => {
    const log: SessionLog = {
      id: Date.now().toString(),
      sessionId,
      date: new Date().toISOString(),
      completed: true,
      notes,
    };
    const sessionLogs = [...get().sessionLogs, log];
    set({ sessionLogs });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION_LOGS, JSON.stringify(sessionLogs));
    } catch {}
  },

  detectSystemSettings: () => {
    const systemLang = getSystemLanguage();
    set({ language: systemLang });
  },

  loadFromStorage: async () => {
    try {
      const [themeMode, language, onboarding, mood, messages, moodEntries, sessionLogs, voiceEnabled, userId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE),
        AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE),
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING),
        AsyncStorage.getItem(STORAGE_KEYS.MOOD),
        AsyncStorage.getItem(STORAGE_KEYS.MESSAGES),
        AsyncStorage.getItem(STORAGE_KEYS.MOOD_ENTRIES),
        AsyncStorage.getItem(STORAGE_KEYS.SESSION_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.VOICE_ENABLED),
        AsyncStorage.getItem(STORAGE_KEYS.USER_ID),
      ]);

      const mode = (themeMode as ThemeMode) || 'light';
      const lang = language || getSystemLanguage();

      set({
        themeMode: mode,
        isDarkMode: getIsDarkMode(mode),
        language: lang,
        hasCompletedOnboarding: onboarding === 'true',
        currentMood: mood ? JSON.parse(mood) : null,
        messages: messages ? JSON.parse(messages) : [],
        moodEntries: moodEntries ? JSON.parse(moodEntries) : [],
        sessionLogs: sessionLogs ? JSON.parse(sessionLogs) : [],
        voiceEnabled: voiceEnabled !== null ? JSON.parse(voiceEnabled) : true, // Default true
        userId: userId || '', // Load userId from storage or default to empty string
      });
      
      // Load preferences from backend after loading from local storage
      await get().loadPreferencesFromBackend();
    } catch {}
  },

  syncPreferencesWithBackend: async () => {
    try {
      const { auth } = require('../config/firebase');
      const currentFirebaseUser = auth.currentUser;
      
      if (!currentFirebaseUser?.uid) {
        console.log('⚠️ Not syncing preferences: User not logged in');
        return;
      }

      const { themeMode, language } = get();
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      
      console.log('🔄 Syncing preferences with backend...', { themeMode, language });
      
      const response = await fetch(`${backendUrl}/api/user/profile/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebase_uid: currentFirebaseUser.uid,
          theme: themeMode,
          language: language,
        }),
      });

      if (response.ok) {
        console.log('✅ Preferences synced with backend');
      } else {
        console.error('❌ Failed to sync preferences with backend');
      }
    } catch (error) {
      console.error('❌ Error syncing preferences:', error);
    }
  },

  loadPreferencesFromBackend: async () => {
    try {
      const { auth } = require('../config/firebase');
      const currentFirebaseUser = auth.currentUser;
      
      if (!currentFirebaseUser?.uid) {
        console.log('⚠️ Not loading preferences: User not logged in');
        return;
      }

      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      
      console.log('📥 Loading preferences from backend...');
      
      const response = await fetch(`${backendUrl}/api/user/profile?firebase_uid=${currentFirebaseUser.uid}`);

      if (response.ok) {
        const data = await response.json();
        const user = data.user;
        
        if (user.theme) {
          const mode = user.theme as ThemeMode;
          const isDark = getIsDarkMode(mode);
          set({ themeMode: mode, isDarkMode: isDark });
          await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
          console.log('✅ Theme loaded from backend:', mode);
        }
        
        if (user.language) {
          set({ language: user.language });
          await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, user.language);
          console.log('✅ Language loaded from backend:', user.language);
        }
      } else {
        console.log('⚠️ Could not load preferences from backend');
      }
    } catch (error) {
      console.error('❌ Error loading preferences from backend:', error);
    }
  },
}));

// Listen to system appearance changes
Appearance.addChangeListener(() => {
  const store = useStore.getState();
  if (store.themeMode === 'auto') {
    const isDark = Appearance.getColorScheme() === 'dark';
    useStore.setState({ isDarkMode: isDark });
  }
});
