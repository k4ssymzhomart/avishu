import { useMemo, useRef, useState } from 'react';

import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { Redirect, useRouter } from 'expo-router';
import { Keyboard, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

import { AppHeader } from '@/components/layout/AppHeader';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useRoleRedirect } from '@/hooks/useRoleRedirect';
import { firebaseConfig, hasFirebaseConfig } from '@/lib/firebase';
import { theme } from '@/lib/theme/tokens';
import { formatKazakhstanPhoneInput, validateKazakhstanPhoneNumber } from '@/lib/utils/phone';
import { isDemoPhoneAuthEnabled, resolvePhoneAuthErrorMessage } from '@/services/auth';
import { useSessionStore } from '@/store/session';

export default function PhoneAuthScreen() {
  const router = useRouter();
  const authStatus = useSessionStore((state) => state.authStatus);
  const phoneEntryValue = useSessionStore((state) => state.phoneEntryValue);
  const setPhoneEntryValue = useSessionStore((state) => state.setPhoneEntryValue);
  const { targetPath } = useRoleRedirect();
  const beginPhoneAuth = useSessionStore((state) => state.beginPhoneAuth);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const validation = useMemo(() => validateKazakhstanPhoneNumber(phoneEntryValue), [phoneEntryValue]);
  const usesDemoCode = isDemoPhoneAuthEnabled();
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal | null>(null);

  if (authStatus === 'pending_verification') {
    return <Redirect href="/verify" />;
  }

  if (authStatus === 'role_pending' || authStatus === 'authenticated') {
    return <Redirect href={targetPath} />;
  }

  const handlePhoneContinue = async () => {
    if (!validation.isValid) {
      setErrorMessage(validation.message);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await beginPhoneAuth(validation.displayValue, {
        appVerifier: recaptchaVerifier.current,
      });
      router.replace('/verify');
    } catch (error) {
      setErrorMessage(resolvePhoneAuthErrorMessage(error, 'request'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
      <View style={styles.wrapper}>
        <Screen
          footer={
            <Button
              disabled={isSubmitting || !validation.isValid}
              label={isSubmitting ? 'Sending code...' : 'Send code'}
              onPress={() => void handlePhoneContinue()}
            />
          }
          scroll
        >
          <AppHeader
            eyebrow="Phone sign-in"
            onBackPress={() => router.replace('/landing')}
            showBackButton
            subtitle={
              usesDemoCode
                ? 'Expo Go demo mode: enter any Kazakhstan number, then use any 6-digit code on the next screen.'
                : "We'll send a real 6-digit Firebase verification code to your Kazakhstan number."
            }
            title="Enter your number."
          />

          <Card padding="lg" variant="muted">
            <Text style={styles.cardEyebrow}>Format</Text>
            <Text style={styles.cardBody}>Use the full Kazakhstan number in the AVISHU format shown below.</Text>
            <Text style={styles.cardExample}>+7-777-123-45-67</Text>
          </Card>

          <Input
            autoComplete="tel"
            autoFocus
            hint={
              validation.isValid
                ? usesDemoCode
                  ? 'Continue, then enter any 6-digit code.'
                  : `Code will be sent to ${validation.displayValue}.`
                : validation.message ?? undefined
            }
            keyboardType="phone-pad"
            label="Phone number"
            maxLength={16}
            onChangeText={(value) => {
              setPhoneEntryValue(formatKazakhstanPhoneInput(value));
              if (errorMessage) {
                setErrorMessage(null);
              }
            }}
            onSubmitEditing={() => void handlePhoneContinue()}
            placeholder="+7-777-123-45-67"
            returnKeyType="done"
            textContentType="telephoneNumber"
            value={phoneEntryValue}
          />

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </Screen>
        {hasFirebaseConfig && !usesDemoCode ? (
          <FirebaseRecaptchaVerifierModal
            attemptInvisibleVerification
            firebaseConfig={firebaseConfig}
            ref={recaptchaVerifier}
          />
        ) : null}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  cardBody: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.md,
    lineHeight: theme.typography.lineHeight.md,
  },
  cardEyebrow: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.xs,
    fontWeight: theme.typography.weight.medium,
    letterSpacing: theme.typography.tracking.widest,
    textTransform: 'uppercase',
  },
  cardExample: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.family.display,
    fontSize: theme.typography.size.xl,
    lineHeight: theme.typography.lineHeight.xl,
  },
  errorText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.sm,
    lineHeight: theme.typography.lineHeight.sm,
  },
  wrapper: {
    flex: 1,
  },
});
