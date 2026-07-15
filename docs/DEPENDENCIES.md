# Dependencies — every package, its version, health, and why

Versions verified against the npm registry on **2026-07-14/15**. Expo-managed packages are
pinned by **Expo SDK 57** (`npx expo install` chooses the version the SDK is tested against —
this is the compatibility guarantee we want). Rule: no old, deprecated, abandoned, or broken
dependencies.

## Mobile app (`/OgbajeApp`) — Expo SDK 57

### Expo core (SDK 57 sets these versions)

| Package | Version | Purpose | Why this one |
|---|---|---|---|
| `expo` | ~57.0.6 | Expo SDK runtime | Pins RN 0.86 + React 19.2 and every expo-* module to a mutually-tested set |
| `expo-dev-client` | ~57.0.6 | Custom development build (replaces Expo Go) | Required — Expo Go can't run our native SMS module or foreground service |
| `expo-location` | ~57.0.4 | GPS capture + streaming + background permission | First-party Expo module; config plugin wires the Android foreground-service/location perms |
| `expo-battery` | ~57.0.1 | Battery level + charging state for the critical-battery alert | First-party; replaces bare-RN `react-native-device-info` |
| `expo-image-picker` | ~57.0.4 | Deliberate in-app camera capture | First-party; replaces bare-RN `react-native-image-picker` |
| `expo-notifications` | ~57.0.5 | Notification permission (and future push handling) | First-party |
| `expo-build-properties` | ~57.0.5 | Config plugin (iOS static frameworks for RN Firebase) | Standard Expo escape hatch |
| `expo-status-bar` | ~57.0.1 | Status bar styling | Template default |

### Non-Expo native libraries (autolink under the development build)

| Package | Version | Purpose | Why this one |
|---|---|---|---|
| `@react-native-firebase/app` + `auth` + `firestore` + `storage` + `messaging` | 25.1.0 | Firebase (phone auth, realtime DB, photo storage, FCM) | Official Invertase bindings; the `@react-native-firebase/app` **config plugin** integrates them into the Expo prebuild. Firebase JS SDK can't do native phone auth, so this is required. |
| `@react-native-community/netinfo` | 12.0.1 | Connectivity detection → the mode switch | Standard; works under prebuild |
| `@react-native-async-storage/async-storage` | 2.2.0 (SDK-pinned) | Offline photo queue, cached GPS fix, armed check-in state | Standard; Expo-pinned |
| `react-native-background-actions` | ^4.1.0 | Android foreground service running the battery/check-in watchers | Maintained (2026-04). Flagged by expo-doctor as "untested on New Architecture" — accepted with a fallback plan (see note) |
| `react-native-shake` | ^6.9.5 | Discreet shake-to-SOS trigger | Actively maintained (2026-06); many sensor libs are dead (e.g. `react-native-sensors`, 2022) |
| `lucide-react-native` | ^1.24.0 | Icons (rule: icons, never emoji) | Matches dashboard's lucide-react |
| `react-native-svg` | 15.15.4 (SDK-pinned) | Peer of lucide-react-native | Standard |
| `react-native-safe-area-context` | ~5.7.0 (SDK-pinned) | Safe-area handling | Standard |

### Our own local native code

| Module | Purpose | Why |
|---|---|---|
| `modules/ogbaje-sms` (local Expo Module, Kotlin) | Direct SIM SMS via Android `SmsManager` | The survival-mode failsafe. Every published RN direct-SMS package is dead (below), and Expo has no SMS-send API, so we own it as an Expo Module — the SDK-idiomatic way to add native code to an Expo app. `expo-doctor` reports "no metadata" because it is local, not on npm — expected. |

**New Architecture note:** SDK 57 enables the New Architecture by default. `expo-doctor`
flags `react-native-background-actions` as untested there. It is accepted because it is the
best-maintained foreground-service option and the watchers it hosts are simple. Fallback if
it misbehaves: (a) set `newArchEnabled:false` in app.json to force the old bridge, or (b)
move the battery/check-in tick to `expo-task-manager` + `expo-background-task`. Documented so
the decision is revisitable, not silent.

**Deliberately NOT added:** `@react-navigation/*` (6 screens run off a state machine in
`App.tsx`); `expo-router` (same reason); a permissions library (Expo module permission
helpers + core `PermissionsAndroid` for SEND_SMS cover it).

## Rejected packages (and why) — checked, not assumed

| Package | Last publish | Verdict |
|---|---|---|
| `react-native-get-sms-android` | 2022-06 | **Dead.** Rejected. |
| `react-native-direct-sms` | 2022-11 | **Dead.** Rejected. |
| `react-native-send-sms` | 2022-06 | **Dead.** Rejected. |
| `react-native-sms` | 2024-10 | Not dead but **opens the SMS composer UI** — useless for an automatic failsafe. Rejected. |
| `expo-sms` | maintained | First-party, but also only **opens the composer UI** (`sendSMSAsync` needs the user to hit send) — cannot be an automatic failsafe. Rejected. |
| → conclusion | | **No package (Expo or RN) sends SMS silently from the SIM.** We write our own local Expo Module (Kotlin `SmsManager`). Safer to own it than depend on abandonware for the life-critical path. |
| `react-native-device-info` | healthy | Replaced by first-party `expo-battery` for the one thing we needed (battery level/state). |
| `react-native-vision-camera` | 2026-07 (healthy) | Overkill for a single "capture photo" need; `expo-image-picker` is the lower-risk fit. |
| Expo Go (managed) | n/a | Cannot send SIM SMS or run our foreground service. We use an Expo **development build** instead — Expo, but with native code. |

## Web dashboard (`/dashboard`) — unchanged by the Expo switch

| Package | Version | Last publish | Purpose | Why |
|---|---|---|---|---|
| `react` / `react-dom` | 19.2.x | 2026-07 | UI | Current stable |
| `vite` | 8.1.4 | 2026-07-09 | Build/dev tooling | Current standard |
| `firebase` | 12.16.0 | 2026-07-09 | Firestore/Storage realtime reads | Official web SDK |
| `leaflet` | 1.9.4 | stable | Map engine | Mature/stable; OSM tiles → no API key to fail on stage |
| `react-leaflet` | 5.0.0 | 2024-12 | React bindings for Leaflet | v5 is the React-19-compatible line; wraps stable Leaflet 1.9.4 (slow publish cadence reflects a finished, stable API, not abandonment) |
| `lucide-react` | 1.24.0 | 2026-07-09 | Icons | Matches mobile icon set |

*(Update this table every time a dependency is added, removed, or bumped.)*
