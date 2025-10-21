import { Stack } from 'expo-router';
import { useStore } from '../store/useStore';
import { theme } from '../utils/theme';

export default function RootLayout() {
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
