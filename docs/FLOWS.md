# Flows — every significant piece of logic, as text diagrams

Kept in sync with the code. Each flow names the modules that implement it (see FILE-MAP.md).

## 1. SOS trigger → contact's screen (the master flow)

```
TRIGGER (any of:)
  in-app SOS button │ shake gesture │ check-in expired │ battery critical
        │                                   (implemented in services/alertEngine.ts)
        ▼
capture GPS fix (best-effort, 10s budget; fall back to last cached fix)
        │
        ▼
read CURRENT connectivity (NetInfo snapshot — never wait on the network)
        │
        ▼
write alerts/{id} + first location point + timeline event
  (Firestore offline persistence means this works in BOTH modes:
   offline it applies locally and syncs when signal returns)
        │
        ▼
send SMS from the SIM to EVERY contact (local OgbajeSms Expo module):
  "[Ogbaje SOS] <name> needs help.
   Last location: https://maps.google.com/?q=<lat>,<lng>
   Live dashboard (when back online): <dashboard>/alert/<id>"
  → SMS is fired in BOTH modes: it is the one channel needing no server,
    no billing plan, and no internet. Online just adds live streaming on top.
        │
   ┌────┴─────────────────────┐
ONLINE ("Full mode")      OFFLINE ("Survival mode")
   │                          │
   ▼                          ▼
start location streaming   reconnect listener armed:
(watchPosition → append    on signal → alert doc + timeline sync up,
locations/ every ~15s,     queued photos upload, mode flips sms → online,
update lastLocation)       streaming continues into Firestore
        │
        ▼
CONTACT is reached by (a) the SMS above, always, and
(b) a realtime Firestore listener in THEIR app (services/incomingAlerts.ts)
    that pops a full-screen takeover — no push infrastructure required.
  → they open dashboard/alert/{id}:
     live map (locations onSnapshot) / photos (photos onSnapshot)
     / timeline (timeline onSnapshot)
```

Key rules: the trigger path **never blocks on the network**, and SMS is the **guaranteed
floor** in both modes. True FCM push (delivery when the recipient's app process is dead AND
they have no SMS reception) needs a Cloud Function on Firebase's Blaze plan — intentionally
optional and out of the demo-critical path.

## 2. Photo capture + offline queue-and-sync

```
user (deliberately, in-app) taps camera icon on active-alert screen
  → expo-image-picker launches native camera → photo file
        │
   ┌────┴──────────────┐
ONLINE               OFFLINE
   │                    │
upload to Storage    append {localPath, alertId, takenAt}
→ write photos/ doc     to AsyncStorage queue
→ timeline event        │
                     NetInfo "reconnected" listener
                        → for each queued item: upload, write photos/ doc
                          (with original takenAt), timeline event, dequeue
```

## 3. Safe-arrival check-in (dead-man's switch)

```
user arms: destination + "expect me by <time>"
  → checkins/{id} status "armed"; foreground service holds the deadline
  → while armed: refresh lastLocation periodically
deadline reached without "I'm safe" tap?
  → auto-fire master flow (type "checkin-expired",
     note = "Travelling to <destination>, expected by <time>, did not check in")
"I'm safe" tapped → status "safe", service releases the deadline, contacts NOT bothered
```

## 4. Auto-alert on critical battery

```
foreground service (persistent notification, battery-optimization exemption requested)
  → poll battery level every 60s (expo-battery)
  → level ≤ 7% AND not charging AND no alert already active
      → fire master flow once (type "critical-battery")
      → mark fired; reset only when battery > 20% again (no re-fire loop)
```
Honest framing: nothing can run after power-off. This is "alert when the phone is *about to*
die", which is the buildable version of "alert when the phone dies".

## 5. Mode switch during an active alert

```
alert active in Full mode → NetInfo reports connection lost
  → timeline event "mode-changed → sms" queued
  → one-time SMS update sent with the last streamed location
alert active in Survival mode → connection restored
  → flush all queues (flow 2), resume streaming, timeline "mode-changed → online"
```

## 6. Onboarding

```
phone number → Firebase phone auth (SMS code) → users/{uid} created
→ permissions, each with an honest explanation screen BEFORE the OS prompt:
   location (incl. background) / SMS send / camera / notifications
   / battery-optimization exemption
→ add trusted contacts (name + phone) → registered-user lookup sets linkedUid (DATA-MODEL.md)
→ every permission denial handled: feature degrades + explains, never crashes
```
