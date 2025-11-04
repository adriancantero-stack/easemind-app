import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LunaOrbProps {
  isListening: boolean;
  isSpeaking: boolean;
  size?: number;
}

export const LunaOrb: React.FC<LunaOrbProps> = ({ 
  isListening, 
  isSpeaking,
  size = 200 
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSpeaking) {
      // Animação quando Luna está falando
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (isListening) {
      // Animação quando está ouvindo
      Animated.loop(
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      // Para as animações quando idle
      scaleAnim.setValue(1);
      pulseAnim.setValue(1);
    }
  }, [isSpeaking, isListening]);

  useEffect(() => {
    // Rotação suave contínua
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getGradientColors = () => {
    if (isSpeaking) {
      return ['#C8B6FF', '#8B7FFF', '#6B5FFF']; // Roxo brilhante quando fala
    } else if (isListening) {
      return ['#FFB6C8', '#FF7F8B', '#FF5F6B']; // Rosa quando ouve
    }
    return ['#B6C8FF', '#7F8BFF', '#5F6BFF']; // Azul quando idle
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size * 1.5,
            height: size * 1.5,
            opacity: isSpeaking || isListening ? 0.3 : 0.1,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={getGradientColors()}
          style={styles.glowGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Main orb */}
      <Animated.View
        style={[
          styles.orb,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [
              { scale: scaleAnim },
              { rotate: rotate }
            ],
          },
        ]}
      >
        <LinearGradient
          colors={getGradientColors()}
          style={[styles.orbGradient, { borderRadius: size / 2 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Inner shine */}
      <View style={[styles.shine, { width: size * 0.3, height: size * 0.3, top: size * 0.2, left: size * 0.3 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    borderRadius: 1000,
    overflow: 'hidden',
  },
  glowGradient: {
    flex: 1,
  },
  orb: {
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#C8B6FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  orbGradient: {
    flex: 1,
  },
  shine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1000,
  },
});
