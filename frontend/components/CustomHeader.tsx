import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { theme } from '../utils/theme';
import { HamburgerMenu } from './HamburgerMenu';

export const CustomHeader: React.FC = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentTheme = isDarkMode ? theme.dark : theme.light;
  const insets = useSafeAreaInsets();

  return (
    <>
      <View
        style={[
          styles.header,
          {
            backgroundColor: currentTheme.card,
            borderBottomColor: currentTheme.border,
            paddingTop: insets.top + 12,
          },
        ]}
      >
        {/* Spacer for alignment */}
        <View style={styles.spacer} />

        {/* Logo - Centered and Larger */}
        <View style={styles.logoContainer}>
          <Image
            source={
              isDarkMode
                ? require('../assets/images/logo-easemind-dark.png')
                : require('../assets/images/logo-easemind-light.png')
            }
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Hamburger Menu Button */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={28} color={currentTheme.text} />
        </TouchableOpacity>
      </View>

      {/* Hamburger Menu */}
      <HamburgerMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  spacer: {
    width: 44, // Same width as menu button for balance
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 48,
  },
  menuButton: {
    padding: 8,
  },
});
