import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { theme } from '../utils/theme';
import { useStore } from '../store/useStore';

export const BreathAnimation: React.FC = () => {
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentTheme = isDarkMode ? theme.dark : theme.light;
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Loop infinito de respiração
    const breatheIn = () => {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 4000,
          useNativeDriver: true,
        }),
      ]).start(() => breatheOut());
    };

    const breatheOut = () => {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.6,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 4000,
          useNativeDriver: true,
        }),
      ]).start(() => breatheIn());
    };

    breatheIn();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.circle,
          {
            backgroundColor: currentTheme.accent1,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.circleOuter,
          {
            borderColor: currentTheme.accent2,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
  },
  circle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    position: 'absolute',
  },
  circleOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    position: 'absolute',
  },
});
