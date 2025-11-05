import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { theme } from '../utils/theme';
import { useStore } from '../store/useStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HamburgerMenuProps {
  visible: boolean;
  onClose: () => void;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentTheme = isDarkMode ? theme.dark : theme.light;
  const insets = useSafeAreaInsets();
  const slideAnim = React.useRef(new Animated.Value(300)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const menuItems = [
    { id: 'chat', label: t('tabs.chat'), icon: 'chatbubbles', route: '/(tabs)/' },
    { id: 'sessions', label: t('tabs.sessions'), icon: 'leaf', route: '/(tabs)/sessions' },
    { id: 'journal', label: t('tabs.journal'), icon: 'book', route: '/(tabs)/journal' },
    { id: 'profile', label: t('tabs.profile'), icon: 'person', route: '/(tabs)/profile' },
    { id: 'about', label: t('tabs.about'), icon: 'information-circle', route: '/(tabs)/about' },
  ];

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.menuContainer,
            {
              backgroundColor: currentTheme.card,
              transform: [{ translateX: slideAnim }],
              paddingTop: insets.top + 16,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <TouchableOpacity activeOpacity={1}>
            {/* Header */}
            <View style={styles.menuHeader}>
              <Text style={[styles.menuTitle, { color: currentTheme.text }]}>
                Menu
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color={currentTheme.text} />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <View style={styles.menuItems}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, { borderBottomColor: currentTheme.border }]}
                  onPress={() => handleNavigate(item.route)}
                >
                  <Ionicons name={item.icon as any} size={24} color={currentTheme.accent1} />
                  <Text style={[styles.menuItemText, { color: currentTheme.text }]}>
                    {item.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={currentTheme.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  menuContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(200, 182, 255, 0.2)',
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  menuItems: {
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
    flex: 1,
  },
});
