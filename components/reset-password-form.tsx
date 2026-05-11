import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useSignIn } from '@clerk/expo';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { TextInput, View } from 'react-native';

export function ResetPasswordForm() {
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();
  const [password, setPassword] = React.useState('');
  const [code, setCode] = React.useState('');
  const codeInputRef = React.useRef<TextInput>(null);
  const [error, setError] = React.useState({ code: '', password: '' });

  async function onSubmit() {
    if (fetchStatus === 'fetching') {
      return;
    }
    try {
      const { error: verifyCodeError } = await signIn.resetPasswordEmailCode.verifyCode({
        code,
      });

      if (verifyCodeError) {
        setError({ code: verifyCodeError.longMessage ?? verifyCodeError.message, password: '' });
        return;
      }

      const { error: submitPasswordError } = await signIn.resetPasswordEmailCode.submitPassword({
        password,
      });

      if (submitPasswordError) {
        setError({
          code: '',
          password: submitPasswordError.longMessage ?? submitPasswordError.message,
        });
        return;
      }

      if (signIn.status === 'complete') {
        // Set the active session to
        // the newly created session (user is now signed in)
        await signIn.finalize();
        return;
      }
      // TODO: Handle other statuses
    } catch (err) {
      // See https://go.clerk.com/mRUDrIe for more info on error handling
      const message = err instanceof Error ? err.message : 'Something went wrong';
      const isPasswordMessage = message.toLowerCase().includes('password');
      setError({
        code: isPasswordMessage ? '' : message,
        password: isPasswordMessage ? message : '',
      });
      console.error(err);
    }
  }

  function onPasswordSubmitEditing() {
    codeInputRef.current?.focus();
  }

  return (
    <View className="gap-5">
      <View className="gap-4">
        <View className="gap-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={onPasswordSubmitEditing}
          />
          {error.password ? (
            <Text className="text-sm font-medium text-destructive">{error.password}</Text>
          ) : null}
        </View>
        <View className="gap-1.5">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            value={code}
            ref={codeInputRef}
            autoCapitalize="none"
            onChangeText={setCode}
            returnKeyType="send"
            keyboardType="numeric"
            autoComplete="sms-otp"
            textContentType="oneTimeCode"
            onSubmitEditing={onSubmit}
          />
          <Text className="text-xs leading-5 text-muted-foreground">
            Paste the code from your email, then choose a fresh password.
          </Text>
          {error.code ? (
            <Text className="text-sm font-medium text-destructive">{error.code}</Text>
          ) : null}
        </View>
        <Button className={cn('w-full', fetchStatus === 'fetching' && 'opacity-50')} onPress={onSubmit}>
          <Text>Update password</Text>
        </Button>
      </View>
      <View className="flex-row flex-wrap items-center justify-center gap-1.5">
        <Text className="text-sm text-muted-foreground">Need to start over?</Text>
        <Button
          variant="link"
          className="h-auto rounded-none px-0 py-0"
          onPress={() => {
            router.replace('/forgot-password' as never);
          }}>
          <Text className="text-sm">Request a new code</Text>
        </Button>
      </View>
    </View>
  );
}
