# Data model — Firestore collections and shapes

One source of truth for both the mobile app (writes) and the web dashboard (realtime reads).
All timestamps are Firestore `Timestamp` (server time where possible).

```
users/{uid}
├── phone: string            E.164, e.g. "+2347012345678" — doc is keyed by Auth uid
├── name: string
├── fcmToken: string|null    current device push token (refreshed on app start)
├── createdAt: Timestamp
│
└── contacts/{contactId}     the user's trusted network (subcollection)
    ├── phone: string        E.164 — used for SMS failsafe routing
    ├── name: string         label the owner gave them
    ├── linkedUid: string|null   set when this phone belongs to a registered user →
    │                            enables push + dashboard; null = SMS-only contact
    └── addedAt: Timestamp

alerts/{alertId}
├── ownerUid: string         who is in danger
├── ownerName: string        denormalised for the dashboard header
├── ownerPhone: string
├── status: "active" | "resolved" | "cancelled"
├── type: "manual" | "shake" | "checkin-expired" | "critical-battery"
├── mode: "online" | "sms"   which mode fired at trigger time (sms may upgrade to online)
├── recipientUids: string[]  registered contacts' uids — Firestore rules allow these to read
├── lastLocation: { lat: number, lng: number, accuracy: number, at: Timestamp }
│                            denormalised copy of newest point (map centre + SMS payload)
├── note: string|null        e.g. check-in plan text "Travelling to Otukpo, expected 16:00"
├── createdAt / resolvedAt: Timestamp
│
├── locations/{autoId}       live location stream (append-only)
│   └── lat, lng, accuracy, at
│
├── photos/{autoId}
│   ├── storagePath: string  Firebase Storage object path
│   ├── url: string          download URL (written after upload completes)
│   ├── takenAt: Timestamp   capture time (matters: offline photos upload late)
│   └── uploadedAt: Timestamp
│
└── timeline/{autoId}        human-readable event feed (append-only)
    ├── kind: "alert-started" | "location-update" | "photo-added" |
    │         "sms-sent" | "sms-failed" | "mode-changed" | "contact-viewed" | "resolved"
    ├── message: string      e.g. "SMS failsafe sent to 3 contacts"
    └── at: Timestamp

checkins/{checkinId}         safe-arrival dead-man's switch
├── ownerUid: string
├── destination: string
├── expectedBy: Timestamp
├── status: "armed" | "safe" | "expired-alerted"
├── lastLocation: { lat, lng, at } | null   refreshed while armed
└── alertId: string|null     set when expiry auto-fires an alert
```

## Contact linking (the two-way network)

When user A adds phone number P:
1. App queries `users` for `phone == P`.
2. If found (registered user B): `linkedUid = B.uid` → B gets push notifications and can
   open the dashboard for A's alerts (B's uid lands in `recipientUids` at alert time).
3. If not found: SMS-only contact — still receives the survival-mode SMS, and the dashboard
   link inside it.
4. When someone registers later, a lookup on their phone number back-fills `linkedUid` in any
   contact docs pointing at them (done at registration time).

## Who reads/writes what

| Path | Mobile app | Dashboard |
|---|---|---|
| `users`, `users/*/contacts` | read/write own | – |
| `alerts` + subcollections | owner writes | contacts read via `onSnapshot` (live) |
| `checkins` | owner writes | – |
| Storage `alerts/{alertId}/photos/*` | owner uploads | reads via download URL |

Security rules (written alongside Firebase wiring): owner-only writes; alert reads restricted
to `ownerUid` + `recipientUids`. For the hackathon demo the dashboard may use a
signed-link/anonymous-read relaxation — documented in SETUP.md when we get there.
