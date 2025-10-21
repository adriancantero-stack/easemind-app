import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { useStore } from '../store/useStore';
import { theme } from '../utils/theme';
import { useTranslation } from 'react-i18next';
import { BreathAnimation } from './BreathAnimation';
import * as Haptics from 'expo-haptics';

interface PanicModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PanicModal: React.FC<PanicModalProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentTheme = isDarkMode ? theme.dark : theme.light;
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [isInhaling, setIsInhaling] = useState(true);
  const [cyclesComplete, setCyclesComplete] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset state
      setCyclesComplete(0);
      setIsComplete(false);
      setPhase('inhale');
      setIsInhaling(true);
      
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Light haptic on open
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || isComplete) return;

    const timer = setTimeout(() => {
      if (phase === 'inhale') {
        setPhase('hold');
        setIsInhaling(true);
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
      } else if (phase === 'hold') {
        setPhase('exhale');
        setIsInhaling(false);
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
      } else {
        // Complete cycle
        const newCount = cyclesComplete + 1;
        setCyclesComplete(newCount);
        
        if (newCount >= 6) {
          setIsComplete(true);
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {}
        } else {
          setPhase('inhale');
          setIsInhaling(true);
        }
      }
    }, 4000); // 4 seconds per phase

    return () => clearTimeout(timer);
  }, [phase, visible, isComplete, cyclesComplete]);

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale':
        return t('panic.inhale');
      case 'hold':
        return t('panic.hold');
      case 'exhale':
        return t('panic.exhale');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <BlurView intensity={80} style={styles.blurContainer}>
          <View style={[styles.content, { backgroundColor: currentTheme.bg + 'E6' }]}>
            {!isComplete ? (
              <>
                <Text style={[styles.title, { color: currentTheme.text }]}>
                  {t('panic.title')}
                </Text>
                
                <BreathAnimation isInhaling={isInhaling} />
                
                <Text style={[styles.phaseText, { color: currentTheme.accent1 }]}>
                  {getPhaseText()}
                </Text>
                
                <Text style={[styles.cycleText, { color: currentTheme.textMuted }]}>
                  {t('panic.cycle')} {cyclesComplete + 1} {t('panic.of')} 6
                </Text>
                
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: currentTheme.card }]}
                  onPress={handleClose}
                >
                  <Text style={[styles.closeButtonText, { color: currentTheme.text }]}>
                    {t('panic.close')}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.completeTitle, { color: currentTheme.text }]}>
                  {t('panic.complete')}
                </Text>
                
                <Text style={[styles.afterPanicText, { color: currentTheme.text }]}>
                  {t('panic.afterPanic')}
                </Text>
                
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: currentTheme.accent1 }]}
                  onPress={handleClose}
                >
                  <Text style={styles.actionButtonText}>
                    {t('panic.talkToAI')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: currentTheme.card }]}
                  onPress={handleClose}
                >
                  <Text style={[styles.secondaryButtonText, { color: currentTheme.text }]}>
                    {t('panic.close')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </BlurView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    maxWidth: 400,
    borderRadius: theme.radius * 1.5,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: theme.spacing.lg,
  },
  phaseText: {
    fontSize: 32,
    fontWeight: '600',
    marginTop: theme.spacing.lg,
  },
  cycleText: {
    fontSize: 14,
    marginTop: theme.spacing.sm,
  },
  closeButton: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  afterPanicText: {
    fontSize: 16,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  actionButton: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
