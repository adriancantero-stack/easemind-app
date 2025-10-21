export const theme = {
  light: {
    // Luna Apple-like serenity theme
    bg: '#F6F7FB', // Gradient start (will be applied with LinearGradient)
    bgGradient: ['#F6F7FB', '#F4F6FD'], // Gradient colors
    card: '#FFFFFF',
    cardOpacity: 'rgba(255, 255, 255, 0.8)',
    text: '#2A2A2E',
    textMuted: '#A1A1B2',
    accent1: '#BDAAFF', // Lilac Serenity
    accent1Hover: '#A88FFF',
    accent1Glow: 'rgba(189, 170, 255, 0.4)',
    accent2: '#A3CFFF', // Calm Blue
    border: '#E8E9F0',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    chatBubbleAI: 'rgba(255, 255, 255, 0.8)',
    chatTextAI: '#2A2A2E',
    shadow: 'rgba(0, 0, 0, 0.05)',
    emojiShadow: 'rgba(0, 0, 0, 0.08)',
  },
  dark: {
    bg: '#0E1A2B',
    bgGradient: ['#0E1A2B', '#162436'],
    card: '#1A2738',
    cardOpacity: 'rgba(26, 39, 56, 0.8)',
    text: '#E6E6EB',
    textMuted: '#9CA3AF',
    accent1: '#C8B6FF',
    accent1Hover: '#B09EFF',
    accent1Glow: 'rgba(200, 182, 255, 0.3)',
    accent2: '#A3CFFF',
    border: '#2A3648',
    success: '#6FCF97',
    warning: '#F2C94C',
    error: '#EB5757',
    chatBubbleAI: 'rgba(26, 39, 56, 0.8)',
    chatTextAI: '#E6E6EB',
    shadow: 'rgba(0, 0, 0, 0.2)',
    emojiShadow: 'rgba(0, 0, 0, 0.15)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: 20, // Apple-like rounded corners
  radiusLg: 24,
  fonts: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 16,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
      elevation: 8,
    },
  },
};

export type Theme = typeof theme.light;
