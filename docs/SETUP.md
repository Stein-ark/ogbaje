# Setup — what this machine needs to build and run Ogbaje

The app is an **Expo SDK 57 development build** (not Expo Go — it has custom native code).
There are two ways to get a runnable app; pick one.

Status as checked on this machine (Windows 11):

| Requirement | Status | Needed for |
|---|---|---|
| Node.js ≥ 20 | ✅ v24.17.0 | both paths |
| npm | ✅ 11.17.0 | both paths |
| Expo account (free) | ❌ create it | **Path A (EAS cloud build)** |
| JDK 17 + Android SDK | ❌ not installed (`ANDROID_HOME` unset) | **Path B (local build) only** |
| Free disk space | ⚠️ ~13 GB free | Path B needs ~8–10 GB; Path A needs almost none |
| Firebase project | ❌ not created | both paths |
| Physical Android phone + SIM | required to demo | the SMS failsafe (emulators can't send real SMS) |

Do **Step 1 (Firebase)** first — both build paths need `google-services.json` — then pick a
build path.

## Step 1 — Firebase project — ALREADY DONE (2026-07-15, via `scripts/setup-firebase.ps1` + CLI)

The project is created and wired up. **Project ID: `ogbaje-app-50549`**
(console: https://console.firebase.google.com/project/ogbaje-app-50549/overview).

Completed automatically:
- ✅ Project created; **Android app** `com.ogbaje.app` and **Web app** registered.
- ✅ `OgbajeApp/google-services.json` written (Android config, git-ignored).
- ✅ `dashboard/.env.local` written (web config, git-ignored).
- ✅ `.firebaserc` set to the project; **Firestore database created** (europe-west1);
  **Firestore security rules deployed** (`firestore.rules`).
- ✅ Firestore, Storage, Identity Toolkit APIs enabled.

**Two console steps remain** (account/billing actions that have no reliable CLI):

1. **Enable Phone sign-in** (required for login):
   https://console.firebase.google.com/project/ogbaje-app-50549/authentication/providers
   → **Get started** if prompted → **Phone** → Enable → Save.
   (Optional: add a test number under "Phone numbers for testing" to demo without real SMS.)
2. **Enable Storage** (optional — only needed for evidence-photo upload; **requires the free
   Blaze pay-as-you-go plan**, which asks for a card but costs nothing at demo volumes):
   https://console.firebase.google.com/project/ogbaje-app-50549/storage → Get started.
   Then deploy its rules: `firebase deploy --only storage --project ogbaje-app-50549`.
   If you skip this, the app works fully except attaching photos to an alert.

Cloud Messaging works out of the box with the Android app registration. To re-run the whole
setup for a fresh project: `firebase login` then `scripts/setup-firebase.ps1`.

## Path A — EAS cloud build (recommended; no Android SDK needed)

This is the big reason we're on Expo: **the APK is compiled in Expo's cloud**, so you don't
need JDK, the Android SDK, or ~10 GB of disk. Your laptop only runs Metro.

```powershell
cd Ogbaje\OgbajeApp
npm install -g eas-cli          # one-time
eas login                       # free Expo account
eas build:configure             # writes the projectId into app.json → extra.eas
eas build -p android --profile development
```

When the cloud build finishes, EAS gives a URL/QR — install that APK on your phone, then:

```powershell
npx expo start --dev-client     # phone opens the dev build, loads your JS over the network
```

## Path B — local build (only if you prefer building on this machine)

Needs the Android toolchain. Heavier, but works offline once set up.

1. **JDK 17:** `winget install EclipseAdoptium.Temurin.17.JDK`
2. **Android SDK:** install Android Studio (https://developer.android.com/studio) with
   *Android SDK*, *Platform (API 35)*, *Build-Tools*, *Platform-Tools*. Then:
   ```powershell
   [Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
   # add %LOCALAPPDATA%\Android\Sdk\platform-tools to Path
   ```
   Disk: Android Studio + SDK ≈ 6–8 GB, first Gradle build ≈ 2–3 GB more. ~13 GB free fits
   but is tight — free space first if you can.
3. Generate native projects and build to a plugged-in phone (USB debugging on):
   ```powershell
   cd Ogbaje\OgbajeApp
   npx expo prebuild --platform android   # generates android/ from app.json + plugins
   npm run android                        # expo run:android → builds & installs
   ```

## Dashboard (either path)

```powershell
cd Ogbaje\dashboard
npm install
npm run dev
```

## Notes

- **Expo Go will not work** — it can't load the SMS native module or the foreground service.
  You must install the development build (Path A APK, or Path B `run:android`).
- The `modules/ogbaje-sms` local module is compiled automatically by both paths (prebuild and
  EAS both pick up `modules/` via autolinking).
