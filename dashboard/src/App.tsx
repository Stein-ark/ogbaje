import { ShieldAlert, Link2 } from 'lucide-react';
import { firebaseConfigured } from './firebase';
import AlertView from './pages/AlertView';

/**
 * Routing is a single pattern — /alert/:alertId — so we parse the path directly
 * instead of pulling in a router dependency.
 */
export default function App() {
  const match = window.location.pathname.match(/^\/alert\/([A-Za-z0-9_-]+)/);

  if (!firebaseConfigured) {
    return (
      <div className="centered-note">
        <ShieldAlert size={48} />
        <h1>Ogbaje dashboard is not configured yet</h1>
        <p>
          Copy <code>.env.example</code> to <code>.env.local</code> and fill in the Firebase web
          config, then restart the dev server. See <code>docs/SETUP.md</code>.
        </p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="centered-note">
        <Link2 size={48} />
        <h1>No alert selected</h1>
        <p>
          Open the link you received by notification or SMS — it looks like{' '}
          <code>/alert/&lt;alert-id&gt;</code>.
        </p>
      </div>
    );
  }

  return <AlertView alertId={match[1]} />;
}
