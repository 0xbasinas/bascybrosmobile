import { SocialConnections } from '@/components/social-connections';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { APP_NAME } from '@/lib/config';
import { checkEmailAllowed } from '@/lib/check-email';
import { cn } from '@/lib/utils';
import { useSignIn } from '@clerk/expo';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { type TextInput, View } from 'react-native';

export function SignInForm({ isAddingAccount = false }: { isAddingAccount?: boolean } = {}) {
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const passwordInputRef = React.useRef<TextInput>(null);
  const [error, setError] = React.useState<{ email?: string; password?: string }>({});
  const [isCheckingAllowlist, setIsCheckingAllowlist] = React.useState(false);

  async function onSubmit() {
    if (fetchStatus === 'fetching' || isCheckingAllowlist) {
      return;
    }

    setError({});
    setIsCheckingAllowlist(true);
    try {
      const allow = await checkEmailAllowed(email);
      if (!allow.allowed) {
        setError({
          email: allow.reason ?? 'This email is not allowed to sign in.',
        });
        return;
      }

      // Start the sign-in process using the email and password provided
      const { error } = await signIn.password({
        identifier: email,
        password,
      });

      if (error) {
        const message = error.longMessage ?? error.message;
        const isEmailMessage =
          message.toLowerCase().includes('identifier') || message.toLowerCase().includes('email');
        setError(isEmailMessage ? { email: message } : { password: message });
        return;
      }

      if (signIn.status === 'needs_client_trust') {
        setError({
          password: 'Additional verification is required before this device can sign in.',
        });
        return;
      }

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signIn.status === 'complete') {
        setError({ email: '', password: '' });
        await signIn.finalize();
        if (isAddingAccount) {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)/notes' as never);
          }
        }
        return;
      }
      // TODO: Handle other statuses
      console.error(JSON.stringify(signIn, null, 2));
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
          <View className="flex-row items-center justify-between gap-3">
            <Label htmlFor="password">Password</Label>
            <Button
              variant="link"
              className="h-auto rounded-none px-0 py-0"
              onPress={() => {
                router.push('/forgot-password' as never);
              }}>
              <Text className="text-xs font-normal sm:text-sm">Forgot password?</Text>
            </Button>
          </View>
          <Input
            ref={passwordInputRef}
            id="password"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
            returnKeyType="send"
            onSubmitEditing={onSubmit}
          />
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
            {isCheckingAllowlist ? 'Checking access…' : `Continue to ${APP_NAME}`}
          </Text>
        </Button>
      </View>
      <View className="flex-row flex-wrap items-center justify-center gap-1.5">
        <Text className="text-sm text-muted-foreground">Don&apos;t have an account?</Text>
        <Button
          variant="link"
          className="h-auto rounded-none px-0 py-0"
          onPress={() => {
            router.push('/sign-up' as never);
          }}>
          <Text className="text-sm">Sign up</Text>
        </Button>
      </View>
      <View className="flex-row items-center">
        <Separator className="flex-1" />
        <Text className="px-4 text-sm text-muted-foreground">or continue with</Text>
        <Separator className="flex-1" />
      </View>
      <SocialConnections isAddingAccount={isAddingAccount} />
    </View>
  );
}
