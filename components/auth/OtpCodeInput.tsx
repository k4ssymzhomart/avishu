import { useRef } from 'react';
import type { TextInput as NativeTextInput } from 'react-native';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { theme } from '@/lib/theme/tokens';

type OtpCodeInputProps = {
  onChangeText: (value: string) => void;
  value: string;
};

const OTP_LENGTH = 6;

export function OtpCodeInput({ onChangeText, value }: OtpCodeInputProps) {
  const inputRef = useRef<NativeTextInput | null>(null);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const handleChange = (text: string) => {
    const sanitized = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChangeText(sanitized);
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      {/* Hidden input that captures all keyboard input */}
      <TextInput
        autoComplete="sms-otp"
        autoFocus
        caretHidden
        keyboardType="number-pad"
        maxLength={OTP_LENGTH}
        onChangeText={handleChange}
        ref={inputRef}
        style={styles.hiddenInput}
        textContentType="oneTimeCode"
        value={value}
      />

      {/* Visual cells */}
      <View style={styles.row}>
        {Array.from({ length: OTP_LENGTH }, (_, index) => {
          const digit = value[index] ?? '';
          const isActive = index === value.length && value.length < OTP_LENGTH;
          const isFilled = digit.length > 0;

          return (
            <View key={index} style={styles.cellWrap}>
              <View
                style={[
                  styles.cell,
                  isActive ? styles.cellActive : null,
                  isFilled ? styles.cellFilled : null,
                ]}
              >
                <Text style={styles.digit}>{digit}</Text>
              </View>
              {!digit ? (
                <View
                  style={[
                    styles.cellGuide,
                    isActive ? styles.cellGuideActive : null,
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    borderColor: theme.colors.border.subtle,
    borderRadius: 20,
    borderWidth: theme.borders.width.thin,
    height: 72,
    justifyContent: 'center',
    width: '100%',
  },
  cellActive: {
    backgroundColor: theme.colors.surface.muted,
    borderColor: theme.colors.border.strong,
  },
  cellFilled: {
    borderColor: theme.colors.border.strong,
  },
  cellGuide: {
    backgroundColor: theme.colors.border.subtle,
    height: 1,
    left: '50%',
    marginLeft: -8,
    pointerEvents: 'none',
    position: 'absolute',
    top: '50%',
    width: 16,
  },
  cellGuideActive: {
    backgroundColor: theme.colors.border.strong,
  },
  cellWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  container: {
    gap: theme.spacing.md,
  },
  digit: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xxl,
    lineHeight: theme.typography.lineHeight.xxl,
    textAlign: 'center',
  },
  hiddenInput: {
    height: 1,
    left: 0,
    opacity: 0,
    position: 'absolute',
    top: 0,
    width: 1,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
});
