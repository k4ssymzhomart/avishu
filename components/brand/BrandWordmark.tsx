import { Image, StyleSheet, View } from 'react-native';

const logo = require('../../assets/brand/avishu-wordmark.png');

type BrandWordmarkProps = {
  size?: 'sm' | 'md' | 'lg';
};

export function BrandWordmark({ size = 'md' }: BrandWordmarkProps) {
  return (
    <View style={[styles.base, size === 'sm' ? styles.sm : null, size === 'lg' ? styles.lg : null]}>
      <Image resizeMode="contain" source={logo} style={styles.logo} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 28,
    justifyContent: 'center',
    width: 126,
  },
  lg: {
    height: 42,
    width: 182,
  },
  logo: {
    height: '100%',
    width: '100%',
  },
  sm: {
    height: 22,
    width: 96,
  },
});
