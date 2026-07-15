import {
  Siren,
  MapPin,
  Camera,
  MessageSquareWarning,
  MessageSquareX,
  RefreshCcw,
  Eye,
  ShieldCheck,
  CircleDot,
} from 'lucide-react';
import type { TimelineEvent, TimelineKind } from '../types';

const ICONS: Record<TimelineKind, typeof Siren> = {
  'alert-started': Siren,
  'location-update': MapPin,
  'photo-added': Camera,
  'sms-sent': MessageSquareWarning,
  'sms-failed': MessageSquareX,
  'mode-changed': RefreshCcw,
  'contact-viewed': Eye,
  resolved: ShieldCheck,
};

export default function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="empty-note">Events will appear here as the situation unfolds.</p>;
  }

  return (
    <ul className="timeline">
      {events.map((e) => {
        const Icon = ICONS[e.kind] ?? CircleDot;
        return (
          <li key={e.id} className={`kind-${e.kind}`}>
            <span className="tl-icon">
              <Icon size={14} />
            </span>
            <div className="tl-body">
              <div className="tl-msg">{e.message}</div>
              <div className="tl-time">
                {e.at?.toDate().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
