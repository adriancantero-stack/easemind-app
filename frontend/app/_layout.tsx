import { Stack } from 'expo-router';
import { useStore } from '../store/useStore';
import { theme } from '../utils/theme';
import { AuthProvider } from '../contexts/AuthContext';

function RootLayoutNav() {
  const isDarkMode = useStore((state) => state.isDarkMode);
  const currentTheme = isDarkMode ? theme.dark : theme.light;

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: currentTheme.card,
        },
        headerTintColor: currentTheme.text,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: currentTheme.bg,
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="session-detail" 
        options={{ 
          title: 'Session',
          presentation: 'card',
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
