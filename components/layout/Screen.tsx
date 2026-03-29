import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { Ref } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/lib/theme/tokens';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
  footerMaxWidth?: number;
  footerMode?: 'docked' | 'floating';
  keyboardVerticalOffset?: number;
  maxContentWidth?: number;
  scrollRef?: Ref<ScrollView>;
};

export function Screen({
  children,
  scroll = false,
  style,
  contentContainerStyle,
  footer,
  footerMaxWidth,
  footerMode = 'docked',
  keyboardVerticalOffset = 0,
  maxContentWidth,
  scrollRef,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const contentInnerStyles = [
    styles.contentInner,
    scroll ? null : styles.contentInnerFill,
    maxContentWidth ? { maxWidth: maxContentWidth } : null,
    contentContainerStyle,
  ];

  return (
    <SafeAreaView edges={footer ? ['top', 'left', 'right'] : ['top', 'bottom', 'left', 'right']} style={[styles.safeArea, style]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
        style={styles.keyboardShell}
      >
        {scroll ? (
          <ScrollView
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={[
              styles.scrollContent,
              footer ? styles.contentWithFooter : null,
              footer && footerMode === 'floating' ? styles.contentWithFloatingFooter : null,
            ]}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
          >
            <View style={contentInnerStyles}>{children}</View>
          </ScrollView>
        ) : (
          <View
            style={[
              styles.content,
              footer ? styles.contentWithFooter : null,
              footer && footerMode === 'floating' ? styles.contentWithFloatingFooter : null,
            ]}
          >
            <View style={contentInnerStyles}>{children}</View>
          </View>
        )}

        {footer ? (
          <View
            style={[
              styles.footerShell,
              footerMode === 'floating' ? styles.footerShellFloating : null,
              { paddingBottom: Math.max(insets.bottom, theme.spacing.md) },
            ]}
          >
            <View style={[styles.footerInner, footerMaxWidth ? { maxWidth: footerMaxWidth } : null]}>
              {footer}
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  contentWithFooter: {
    paddingBottom: theme.spacing.display * 1.85,
  },
  contentWithFloatingFooter: {
    paddingBottom: theme.spacing.display * 2.1,
  },
  contentInner: {
    alignSelf: 'center',
    gap: theme.spacing.xxl,
    width: '100%',
  },
  contentInnerFill: {
    flex: 1,
  },
  footerShell: {
    backgroundColor: theme.colors.background.primary,
    borderTopColor: theme.colors.border.subtle,
    borderTopWidth: theme.borders.width.hairline,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  footerInner: {
    alignSelf: 'center',
    width: '100%',
  },
  footerShellFloating: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    paddingTop: theme.spacing.sm,
  },
  keyboardShell: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: theme.colors.background.primary,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
});
