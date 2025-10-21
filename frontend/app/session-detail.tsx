import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useStore } from '../store/useStore';
import { theme } from '../utils/theme';
import { useTranslation } from 'react-i18next';
import { sessions } from '../data/sessions';

export default function SessionDetailScreen() {
  const { t } = useTranslation();
  const { sessionId } = useLocalSearchParams();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentTheme = isDarkMode ? theme.dark : theme.light;
  const addSessionLog = useStore((state) => state.addSessionLog);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const session = sessions.find((s) => s.id === sessionId);

  if (!session) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.bg }]}>
        <Text style={[styles.errorText, { color: currentTheme.text }]}>
          {t('sessions.notFound')}
        </Text>
      </SafeAreaView>
    );
  }

  const handleNext = () => {
    if (currentStep < session.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCompleted(true);
      addSessionLog(session.id);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.bg }]} edges={['bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {!isCompleted ? (
          <>
            <View style={[styles.header, { backgroundColor: currentTheme.card }]}>
              <Text style={[styles.title, { color: currentTheme.text }]}>
                {session.title}
              </Text>
              <Text style={[styles.description, { color: currentTheme.textMuted }]}>
                {session.description}
              </Text>
            </View>

            <View style={styles.progressContainer}>
              <Text style={[styles.progressText, { color: currentTheme.textMuted }]}>
                {t('sessions.step')} {currentStep + 1} {t('sessions.of')} {session.steps.length}
              </Text>
              <View style={[styles.progressBar, { backgroundColor: currentTheme.card }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: currentTheme.accent1,
                      width: `${((currentStep + 1) / session.steps.length) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={[styles.stepCard, { backgroundColor: currentTheme.card }]}>
              <Text style={[styles.stepText, { color: currentTheme.text }]}>
                {session.steps[currentStep]}
              </Text>
            </View>
          </>
        ) : (
          <View style={[styles.completedContainer, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.completedEmoji, { color: currentTheme.text }]}>
              ✨
            </Text>
            <Text style={[styles.completedTitle, { color: currentTheme.text }]}>
              {t('sessions.completed')}
            </Text>
            <Text style={[styles.completedMessage, { color: currentTheme.textMuted }]}>
              {t('sessions.completedMessage', { duration: session.duration })}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: currentTheme.card, borderTopColor: currentTheme.border }]}>
        {!isCompleted ? (
          <View style={styles.buttonRow}>
            {currentStep > 0 && (
              <TouchableOpacity
                style={[styles.button, styles.backButton, { backgroundColor: currentTheme.bg }]}
                onPress={handleBack}
              >
                <Text style={[styles.buttonText, { color: currentTheme.text }]}>
                  {t('sessions.back')}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, styles.nextButton, { backgroundColor: currentTheme.accent1, flex: currentStep === 0 ? 1 : 0.6 }]}
              onPress={handleNext}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                {currentStep === session.steps.length - 1 ? t('sessions.complete') : t('sessions.next')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: currentTheme.accent1 }]}
            onPress={handleFinish}
          >
            <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
              {t('sessions.finish')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.md,
  },
  header: {
    padding: theme.spacing.md,
    borderRadius: theme.radius,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  progressContainer: {
    marginBottom: theme.spacing.lg,
  },
  progressText: {
    fontSize: 14,
    marginBottom: theme.spacing.sm,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  stepCard: {
    padding: theme.spacing.xl,
    borderRadius: theme.radius,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
  },
  completedContainer: {
    padding: theme.spacing.xl,
    borderRadius: theme.radius,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  completedEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  completedMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    flex: 0.4,
  },
  nextButton: {
    flex: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});
