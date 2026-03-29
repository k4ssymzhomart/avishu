import { StyleSheet } from 'react-native';

export const borders = {
  radius: {
    none: 0,
    sm: 4,
    md: 8,
  },
  width: {
    hairline: StyleSheet.hairlineWidth,
    thin: 1,
  },
} as const;
