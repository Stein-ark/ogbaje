import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import {
  ShieldAlert,
  Camera,
  ListOrdered,
  Wifi,
  MessageSquareWarning,
  AlertTriangle,
} from 'lucide-react';
import { db } from '../firebase';
import type { AlertDoc, LocationPoint, AlertPhoto, TimelineEvent } from '../types';
import LiveMap from '../components/LiveMap';
import Timeline from '../components/Timeline';

interface Props {
  alertId: string;
}

/**
 * The live response view a contact watches during an active alert.
 * Everything on this page is pushed by Firestore onSnapshot — no polling, no refresh.
 */
export default function AlertView({ alertId }: Props) {
  const [alert, setAlert] = useState<AlertDoc | null | undefined>(undefined);
  const [locations, setLocations] = useState<LocationPoint[]>([]);
  const [photos, setPhotos] = useState<AlertPhoto[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    const alertRef = doc(db, 'alerts', alertId);

    const unsubs = [
      onSnapshot(
        alertRef,
        (snap) => setAlert(snap.exists() ? (snap.data() as AlertDoc) : null),
        (e) => setError(e.message),
      ),
      onSnapshot(
        query(collection(alertRef, 'locations'), orderBy('at', 'asc')),
        (snap) =>
          setLocations(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as LocationPoint)),
        (e) => setError(e.message),
      ),
      onSnapshot(
        query(collection(alertRef, 'photos'), orderBy('takenAt', 'desc')),
        (snap) => setPhotos(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AlertPhoto)),
        (e) => setError(e.message),
      ),
      onSnapshot(
        query(collection(alertRef, 'timeline'), orderBy('at', 'desc')),
        (snap) => setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TimelineEvent)),
        (e) => setError(e.message),
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [alertId]);

  if (error) {
    return (
      <div className="centered-note">
        <AlertTriangle size={48} />
        <h1>Could not load this alert</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (alert === undefined) {
    return (
      <div className="centered-note">
        <ShieldAlert size={48} />
        <p>Connecting to the alert…</p>
      </div>
    );
  }

  if (alert === null) {
    return (
      <div className="centered-note">
        <AlertTriangle size={48} />
        <h1>Alert not found</h1>
        <p>This alert may have been deleted, or the link is incomplete.</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <ShieldAlert size={22} />
          Ogbaje
        </div>
        {alert.status === 'active' ? (
          <span className="badge active">
            <span className="pulse-dot" />
            ACTIVE SOS — {alert.ownerName}
          </span>
        ) : (
          <span className="badge resolved">
            {alert.status === 'resolved' ? 'RESOLVED' : 'CANCELLED'} — {alert.ownerName}
          </span>
        )}
        <span className="badge mode">
          {alert.mode === 'online' ? <Wifi size={14} /> : <MessageSquareWarning size={14} />}
          {alert.mode === 'online' ? 'Full mode (online)' : 'Survival mode (SMS)'}
        </span>
        <div className="header-meta">
          {alert.note && <span>{alert.note}</span>}
          <span>{alert.ownerPhone}</span>
        </div>
      </header>

      <div className="layout">
        <main className="map-pane">
          <LiveMap alert={alert} locations={locations} />
        </main>

        <aside className="side-pane">
          <section className="pane-section">
            <h2>
              <Camera size={15} />
              Photos ({photos.length})
            </h2>
            {photos.length === 0 ? (
              <p className="empty-note">
                No photos yet. They appear here the moment they are taken (or, if taken
                offline, as soon as the phone regains signal).
              </p>
            ) : (
              <div className="photo-grid">
                {photos.map((p) => (
                  <a key={p.id} href={p.url} target="_blank" rel="noreferrer">
                    <img src={p.url} alt={`Alert photo taken ${p.takenAt.toDate().toLocaleTimeString()}`} />
                  </a>
                ))}
              </div>
            )}
          </section>

          <section className="pane-section">
            <h2>
              <ListOrdered size={15} />
              Timeline
            </h2>
            <Timeline events={events} />
          </section>
        </aside>
      </div>
    </div>
  );
}
