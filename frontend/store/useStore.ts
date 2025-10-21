import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import * as Localization from 'expo-localization';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
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
  addMoodEntry: (mood: number, note?: string) => void;
  addSessionLog: (sessionId: string, notes?: string) => void;
  loadFromStorage: () => Promise<void>;
  detectSystemSettings: () => void;
  getUserId: () => Promise<string>;
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
    
    // Generate new UUID
    const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    set({ userId: newUserId });
    
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, newUserId);
    } catch {}
    
    return newUserId;
  },

  setThemeMode: async (mode: ThemeMode) => {
    const isDark = getIsDarkMode(mode);
    set({ themeMode: mode, isDarkMode: isDark });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
    } catch {}
  },

  setLanguage: async (value: string) => {
    set({ language: value });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, value);
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

  addMessage: async (role: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      role,
      content,
      timestamp: Date.now(),
    };
    const messages = [...get().messages, newMessage];
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
    } catch {}
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
