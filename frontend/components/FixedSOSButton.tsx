import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FixedSOSButtonProps {
  onPress: () => void;
}

export const FixedSOSButton: React.FC<FixedSOSButtonProps> = ({ onPress }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  // Breathing animation
  useEffect(() => {
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 4500,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 4500,
          useNativeDriver: true,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        }),
      ])
    );
    breathe.start();
    return () => breathe.stop();
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Animated.View
          style={[
            styles.button,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Image
            source={require('../assets/images/panic-button.png')}
            style={styles.buttonImage}
          />
          <Text style={styles.buttonText}>SOS</Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonImage: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  buttonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BDAAFF',
    marginTop: -4,
    letterSpacing: 1.5,
  },
});
