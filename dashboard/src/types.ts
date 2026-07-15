// Shapes mirror docs/DATA-MODEL.md — keep the two in sync.
import type { Timestamp } from 'firebase/firestore';

export interface AlertDoc {
  ownerUid: string;
  ownerName: string;
  ownerPhone: string;
  status: 'active' | 'resolved' | 'cancelled';
  type: 'manual' | 'shake' | 'checkin-expired' | 'critical-battery';
  mode: 'online' | 'sms';
  recipientUids: string[];
  lastLocation: { lat: number; lng: number; accuracy: number; at: Timestamp } | null;
  note: string | null;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
}

export interface LocationPoint {
  id: string;
  lat: number;
  lng: number;
  accuracy: number;
  at: Timestamp;
}

export interface AlertPhoto {
  id: string;
  storagePath: string;
  url: string;
  takenAt: Timestamp;
  uploadedAt: Timestamp;
}

export type TimelineKind =
  | 'alert-started'
  | 'location-update'
  | 'photo-added'
  | 'sms-sent'
  | 'sms-failed'
  | 'mode-changed'
  | 'contact-viewed'
  | 'resolved';

export interface TimelineEvent {
  id: string;
  kind: TimelineKind;
  message: string;
  at: Timestamp;
}
