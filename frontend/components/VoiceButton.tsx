import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { useStore } from '../store/useStore';

interface VoiceButtonProps {
  isRecording: boolean;
  isTranscribing: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  isRecording,
  isTranscribing,
  onPressIn,
  onPressOut,
}) => {
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentTheme = isDarkMode ? theme.dark : theme.light;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    console.log('🎙️ VoiceButton: PressIn event triggered');
    onPressIn();
  };

  const handlePressOut = () => {
    console.log('🛑 VoiceButton: PressOut event triggered');
    onPressOut();
  };

  React.useEffect(() => {
    if (isRecording) {
      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  return (
    <View>
      {isRecording && (
        <View style={[styles.recordingOverlay, { backgroundColor: currentTheme.accent1 + '33' }]}>
          <Text style={[styles.recordingText, { color: currentTheme.text }]}>
            🎙️ Gravando... fale livremente
          </Text>
        </View>
      )}
      
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.button,
          {
            backgroundColor: isRecording ? currentTheme.accent1 : currentTheme.card,
          },
        ]}
        disabled={isTranscribing}
      >
        {isTranscribing ? (
          <Ionicons name="hourglass-outline" size={24} color={currentTheme.accent1} />
        ) : (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Ionicons
              name={isRecording ? 'stop-circle' : 'mic'}
              size={24}
              color={isRecording ? '#FFFFFF' : currentTheme.accent1}
            />
          </Animated.View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  recordingOverlay: {
    position: 'absolute',
    bottom: 60,
    left: -150,
    right: -10,
    padding: theme.spacing.sm,
    borderRadius: theme.radius,
    alignItems: 'center',
    zIndex: 10,
  },
  recordingText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
