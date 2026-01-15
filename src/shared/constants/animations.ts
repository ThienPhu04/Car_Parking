export const ANIMATIONS = {
  DURATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    LINEAR: 'linear' as const,
    EASE_IN: 'ease-in' as const,
    EASE_OUT: 'ease-out' as const,
    EASE_IN_OUT: 'ease-in-out' as const,
  },
} as const;