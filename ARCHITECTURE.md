# Ogbaje — Architecture

> **Ogbaje** (Idoma: *watcher / security personnel*) — a mobile safety app where every user has a
> private network of registered family and friends who can send and receive SOS alerts carrying
> live location, photos, and a timeline — designed to work even when there is no internet.

This is the living architecture document. It is updated every time a component is added or
changed. Detailed sub-documents live in [`/docs`](docs/):

| Document | Covers |
|---|---|
| [docs/STACK.md](docs/STACK.md) | Every technology/framework/service used and why |
| [docs/DEPENDENCIES.md](docs/DEPENDENCIES.md) | Every dependency: name, version, purpose, maintenance status, why it was picked |
| [docs/FILE-MAP.md](docs/FILE-MAP.md) | What every file/folder is responsible for, incl. native Android modules |
| [docs/DATA-MODEL.md](docs/DATA-MODEL.md) | Firestore collections and their shapes |
| [docs/FLOWS.md](docs/FLOWS.md) | Text diagrams of every significant flow (trigger → dashboard) |
| [docs/SETUP.md](docs/SETUP.md) | Machine + Firebase setup needed to build and run |

## Repository layout

```
Ogbaje/
├── OgbajeApp/   Expo SDK 57 app (dev build, TypeScript) — Android-first mobile app
├── dashboard/   React (Vite) web dashboard — what contacts open when they get an alert
├── docs/        Living documentation (see table above)
└── ARCHITECTURE.md   ← you are here
```

**Expo, not Expo Go.** The app is an Expo *development build* (prebuild + dev-client + EAS
Build): full Expo SDK and developer experience, but with custom native code — because the SMS
failsafe and the foreground service are impossible in the Expo Go sandbox. See docs/STACK.md.

## The two operating modes (the heart of the product)

Every alert flow is built around two tiers. The app detects connectivity
(`@react-native-community/netinfo`) and switches automatically. Both are intentional modes,
not a feature and a fallback hack.

### Full mode (online)
1. Alert document written to Cloud Firestore.
2. Contacts receive an FCM push notification with a dashboard link.
3. Live location streams to the alert's `locations` subcollection while the alert is active.
4. Photos the user deliberately takes upload to Firebase Storage and attach to the alert.
5. Contacts watch the web dashboard: moving map marker, photos appearing, running timeline —
   all realtime via Firestore `onSnapshot` (no polling, no refresh).

### Survival mode (offline)
1. The phone sends an **SMS from its own SIM** (our local Expo Module `modules/ogbaje-sms`,
   Kotlin, wrapping Android `SmsManager`) to every registered contact's phone number.
2. The SMS carries a plain-text distress message + last-known GPS coordinates as a Google Maps
   link — the "here is where to start searching" payload.
3. No live tracking or photo upload offline (both require a connection). Photos taken while
   offline are queued on-device and auto-upload the moment signal returns.

Why SMS-from-SIM and not a cloud SMS API (Termii, Africa's Talking): those APIs themselves
require internet, so they cannot be the no-internet failsafe. This is also why the app is
**Android-first by design** — Android allows an app to send SMS via the SIM; iOS does not allow
programmatic SMS at all.

## High-level component map

```
┌─────────────────────────┐         ┌──────────────────────────────┐
│  Mobile app (RN, Android)│         │ Firebase (managed backend)   │
│  - SOS triggers          │ writes  │  - Auth (phone)              │
│  - location streaming    ├────────►│  - Firestore (realtime DB)   │
│  - photo capture/queue   │         │  - Storage (photos)          │
│  - foreground service    │         │  - Cloud Messaging (push)    │
│  - SMS failsafe (SIM) ───┼──┐      └──────────────┬───────────────┘
└─────────────────────────┘  │                      │ onSnapshot (realtime reads)
                             │ SMS (no internet)    ▼
                             │      ┌──────────────────────────────┐
                             └─────►│ Contact's phone (SMS inbox)  │
                                    │ Web dashboard (React+Leaflet)│
                                    │  - live map, photos, timeline│
                                    └──────────────────────────────┘
```

## Hard technical truths this design respects

- **No code runs after the phone is off** → we build "auto-alert on critical battery
  (≤ ~7%)", never "alert on death".
- **No silent background photography on modern Android/iOS** → photos are manual, in-app,
  deliberate captures attached to an active alert.
- **SMS carries only text** → last-known GPS as a Maps link; no photos/tracking offline.
- **Expo Go cannot do SIM SMS or foreground services** → we use an Expo **development build**
  (prebuild + dev-client), which runs our local Kotlin Expo Module and native libs.
- **Android throttles background execution** → foreground service with persistent
  notification + battery-optimization exemption request.

## Build status

Code for all phases is written and **typechecked (`tsc` clean); `expo-doctor` passes all 20
checks; all config plugins resolve.** Runtime verification on a device is the remaining step
and needs the Firebase project + a build (EAS cloud build, or local Android SDK) — see
docs/SETUP.md. The Android project (`android/`) is generated by `expo prebuild`, so it is not
committed.

- [x] Phase 1.1 — project scaffold (Expo SDK 57) + documentation
- [x] Phase 1.2 — auth + trusted contacts (phone auth, linkedUid two-way network)
- [x] Phase 1.3 — SOS button → GPS → Firestore alert → SMS + in-app receiver
- [x] Phase 1.4 — dashboard live map (realtime onSnapshot)
- [x] Phase 2.5 — SMS failsafe (local Kotlin Expo Module, `modules/ogbaje-sms`)
- [x] Phase 2.6 — photo capture + offline queue-and-sync
- [x] Phase 2.7 — dashboard timeline
- [x] Phase 3.8 — discreet trigger (shake, global)
- [x] Phase 3.9 — safe-arrival check-in (dead-man's switch via foreground service)
- [x] Phase 3.10 — auto-alert on critical battery (foreground service)
- [x] Phase 4 — edge-case handling in every service/screen, icons-only UI, docs synced
- [ ] Device verification pass (needs Firebase project + a build — docs/SETUP.md)

## Out of scope (future roadmap, stated intentionally)

- Direct police/emergency-service dispatch integration — no reliable API exists; the
  kin-network *is* the intentional answer.
- iOS support — Android-first because the offline SMS failsafe is impossible on iOS.
- True silent background photography — OS-blocked.
