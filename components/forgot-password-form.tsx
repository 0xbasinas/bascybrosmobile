import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { APP_NAME } from '@/lib/config';
import { checkEmailAllowed } from '@/lib/check-email';
import { cn } from '@/lib/utils';
import { useSignIn } from '@clerk/expo';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const { signIn, fetchStatus } = useSignIn();
  const [error, setError] = React.useState<{ email?: string; password?: string }>({});
  const [isCheckingAllowlist, setIsCheckingAllowlist] = React.useState(false);

  const onSubmit = async () => {
    if (!email) {
      setError({ email: 'Email is required' });
      return;
    }
    if (fetchStatus === 'fetching' || isCheckingAllowlist) {
      return;
    }

    setError({});
    setIsCheckingAllowlist(true);
    try {
      const allow = await checkEmailAllowed(email);
      if (!allow.allowed) {
        setError({
          email: allow.reason ?? 'This email is not allowed to use password reset.',
        });
        return;
      }

      const { error: createError } = await signIn.create({
        identifier: email,
      });

      if (createError) {
        setError({ email: createError.longMessage ?? createError.message });
        return;
      }

      const { error: sendCodeError } = await signIn.resetPasswordEmailCode.sendCode();

      if (sendCodeError) {
        setError({ email: sendCodeError.longMessage ?? sendCodeError.message });
        return;
      }

      router.push({
        pathname: '/reset-password' as never,
        params: { email },
      });
    } catch (err) {
      // See https://go.clerk.com/mRUDrIe for more info on error handling
      setError({ email: err instanceof Error ? err.message : 'Something went wrong' });
    } finally {
      setIsCheckingAllowlist(false);
    }
  };

  return (
    <View className="gap-5">
      <View className="gap-4">
        <View className="gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={email}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoComplete="email"
            autoCapitalize="none"
            onChangeText={setEmail}
            onSubmitEditing={onSubmit}
            returnKeyType="send"
          />
          <Text className="text-xs leading-5 text-muted-foreground">
            We&apos;ll send a reset code to the email linked to your {APP_NAME} account.
          </Text>
          {error.email ? (
            <Text className="text-sm font-medium text-destructive">{error.email}</Text>
          ) : null}
        </View>
        <Button
          className={cn(
            'w-full',
            (fetchStatus === 'fetching' || isCheckingAllowlist) && 'opacity-50',
          )}
          onPress={onSubmit}>
          <Text>{isCheckingAllowlist ? 'Checking access…' : 'Send reset code'}</Text>
        </Button>
      </View>
      <View className="flex-row flex-wrap items-center justify-center gap-1.5">
        <Text className="text-sm text-muted-foreground">Remembered your password?</Text>
        <Button
          variant="link"
          className="h-auto rounded-none px-0 py-0"
          onPress={() => {
            router.replace('/sign-in' as never);
          }}>
          <Text className="text-sm">Back to sign in</Text>
        </Button>
      </View>
    </View>
  );
}
