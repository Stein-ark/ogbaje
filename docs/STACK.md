# Stack — what we use and why

Chosen for a solo developer against a hackathon deadline. The stack removes the two biggest
risks: building a custom backend under pressure, and fighting platform limitations.

## Mobile app — Expo SDK 57 (development build / prebuild), TypeScript, Android-first

- **Expo, but NOT Expo Go.** The app uses Expo's *development build* workflow (a.k.a.
  "prebuild" or dev-client): the full Expo SDK, config plugins, and EAS Build, **plus** the
  ability to run custom native code. This matters because the two hardest requirements —
  sending SMS directly from the SIM, and running an Android foreground service — are
  impossible in the **Expo Go** managed sandbox but fully supported in a development build.
  So we get Expo's developer experience without giving up the life-critical native features.
  - The offline SMS failsafe is a **local Expo Module** (`modules/ogbaje-sms`, Kotlin, Expo
    Modules API) — the Expo-idiomatic way to ship your own native code inside an Expo app.
  - The foreground service uses `react-native-background-actions`, which autolinks under a
    development build.
- **Expo SDK 57** pins React Native 0.86 + React 19.2 for us; every Expo module
  (`expo-location`, `expo-battery`, `expo-image-picker`, …) is versioned to match, which is
  exactly the ecosystem-compatibility guarantee we want under deadline. Non-Expo native libs
  (`@react-native-firebase/*`, `react-native-background-actions`, `react-native-shake`) are
  pinned to versions verified compatible (see DEPENDENCIES.md).
- **Why Android-first:** the SMS failsafe can only exist on Android (iOS forbids programmatic
  SMS entirely; cloud SMS APIs need internet so they can't be a no-internet failsafe). The
  region is overwhelmingly Android, so this targets the phones people actually carry.
- **Build path:** `npx expo prebuild` generates the native `android/` project locally, or —
  more useful on a machine without the Android SDK — **EAS Build** compiles the APK in Expo's
  cloud (`eas build -p android --profile development`). See docs/SETUP.md.

## Backend — Firebase (fully managed)

| Service | Used for |
|---|---|
| **Firebase Auth** (phone auth) | Sign-up/verify by phone number — the identity is the phone number, which is also what SMS routing needs |
| **Cloud Firestore** | Users, contacts graph, alerts, live location points, timeline events — realtime by default |
| **Firebase Storage** | Alert photos |
| **Cloud Messaging (FCM)** | Push notifications to contacts' phones |

**Why:** one managed platform gives auth + realtime DB + file storage + push with no server
code to host or debug. Firestore's `onSnapshot` makes the live dashboard nearly free.
Mobile side uses `@react-native-firebase/*` (native SDK bindings, required for phone auth
and FCM); web side uses the plain `firebase` JS SDK.

## Web dashboard — React 19 + Vite 8

- Thin realtime client over the same Firestore: `onSnapshot` listeners push location points,
  photos, and timeline events to the screen with no backend code and no manual refresh.
- **Leaflet + react-leaflet + OpenStreetMap tiles** for the live map: no API key, no billing
  account, no quota to hit mid-demo (Google Maps JS requires a billed key).
- **lucide-react** for icons (project rule: icons, never emoji).

## Native Android code we write ourselves (Kotlin)

| Capability | Why native | Where |
|---|---|---|
| Direct SMS send via `SmsManager` | Every published RN direct-SMS package is abandoned (all last published 2022 — see DEPENDENCIES.md). A ~60-line Kotlin module we own is safer than a dead dependency. | `app/android/.../sms/` |

Foreground service, battery, connectivity, location, and shake detection are covered by
actively-maintained RN packages (see DEPENDENCIES.md) — no additional native code needed
unless testing proves otherwise.
