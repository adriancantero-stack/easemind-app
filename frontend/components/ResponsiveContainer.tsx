import React from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';

interface ResponsiveContainerProps {
  children: React.ReactNode;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({ children }) => {
  const { width } = Dimensions.get('window');
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width > 768;

  if (isDesktop) {
    return (
      <View style={styles.webWrapper}>
        <View style={styles.webContainer}>
          {children}
        </View>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  webWrapper: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webContainer: {
    width: '100%',
    maxWidth: 480,
    height: '100%',
    maxHeight: 900,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
