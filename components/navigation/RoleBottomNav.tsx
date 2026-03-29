import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { NavIcon } from '@/components/navigation/NavIcon';
import type { BottomNavItem } from '@/lib/constants/navigation';
import { theme } from '@/lib/theme/tokens';

type RoleBottomNavProps = {
  activeKey: string;
  items: BottomNavItem[];
  variant?: 'default' | 'floating';
};

export function RoleBottomNav({ activeKey, items, variant = 'default' }: RoleBottomNavProps) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isFloating = variant === 'floating';
  const isCompact = width < 420;
  const isWide = width >= 960;

  return (
    <View style={[styles.container, isFloating ? styles.containerFloating : null]}>
      {items.map((item) => {
        const isActive = item.key === activeKey;

        return (
          <Pressable
            key={item.key}
            onPress={() => router.replace(item.href as never)}
            style={({ pressed }) => [
              styles.item,
              isFloating ? styles.itemFloating : null,
              isWide && isFloating ? styles.itemFloatingWide : null,
              isCompact ? styles.itemCompact : null,
              isActive ? styles.itemActive : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <View style={styles.itemStack}>
              <View style={styles.iconSlot}>
                <NavIcon active={isActive} name={item.key} />
              </View>
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                numberOfLines={1}
                style={[styles.label, isCompact ? styles.labelCompact : null, isActive ? styles.labelActive : null]}
              >
                {item.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: 26,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    gap: theme.spacing.xxs,
    padding: theme.spacing.xxs,
  },
  containerFloating: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    gap: theme.spacing.xs,
    justifyContent: 'center',
    padding: 0,
    width: '100%',
  },
  item: {
    alignItems: 'center',
    borderRadius: 20,
    borderColor: 'transparent',
    borderWidth: theme.borders.width.thin,
    flex: 1,
    justifyContent: 'center',
    minHeight: 66,
    minWidth: 0,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 10,
  },
  itemActive: {
    backgroundColor: theme.colors.surface.inverse,
    borderColor: theme.colors.border.strong,
  },
  itemCompact: {
    minHeight: 64,
    paddingHorizontal: theme.spacing.xs,
  },
  itemFloating: {
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: 24,
    flex: 1,
    minHeight: 68,
    minWidth: 0,
    paddingHorizontal: theme.spacing.xs,
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
  },
  itemFloatingWide: {
    flex: 0,
    minWidth: 92,
    paddingHorizontal: theme.spacing.lg,
  },
  itemStack: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  iconSlot: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  label: {
    color: theme.colors.text.secondary,
    fontSize: 9.5,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: 1.1,
    maxWidth: '100%',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  labelActive: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.weight.semibold,
  },
  labelCompact: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  pressed: {
    opacity: 0.84,
  },
});
