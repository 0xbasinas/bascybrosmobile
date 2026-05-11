import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { APP_NAME } from '@/lib/config';
import { cn } from '@/lib/utils';
import { useSignUp } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { type TextStyle, View } from 'react-native';

const RESEND_CODE_INTERVAL_SECONDS = 30;

const TABULAR_NUMBERS_STYLE: TextStyle = { fontVariant: ['tabular-nums'] };

export function VerifyEmailForm() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { signUp, fetchStatus } = useSignUp();
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');
  const { countdown, restartCountdown } = useCountdown(RESEND_CODE_INTERVAL_SECONDS);

  async function onSubmit() {
    if (fetchStatus === 'fetching') return;

    try {
      // Use the code the user provided to attempt verification
      const { error: verifyCodeError } = await signUp.verifications.verifyEmailCode({
        code,
      });

      if (verifyCodeError) {
        setError(verifyCodeError.longMessage ?? verifyCodeError.message);
        return;
      }

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUp.status === 'complete') {
        await signUp.finalize();
        return;
      }
      // TODO: Handle other statuses
      // If the status is not complete, check why. User may need to
      // complete further steps.
      console.error(JSON.stringify(signUp, null, 2));
    } catch (err) {
      // See https://go.clerk.com/mRUDrIe for more info on error handling
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  async function onResendCode() {
    if (fetchStatus === 'fetching') return;

    try {
      const { error: sendCodeError } = await signUp.verifications.sendEmailCode();

      if (sendCodeError) {
        setError(sendCodeError.longMessage ?? sendCodeError.message);
        return;
      }

      restartCountdown();
    } catch (err) {
      // See https://go.clerk.com/mRUDrIe for more info on error handling
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  return (
    <View className="gap-5">
      <View className="gap-4">
        <View className="gap-1.5">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            value={code}
            autoCapitalize="none"
            onChangeText={setCode}
            returnKeyType="send"
            keyboardType="numeric"
            autoComplete="sms-otp"
            textContentType="oneTimeCode"
            onSubmitEditing={onSubmit}
          />
          <Text className="text-xs leading-5 text-muted-foreground">
            Enter the code sent to {email ?? 'your email'} to finish joining {APP_NAME}.
          </Text>
          {!error ? null : (
            <Text className="text-sm font-medium text-destructive">{error}</Text>
          )}
          <Button
            variant="link"
            disabled={countdown > 0}
            className="h-auto self-start rounded-none px-0 py-0"
            onPress={onResendCode}>
            <Text className="text-xs">
              Didn&apos;t receive the code? Resend{' '}
              {countdown > 0 ? (
                <Text className="text-xs" style={TABULAR_NUMBERS_STYLE}>
                  ({countdown})
                </Text>
              ) : null}
            </Text>
          </Button>
        </View>
        <View className="gap-3">
          <Button className={cn('w-full', fetchStatus === 'fetching' && 'opacity-50')} onPress={onSubmit}>
            <Text>Verify email</Text>
          </Button>
          <Button
            variant="link"
            className="h-auto rounded-none px-0 py-0"
            onPress={() => {
              router.replace('/sign-up');
            }}>
            <Text className="text-sm">Back to sign up</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}

function useCountdown(seconds = 30) {
  const [countdown, setCountdown] = React.useState(seconds);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCountdown = React.useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startCountdown = React.useCallback(() => {
    stopCountdown();
    setCountdown(seconds);

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          stopCountdown();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  }, [seconds, stopCountdown]);

  React.useEffect(() => {
    startCountdown();

    return stopCountdown;
  }, [startCountdown, stopCountdown]);

  return { countdown, restartCountdown: startCountdown };
}
