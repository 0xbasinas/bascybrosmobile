import { SocialConnections } from '@/components/social-connections';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useSignUp } from '@clerk/expo';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Pressable, TextInput, View } from 'react-native';

export function SignUpForm() {
  const router = useRouter();
  const { signUp, fetchStatus } = useSignUp();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const passwordInputRef = React.useRef<TextInput>(null);
  const [error, setError] = React.useState<{ email?: string; password?: string }>({});

  async function onSubmit() {
    if (fetchStatus === 'fetching') return;

    // Start sign-up process using email and password provided
    try {
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
    }
  }

  function onEmailSubmitEditing() {
    passwordInputRef.current?.focus();
  }

  return (
    <View className="gap-6">
      <Card className="border-border/0 sm:border-border shadow-none sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">Create your account</CardTitle>
          <CardDescription className="text-center sm:text-left">
            Welcome! Please fill in the details to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="m@example.com"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                onChangeText={setEmail}
                onSubmitEditing={onEmailSubmitEditing}
                returnKeyType="next"
                submitBehavior="submit"
              />
              {error.email ? (
                <Text className="text-destructive text-sm font-medium">{error.email}</Text>
              ) : null}
            </View>
            <View className="gap-1.5">
              <View className="flex-row items-center">
                <Label htmlFor="password">Password</Label>
              </View>
              <Input
                ref={passwordInputRef}
                id="password"
                secureTextEntry
                onChangeText={setPassword}
                returnKeyType="send"
                onSubmitEditing={onSubmit}
              />
              {error.password ? (
                <Text className="text-destructive text-sm font-medium">{error.password}</Text>
              ) : null}
            </View>
            <Button className={cn("w-full", fetchStatus === 'fetching' && 'opacity-50')} onPress={onSubmit}>
              <Text>Continue</Text>
            </Button>
          </View>
          <Text className="text-center text-sm">
            Already have an account?{' '}
            <Pressable
              onPress={() => {
                router.push('/sign-in' as never);
              }}>
              <Text className="text-sm underline underline-offset-4">Sign in</Text>
            </Pressable>
          </Text>
          <View className="flex-row items-center">
            <Separator className="flex-1" />
            <Text className="text-muted-foreground px-4 text-sm">or</Text>
            <Separator className="flex-1" />
          </View>
          <SocialConnections />
        </CardContent>
      </Card>
    </View>
  );
}
