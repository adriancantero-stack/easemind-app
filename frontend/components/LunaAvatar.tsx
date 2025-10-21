import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';

interface LunaAvatarProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';
  size?: number;
}

export const LunaAvatar: React.FC<LunaAvatarProps> = ({ state, size = 120 }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Reset animations
    scaleAnim.setValue(1);
    rotateAnim.setValue(0);
    opacityAnim.setValue(1);

    switch (state) {
      case 'idle':
        // Breathing effect - slow expansion and contraction
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.08,
              duration: 3000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 3000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
        break;

      case 'listening':
        // Pulsing effect - faster and more pronounced
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.15,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
        break;

      case 'thinking':
        // Rotating particles effect
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 4000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ).start();
        break;

      case 'speaking':
        // Quick pulse synchronized with speech
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.12,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ).start();
        break;

      case 'error':
        // Flash effect
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
        break;
    }
  }, [state]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getGradientColors = () => {
    switch (state) {
      case 'error':
        return ['#FF6B9D', '#C44569'];
      case 'thinking':
        return ['#A3CFFF', '#BDAAFF'];
      case 'speaking':
        return ['#BDAAFF', '#D4C4FF'];
      case 'listening':
        return ['#9B89FF', '#BDAAFF'];
      default: // idle
        return ['#BDAAFF', '#C8D5FF'];
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Outer glow */}
      <Animated.View
        style={[
          styles.outerGlow,
          {
            width: size * 1.4,
            height: size * 1.4,
            opacity: opacityAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.3],
            }),
            transform: [{ scale: state === 'listening' ? pulseAnim : scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[...getGradientColors(), 'transparent']}
          style={styles.gradient}
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
            opacity: opacityAnim,
            transform: [
              { scale: state === 'listening' ? pulseAnim : scaleAnim },
              { rotate: state === 'thinking' ? spin : '0deg' },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={getGradientColors()}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Inner glow */}
      <Animated.View
        style={[
          styles.innerGlow,
          {
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: (size * 0.6) / 2,
            opacity: 0.6,
            transform: [{ scale: state === 'listening' ? pulseAnim : scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0)']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Thinking particles (only visible when thinking) */}
      {state === 'thinking' && (
        <>
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.particle,
                {
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  transform: [
                    { rotate: spin },
                    {
                      translateX: Math.cos((index * 2 * Math.PI) / 3) * (size * 0.5),
                    },
                    {
                      translateY: Math.sin((index * 2 * Math.PI) / 3) * (size * 0.5),
                    },
                  ],
                },
              ]}
            />
          ))}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  outerGlow: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orb: {
    position: 'absolute',
    shadowColor: '#BDAAFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  innerGlow: {
    position: 'absolute',
  },
  gradient: {
    flex: 1,
    borderRadius: 9999,
  },
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#BDAAFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
});
