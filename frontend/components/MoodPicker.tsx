import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useStore } from '../store/useStore';
import { theme } from '../utils/theme';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';

interface MoodPickerProps {
  onMoodSelect?: (mood: number) => void;
}

export const MoodPicker: React.FC<MoodPickerProps> = ({ onMoodSelect }) => {
  const { t } = useTranslation();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentTheme = isDarkMode ? theme.dark : theme.light;
  const currentMood = useStore((state) => state.currentMood);
  const setCurrentMood = useStore((state) => state.setCurrentMood);
  const addMoodEntry = useStore((state) => state.addMoodEntry);
  const getUserId = useStore((state) => state.getUserId);

  const backendUrl =
    Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL ||
    process.env.EXPO_PUBLIC_BACKEND_URL;

  const moods = [
    { value: 1, emoji: '😢', label: t('mood.1') },
    { value: 2, emoji: '😕', label: t('mood.2') },
    { value: 3, emoji: '😐', label: t('mood.3') },
    { value: 4, emoji: '🙂', label: t('mood.4') },
    { value: 5, emoji: '😊', label: t('mood.5') },
  ];

  // Staggered fade-in animation for emojis
  const animatedValues = useRef(
    moods.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Stagger animation with 100ms delay between each emoji
    const animations = animatedValues.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      })
    );
    Animated.parallel(animations).start();
  }, []);

  const handleMoodPress = async (mood: number) => {
    setCurrentMood(mood);
    addMoodEntry(mood);
    onMoodSelect?.(mood);

    // Send to backend
    try {
      const userId = await getUserId();
      const response = await fetch(`${backendUrl}/api/mood`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          mood_value: mood,
          note: '',
        }),
      });
      
      if (response.ok) {
        console.log('📊 Mood saved to backend:', mood);
      }
    } catch (error) {
      console.error('Failed to save mood:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: currentTheme.text }]}>
        {t('home.howAreYou')}
      </Text>
      <View style={styles.moodRow}>
        {moods.map((mood, index) => (
          <Animated.View
            key={mood.value}
            style={{
              opacity: animatedValues[index],
              transform: [
                {
                  translateY: animatedValues[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            <TouchableOpacity
              style={[
                styles.moodButton,
                {
                  backgroundColor: currentTheme.card,
                  shadowColor: currentTheme.emojiShadow,
                },
                currentMood === mood.value && {
                  backgroundColor: currentTheme.accent1,
                  transform: [{ scale: 1.1 }],
                },
              ]}
              onPress={() => handleMoodPress(mood.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{mood.emoji}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  moodButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  emoji: {
    fontSize: 38,
  },
});
