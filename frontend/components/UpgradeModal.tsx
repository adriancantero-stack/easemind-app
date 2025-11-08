import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { theme } from '../utils/theme';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  limitType: 'message' | 'session' | 'journal';
  remaining: number;
  limit: number;
}

export function UpgradeModal({ visible, onClose, limitType, remaining, limit }: UpgradeModalProps) {
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentTheme = isDarkMode ? theme.dark : theme.light;
  const language = useStore((state) => state.language);

  const translations = {
    'pt-BR': {
      title: 'Limite Atingido',
      message: {
        message: `Você usou suas ${limit} mensagens de hoje`,
        session: `Você usou sua ${limit} sessão de hoje`,
        journal: `Você usou suas ${limit} entradas do diário de hoje`,
      },
      subtitle: 'Faça upgrade para Premium e tenha acesso ilimitado!',
      benefits: [
        'Chat ilimitado com Luna',
        'Sessões guiadas ilimitadas',
        'Diário sem limites',
        'Suporte prioritário',
      ],
      upgradeButton: 'Fazer Upgrade',
      cancelButton: 'Fechar',
      resetInfo: 'Seus limites resetam amanhã',
    },
    en: {
      title: 'Limit Reached',
      message: {
        message: `You've used your ${limit} messages for today`,
        session: `You've used your ${limit} session for today`,
        journal: `You've used your ${limit} journal entries for today`,
      },
      subtitle: 'Upgrade to Premium for unlimited access!',
      benefits: [
        'Unlimited chat with Luna',
        'Unlimited guided sessions',
        'Unlimited journal',
        'Priority support',
      ],
      upgradeButton: 'Upgrade Now',
      cancelButton: 'Close',
      resetInfo: 'Your limits reset tomorrow',
    },
    es: {
      title: 'Límite Alcanzado',
      message: {
        message: `Has usado tus ${limit} mensajes de hoy`,
        session: `Has usado tu ${limit} sesión de hoy`,
        journal: `Has usado tus ${limit} entradas del diario de hoy`,
      },
      subtitle: '¡Actualiza a Premium para acceso ilimitado!',
      benefits: [
        'Chat ilimitado con Luna',
        'Sesiones guiadas ilimitadas',
        'Diario sin límites',
        'Soporte prioritario',
      ],
      upgradeButton: 'Actualizar Ahora',
      cancelButton: 'Cerrar',
      resetInfo: 'Tus límites se resetean mañana',
    },
  };

  const t = translations[language as keyof typeof translations] || translations['pt-BR'];

  const handleUpgrade = () => {
    // Abrir página de planos
    const plansUrl = `https://easemind.io/plans?lang=${language}`;
    Linking.openURL(plansUrl);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: currentTheme.card }]}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: currentTheme.accent1 + '20' }]}>
            <Ionicons name="lock-closed" size={40} color={currentTheme.accent1} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: currentTheme.text }]}>
            {t.title}
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: currentTheme.text }]}>
            {t.message[limitType]}
          </Text>

          <Text style={[styles.subtitle, { color: currentTheme.textSecondary }]}>
            {t.subtitle}
          </Text>

          {/* Benefits */}
          <View style={styles.benefits}>
            {t.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={currentTheme.accent1} />
                <Text style={[styles.benefitText, { color: currentTheme.text }]}>
                  {benefit}
                </Text>
              </View>
            ))}
          </View>

          {/* Reset info */}
          <Text style={[styles.resetInfo, { color: currentTheme.textSecondary }]}>
            ⏰ {t.resetInfo}
          </Text>

          {/* Buttons */}
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: currentTheme.accent1 }]}
            onPress={handleUpgrade}
          >
            <Ionicons name="rocket" size={20} color="#FFFFFF" />
            <Text style={styles.upgradeButtonText}>{t.upgradeButton}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={[styles.cancelButtonText, { color: currentTheme.textSecondary }]}>
              {t.cancelButton}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  benefits: {
    width: '100%',
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    marginLeft: 12,
  },
  resetInfo: {
    fontSize: 12,
    marginBottom: 24,
    textAlign: 'center',
  },
  upgradeButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
