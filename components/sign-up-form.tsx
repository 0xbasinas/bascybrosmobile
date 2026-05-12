import { SocialConnections } from '@/components/social-connections';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { APP_NAME } from '@/lib/config';
import { checkEmailAllowed } from '@/lib/check-email';
import { cn } from '@/lib/utils';
import { useSignUp } from '@clerk/expo';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { TextInput, View } from 'react-native';

export function SignUpForm() {
  const router = useRouter();
  const { signUp, fetchStatus } = useSignUp();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const passwordInputRef = React.useRef<TextInput>(null);
  const [error, setError] = React.useState<{ email?: string; password?: string }>({});
  const [isCheckingAllowlist, setIsCheckingAllowlist] = React.useState(false);

  async function onSubmit() {
    if (fetchStatus === 'fetching' || isCheckingAllowlist) return;

    setError({});
    setIsCheckingAllowlist(true);
    try {
      const allow = await checkEmailAllowed(email);
      if (!allow.allowed) {
        setError({
          email: allow.reason ?? 'This email is not allowed to create an account.',
        });
        return;
      }

      // Start sign-up process using email and password provided
      const { error: createError } = await signUp.password({
        emailAddress: email,
        password,
      });

      if (createError) {
        const message = createError.longMessage ?? createError.message;
        const isEmailMessage =
          message.toLowerCase().includes('identifier') || message.toLowerCase().includes('email');
        setError(isEmailMessage ? { email: message } : { password: message });
        return;
      }

      // Send user an email with verification code
      const { error: sendCodeError } = await signUp.verifications.sendEmailCode();

      if (sendCodeError) {
        setError({ email: sendCodeError.longMessage ?? sendCodeError.message });
        return;
      }

      router.push({
        pathname: '/verify-email' as never,
        params: { email },
      });
    } catch (err) {
      // See https://go.clerk.com/mRUDrIe for more info on error handling
      const message = err instanceof Error ? err.message : 'Something went wrong';
      const isEmailMessage =
        message.toLowerCase().includes('identifier') || message.toLowerCase().includes('email');
      setError(isEmailMessage ? { email: message } : { password: message });
    } finally {
      setIsCheckingAllowlist(false);
    }
  }

  function onEmailSubmitEditing() {
    passwordInputRef.current?.focus();
  }

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
            onSubmitEditing={onEmailSubmitEditing}
            returnKeyType="next"
            submitBehavior="submit"
          />
          {error.email ? (
            <Text className="text-sm font-medium text-destructive">{error.email}</Text>
          ) : null}
        </View>
        <View className="gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            ref={passwordInputRef}
            id="password"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
            returnKeyType="send"
            onSubmitEditing={onSubmit}
          />
          <Text className="text-xs leading-5 text-muted-foreground">
            Use a secure password for your {APP_NAME} account.
          </Text>
          {error.password ? (
            <Text className="text-sm font-medium text-destructive">{error.password}</Text>
          ) : null}
        </View>
        <Button
          className={cn(
            'w-full',
            (fetchStatus === 'fetching' || isCheckingAllowlist) && 'opacity-50',
          )}
          onPress={onSubmit}>
          <Text>
            {isCheckingAllowlist ? 'Checking access…' : `Create your ${APP_NAME} account`}
          </Text>
        </Button>
      </View>
      <View className="flex-row flex-wrap items-center justify-center gap-1.5">
        <Text className="text-sm text-muted-foreground">Already have an account?</Text>
        <Button
          variant="link"
          className="h-auto rounded-none px-0 py-0"
          onPress={() => {
            router.push('/sign-in' as never);
          }}>
          <Text className="text-sm">Sign in</Text>
        </Button>
      </View>
      <View className="flex-row items-center">
        <Separator className="flex-1" />
        <Text className="px-4 text-sm text-muted-foreground">or continue with</Text>
        <Separator className="flex-1" />
      </View>
      <SocialConnections />
    </View>
  );
}
