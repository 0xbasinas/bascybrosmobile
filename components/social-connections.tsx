import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSSO, type StartSSOFlowParams } from '@clerk/expo';
import { useRouter } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Image, Platform, View, type ImageSourcePropType } from 'react-native';
import { AUTH_REDIRECT_URL } from '@/lib/auth-redirect';
import { Text } from '@/components/ui/text';

WebBrowser.maybeCompleteAuthSession();

type SocialConnectionStrategy = Extract<
  StartSSOFlowParams['strategy'],
  'oauth_google'
>;

const SOCIAL_CONNECTION_STRATEGIES: {
  type: SocialConnectionStrategy;
  label: string;
  source: ImageSourcePropType;
  useTint?: boolean;
}[] = [
    {
      type: 'oauth_google',
      label: 'Continue with Google',
      source: { uri: 'https://img.clerk.com/static/google.png?width=160' },
      useTint: false,
    }
  ];

export function SocialConnections({ isAddingAccount = false }: { isAddingAccount?: boolean } = {}) {
  useWarmUpBrowser();
  const { colorScheme } = useColorScheme();
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  function onSocialLoginPress(strategy: SocialConnectionStrategy) {
    return async () => {
      try {
        // Start the authentication process by calling `startSSOFlow()`
        const { createdSessionId, setActive } = await startSSOFlow({
          strategy,
          // For web, defaults to current path
          // For native, you must pass a scheme, like AuthSession.makeRedirectUri({ scheme, path })
          // For more info, see https://docs.expo.dev/versions/latest/sdk/auth-session/#authsessionmakeredirecturioptions
          redirectUrl: Platform.OS === 'web' ? AuthSession.makeRedirectUri() : AUTH_REDIRECT_URL,
        });

        // If sign in was successful, set the active session
        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
          if (isAddingAccount && router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)/notes');
          }
          return;
        }

        // TODO: Handle other statuses
        // If there is no `createdSessionId`,
        // there are missing requirements, such as MFA
        // Use the `signIn` or `signUp` returned from `startSSOFlow`
        // to handle next steps
      } catch (err) {
        // See https://go.clerk.com/mRUDrIe for more info on error handling
        console.error(JSON.stringify(err, null, 2));
      }
    };
  }

  return (
    <View className="gap-3">
      {SOCIAL_CONNECTION_STRATEGIES.map((strategy) => {
        return (
          <Button
            key={strategy.type}
            variant="outline"
            className="w-full justify-center"
            onPress={onSocialLoginPress(strategy.type)}>
            <Image
              className={cn('size-4', strategy.useTint && Platform.select({ web: 'dark:invert' }))}
              tintColor={Platform.select({
                native: strategy.useTint ? (colorScheme === 'dark' ? 'white' : 'black') : undefined,
              })}
              source={strategy.source}
            />
            <Text>{strategy.label}</Text>
          </Button>
        );
      })}
    </View>
  );
}

function useWarmUpBrowser() {
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    // Preload the browser on native devices to reduce authentication load time.
    void WebBrowser.warmUpAsync();

    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}