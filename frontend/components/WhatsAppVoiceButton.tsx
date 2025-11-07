import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Platform,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { theme } from '../utils/theme';

interface WhatsAppVoiceButtonProps {
  onSendVoice: (audioUri: string, duration: number) => void;
  onStartRecording: () => Promise<boolean>;
  onStopRecording: () => Promise<{ uri: string; duration: number } | null>;
  disabled?: boolean;
}

export const WhatsAppVoiceButton: React.FC<WhatsAppVoiceButtonProps> = ({
  onSendVoice,
  onStartRecording,
  onStopRecording,
  disabled = false,
}) => {
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentTheme = isDarkMode ? theme.dark : theme.light;

  const [isRecording, setIsRecording] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isCancelled, setIsCancelled] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const lockAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startYRef = useRef(0);

  useEffect(() => {
    if (isRecording && !isLocked) {
      // Start waveform animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim1, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim1, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(150),
          Animated.timing(waveAnim2, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim2, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(waveAnim3, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim3, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    return () => {
      waveAnim1.stopAnimation();
      waveAnim2.stopAnimation();
      waveAnim3.stopAnimation();
    };
  }, [isRecording, isLocked]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordingTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    if (disabled) return;

    const success = await onStartRecording();
    if (success) {
      setIsRecording(true);
      setIsCancelled(false);
      Vibration.vibrate(50);

      Animated.spring(scaleAnim, {
        toValue: 1.2,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleStopRecording = async (sendAudio: boolean) => {
    if (!isRecording) return;

    const result = await onStopRecording();
    
    setIsRecording(false);
    setIsLocked(false);
    
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    slideAnim.setValue(0);
    lockAnim.setValue(0);

    if (result && sendAudio && !isCancelled) {
      onSendVoice(result.uri, result.duration);
    }
  };

  const handleCancelRecording = () => {
    setIsCancelled(true);
    Vibration.vibrate(100);
    handleStopRecording(false);
  };

  const handleLockRecording = () => {
    setIsLocked(true);
    Vibration.vibrate(50);
    
    Animated.spring(lockAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        startYRef.current = evt.nativeEvent.pageY;
        handleStartRecording();
      },

      onPanResponderMove: (evt, gestureState) => {
        if (!isRecording || isLocked) return;

        const { dx, dy } = gestureState;

        // Slide left to cancel (threshold: -120px)
        if (dx < -120) {
          handleCancelRecording();
          return;
        }

        // Slide up to lock (threshold: -100px)
        if (dy < -100) {
          handleLockRecording();
          return;
        }

        // Animate slide indicators
        slideAnim.setValue(Math.max(-120, dx));
        lockAnim.setValue(Math.min(0, dy / 100));
      },

      onPanResponderRelease: () => {
        if (!isLocked && !isCancelled) {
          handleStopRecording(true);
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      {/* Recording UI Overlay */}
      {isRecording && (
        <Animated.View
          style={[
            styles.recordingOverlay,
            {
              backgroundColor: currentTheme.card,
              opacity: slideAnim.interpolate({
                inputRange: [-120, 0],
                outputRange: [0, 1],
              }),
            },
          ]}
        >
          {/* Cancel indicator (left) */}
          {!isLocked && (
            <Animated.View
              style={[
                styles.cancelIndicator,
                {
                  opacity: slideAnim.interpolate({
                    inputRange: [-120, -60, 0],
                    outputRange: [1, 0.5, 0],
                  }),
                },
              ]}
            >
              <Ionicons name="close-circle" size={24} color="#FF6B6B" />
              <Text style={[styles.cancelText, { color: '#FF6B6B' }]}>
                Cancel
              </Text>
            </Animated.View>
          )}

          {/* Lock indicator (top) */}
          {!isLocked && (
            <Animated.View
              style={[
                styles.lockIndicator,
                {
                  opacity: lockAnim.interpolate({
                    inputRange: [-1, 0],
                    outputRange: [1, 0],
                  }),
                  transform: [
                    {
                      translateY: lockAnim.interpolate({
                        inputRange: [-1, 0],
                        outputRange: [-50, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Ionicons name="lock-closed" size={24} color={currentTheme.accent1} />
            </Animated.View>
          )}

          {/* Waveform and Timer */}
          <View style={styles.recordingInfo}>
            {/* Waveform */}
            <View style={styles.waveform}>
              <Animated.View
                style={[
                  styles.wave,
                  {
                    backgroundColor: currentTheme.accent1,
                    transform: [
                      {
                        scaleY: waveAnim1.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.3, 1],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.wave,
                  {
                    backgroundColor: currentTheme.accent1,
                    transform: [
                      {
                        scaleY: waveAnim2.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.wave,
                  {
                    backgroundColor: currentTheme.accent1,
                    transform: [
                      {
                        scaleY: waveAnim3.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.4, 1],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.wave,
                  {
                    backgroundColor: currentTheme.accent1,
                    transform: [
                      {
                        scaleY: waveAnim1.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.6, 1],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>

            {/* Timer */}
            <Text style={[styles.timer, { color: currentTheme.text }]}>
              {formatTime(recordingTime)}
            </Text>
          </View>

          {/* Locked state: Show stop button */}
          {isLocked && (
            <TouchableOpacity
              style={[styles.stopButton, { backgroundColor: '#FF6B6B' }]}
              onPress={() => handleStopRecording(true)}
            >
              <Ionicons name="stop" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* Microphone Button */}
      <Animated.View
        style={[
          styles.micButtonContainer,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
        {...(!isLocked ? panResponder.panHandlers : {})}
      >
        <TouchableOpacity
          style={[
            styles.micButton,
            {
              backgroundColor: isRecording
                ? currentTheme.accent1
                : currentTheme.card,
            },
          ]}
          disabled={disabled || isLocked}
        >
          <Ionicons
            name={isRecording ? 'mic' : 'mic-outline'}
            size={24}
            color={isRecording ? '#fff' : currentTheme.accent1}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 48,
    justifyContent: 'center',
  },
  recordingOverlay: {
    position: 'absolute',
    left: 0,
    right: 60,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelIndicator: {
    position: 'absolute',
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  lockIndicator: {
    position: 'absolute',
    top: -60,
    right: 20,
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(200, 182, 255, 0.2)',
  },
  recordingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 24,
  },
  wave: {
    width: 3,
    height: 20,
    borderRadius: 1.5,
  },
  timer: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  stopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonContainer: {
    position: 'absolute',
    right: 0,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default WhatsAppVoiceButton;
