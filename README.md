# BascyBros Mobile

Companion Expo app for the [`bascybros`](../bascybros) Next.js dashboard. Lets you read and edit your cybersecurity notes, manage tasks, browse the news feed, capture screenshots into Tigris, and chat with the workspace assistant on your phone.

## Stack

- Expo SDK 54, Expo Router 6, React Native 0.81 (New Architecture / Fabric)
- `@clerk/expo` v3 (Signal API) with SecureStore-backed token cache
- `@tanstack/react-query` for caching list endpoints
- `react-native-enriched-markdown` for native Markdown rendering
- `expo-image-picker` for camera + library uploads
- `expo/fetch` for SSE streaming from the assistant endpoint

## Backend dependency

The app talks to the Next.js backend in `../bascybros` via:

- `/api/mobile/*` — JSON CRUD for notes, tasks, news, uploads, and `me`
- `/api/upload` + `/api/mobile/uploads/register` — image upload pipeline
- `/api/assistant`, `/api/assistant/chats`, `/api/assistant/stream` — assistant + streaming

All requests authenticate with a Clerk bearer token. The same Clerk instance and email allowlist gate both clients.

## Setup

1. Copy `.env.example` to `.env` and fill in:

   ```bash
   cp .env.example .env
   ```

   - `EXPO_PUBLIC_API_URL` — base URL of the Next.js dev server. For physical-device testing use the LAN IP, e.g. `http://192.168.1.42:3000` (matching the LAN address shown by `next dev`).
   - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` — same value as the web app's `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Because `react-native-enriched-markdown` ships native code, the app can no longer run inside Expo Go. Use a development build:

   ```bash
   npx expo prebuild
   npx expo run:ios       # or run:android
   ```

   For iterative work after the first prebuild, `npm run ios` / `npm run android` start the dev server against the previously built dev client.

## Backend env / CORS

The Next.js middleware ([`bascybros/proxy.ts`](../bascybros/proxy.ts)) automatically allows CORS preflights from the Expo dev origins (localhost ports, `*.exp.direct`, the `bascybrosmobile://` scheme). To allow another origin, set `MOBILE_ALLOWED_ORIGIN` in the backend env.

## Project layout

```
app/
  _layout.tsx              ClerkProvider + React Query + Stack
  index.tsx                Redirect: signed-in -> tabs, else -> sign-in
  sign-in.tsx              Email/password sign-in (Clerk Signal API)
  sign-up.tsx              Sign-up + email-code verification
  unauthorized.tsx         Allowlist-rejected screen
  (tabs)/
    _layout.tsx            5-tab bar
    notes/                 List, new, [id]
    tasks/                 List, new, [id]
    news/                  RSS reader
    assistant/             Chat list + streamed [chatId]
    uploads/               Image gallery + camera/library picker
components/
  ui/                      Button, Input, Screen, Empty, Segmented
  markdown.tsx             EnrichedMarkdownText wrapper
  sign-out-button.tsx
lib/
  api.ts                   useApi() with Clerk bearer + expo/fetch
  config.ts                Env reads
  query.tsx                React Query provider
  theme.ts                 Palette + spacing tokens
  types.ts                 Shared row types
  assistant-stream.ts      SSE parser
  hooks/                   useMe, useUploadImage
```

## Building with EAS

`eas.json` includes these profiles:

- `development` - dev client for physical devices (internal distribution)
- `development-simulator` - dev client for iOS simulator
- `preview` - installable APK (Android) / simulator build (iOS) for QA
- `production` - store-ready builds (`.aab` on Android, release build on iOS)

### Common build commands

Using npm scripts:

```bash
npm run eas:build:dev:android
npm run eas:build:dev:ios
npm run eas:build:preview:android
npm run eas:build:prod:android
npm run eas:build:prod:ios
```

Direct EAS commands:

```bash
eas build --profile development --platform ios
eas build --profile production --platform all
```

The Expo project ID lives in `app.json` under `extra.eas.projectId`.

## GitHub Actions APK release (local Gradle)

The repository includes a workflow at `.github/workflows/android-release-apk.yml` that builds a signed Android release APK using Expo prebuild + Gradle on GitHub-hosted runners.

### Triggers

- Manual run from the Actions tab (`workflow_dispatch`)
- Automatic run on pushed tags matching `v*` (for example: `v1.0.0`)

### Required repository secrets

- `ANDROID_KEYSTORE_BASE64` - base64-encoded `.jks` keystore file
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `EXPO_PUBLIC_API_URL` - API base URL baked into the APK (do not use localhost for device installs)
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk key baked into the APK for auth

Example command to produce `ANDROID_KEYSTORE_BASE64` locally:

```bash
base64 < your-release-key.jks | tr -d '\n'
```

### Artifact output

After a successful workflow run, download the artifact named `bascybrosmobile-release-apk` from the run summary. The generated file is:

- `android/app/build/outputs/apk/release/app-release.apk`

## Local dev ergonomics

- `npm run start:dev-client` - Metro for installed dev client builds
- `npm run prebuild` - regenerate native projects without wiping local Android SDK wiring
- `npm run prebuild:clean` - full regenerate (reapply any manual native edits afterward)
- `npm run typecheck` and `npm run lint` - quick CI-style local checks
