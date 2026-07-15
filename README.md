# Ogbaje

*(Idoma: watcher / security personnel)*

A mobile safety app for Benue State, Nigeria: every user has a private network of registered
family and friends who can send and receive SOS alerts carrying live location, photos, and a
timeline — **designed to work even when there is no internet**.

When someone triggers an alert, their people immediately know where the person is, who or
what to look for, and where to start searching — the exact information a family needs in the
first critical minutes, without depending on police dispatch or any infrastructure we don't
control.

## The two operating modes

| | Full mode (online) | Survival mode (offline) |
|---|---|---|
| Alert delivery | Firestore + realtime listeners | **SMS from the phone's own SIM** |
| Location | Live streaming on a map | Last known GPS as a Google Maps link |
| Photos | Upload instantly | Queued on-device, auto-sync on reconnect |
| Contacts watch | Live web dashboard | SMS text (dashboard link included for later) |

Both are intentional modes, not a feature and a workaround — the app detects connectivity
and switches automatically.

## Repository

| Folder | What it is |
|---|---|
| [`OgbajeApp/`](OgbajeApp/) | Expo SDK 57 (development build, Android-first) mobile app |
| [`dashboard/`](dashboard/) | React + Leaflet live response dashboard |
| [`docs/`](docs/) | Living documentation — stack, dependencies, data model, flows, setup |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Architecture overview + build status |
| [`firestore.rules`](firestore.rules) / [`storage.rules`](storage.rules) | Firebase security rules |

**Start here:** [`docs/SETUP.md`](docs/SETUP.md) — what to install and how to create the
Firebase project. Then [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Feature summary

- Phone-number sign-up; trusted contacts added by phone number (registered users link
  two-way automatically).
- Big obvious SOS button + **discreet shake trigger** (works app-wide).
- Active alert: live location streaming, deliberate in-app evidence photos, running timeline.
- **Safe-arrival check-in (dead-man's switch):** "travelling to X, expect me by Y" — no
  check-in, automatic alert.
- **Auto-alert on critical battery** (≤7%): the last-known-location goes out while the phone
  can still send anything.
- Foreground service keeps the watchers alive; honest permission explanations; every denial
  degrades gracefully.

## Future roadmap (intentionally out of scope)

Police/emergency dispatch integration (no reliable API exists — the kin-network is the
answer), iOS (programmatic SMS is impossible there), silent background photography
(OS-blocked on modern Android/iOS).
