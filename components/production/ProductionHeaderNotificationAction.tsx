import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AssetIcon } from '@/components/icons/AssetIcon';
import { useUserNotifications } from '@/hooks/useNotifications';
import { theme } from '@/lib/theme/tokens';
import { useSessionStore } from '@/store/session';

export function ProductionHeaderNotificationAction() {
  const router = useRouter();
  const currentUserId = useSessionStore((state) => state.currentUserId);
  const { notifications } = useUserNotifications(currentUserId, { markRead: false });
  const unreadCount = notifications.reduce((count, notification) => count + (notification.readAt ? 0 : 1), 0);

  return (
    <Pressable
      accessibilityLabel="Open production notifications"
      onPress={() => router.push('/production/notifications')}
      style={({ pressed }) => [styles.iconButton, pressed ? styles.iconButtonPressed : null]}
    >
      <AssetIcon color={theme.colors.text.primary} name="alarm" size={17} />
      {unreadCount ? (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.default,
    borderColor: theme.colors.border.subtle,
    borderRadius: 20,
    borderWidth: theme.borders.width.thin,
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    width: 40,
  },
  iconButtonPressed: {
    opacity: 0.84,
  },
  notificationBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface.inverse,
    borderRadius: 9,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -2,
    top: -2,
  },
  notificationBadgeText: {
    color: theme.colors.text.inverse,
    fontSize: 9,
    fontWeight: theme.typography.weight.semibold,
    letterSpacing: theme.typography.tracking.wide,
  },
});
