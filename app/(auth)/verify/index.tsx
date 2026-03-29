import { useEffect, useRef, useState } from 'react';

import { Redirect, useRouter } from 'expo-router';
import { Keyboard, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

import { OtpCodeInput } from '@/components/auth/OtpCodeInput';
import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { TextButton } from '@/components/ui/TextButton';
import { resolveEntryPath, useRoleRedirect } from '@/hooks/useRoleRedirect';
import { firebaseConfig, hasFirebaseConfig } from '@/lib/firebase';
import { theme } from '@/lib/theme/tokens';
import { isDemoPhoneAuthEnabled, resolvePhoneAuthErrorMessage } from '@/services/auth';
import { useSessionStore } from '@/store/session';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const authStatus = useSessionStore((state) => state.authStatus);
  const { targetPath } = useRoleRedirect();
  const pendingPhoneDisplayNumber = useSessionStore((state) => state.pendingPhoneDisplayNumber);
  const verifyOtpCode = useSessionStore((state) => state.verifyOtpCode);
  const beginPhoneAuth = useSessionStore((state) => state.beginPhoneAuth);
  const editPendingPhoneNumber = useSessionStore((state) => state.editPendingPhoneNumber);
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);
  const usesDemoCode = isDemoPhoneAuthEnabled();

  useEffect(() => {
    if (resendCountdown <= 0) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setResendCountdown((current) => current - 1);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [resendCountdown]);

  useEffect(() => {
    if (code.length === 6) {
      Keyboard.dismiss();
    }
  }, [code]);

  if (authStatus === 'guest') {
    return <Redirect href="/phone" />;
  }

  if (authStatus === 'role_pending' || authStatus === 'authenticated') {
    return <Redirect href={targetPath} />;
  }

  const handleVerify = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await verifyOtpCode(code);
      const nextSession = useSessionStore.getState();

      router.replace(
        resolveEntryPath(nextSession.authStatus, nextSession.currentRole, nextSession.pendingRoleSelection),
      );
    } catch (error) {
      setErrorMessage(resolvePhoneAuthErrorMessage(error, 'verify'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!pendingPhoneDisplayNumber) {
      editPendingPhoneNumber();
      router.replace('/phone');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await beginPhoneAuth(pendingPhoneDisplayNumber, {
        forceResend: true,
      });
      setCode('');
      setStatusMessage(usesDemoCode ? 'Demo mode is ready. Enter any 6-digit code to continue.' : 'A fresh 6-digit code has been sent.');
      setResendCountdown(30);
    } catch (error) {
      setErrorMessage(resolvePhoneAuthErrorMessage(error, 'request'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditNumber = () => {
    editPendingPhoneNumber();
    router.replace('/phone');
  };

  return (
    <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
      <View style={styles.wrapper}>
        <Screen
          footer={
            <View style={styles.actions}>
              <Button disabled={isSubmitting || code.length !== 6} label="Confirm" onPress={() => void handleVerify()} />
              <Button
                disabled={isSubmitting || resendCountdown > 0}
                label={resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend code'}
                onPress={() => void handleResend()}
                variant="secondary"
              />
            </View>
          }
          scroll
        >
          <AppHeader
            eyebrow="Verify phone"
            onBackPress={handleEditNumber}
            showBackButton
            subtitle={
              usesDemoCode
                ? 'Enter any 6-digit code to continue in Expo Go.'
                : 'Enter the real 6-digit SMS code from Firebase to continue.'
            }
            title="Enter the code."
          />

          <View style={styles.phoneCard}>
            <View style={styles.phoneCardCopy}>
              <Text style={styles.phoneLabel}>Sending code to</Text>
              <Text style={styles.phoneValue}>{pendingPhoneDisplayNumber ?? '+7'}</Text>
            </View>
            <TextButton label="Edit number" onPress={handleEditNumber} />
          </View>

          <View style={styles.codeBlock}>
            <Text style={styles.codeLabel}>Verification code</Text>
            <OtpCodeInput onChangeText={setCode} value={code} />
          </View>

          {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </Screen>
        
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: theme.spacing.md,
  },
  codeBlock: {
    gap: theme.spacing.lg,
  },
  codeLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  errorText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  phoneCard: {
    alignItems: 'center',
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borders.radius.sm,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  phoneCardCopy: {
    gap: theme.spacing.xs,
  },
  phoneLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  phoneValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  statusText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.sm,
    fontWeight: theme.typography.weight.medium,
    lineHeight: theme.typography.lineHeight.sm,
  },
  wrapper: {
    flex: 1,
  },
});
