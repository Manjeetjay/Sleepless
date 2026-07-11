import { ActivityIcon, RefreshIcon, PingIcon } from './Icons';

export default function Topbar({ health, loading, loadingAction, onRefresh, onPingAll }) {
  const healthDotClass = (() => {
    if (!health) return 'status-dot issue';
    if (health.status === '200') return 'status-dot ok';
    return 'status-dot issue';
  })();

  const healthLabel = (() => {
    if (!health) return 'Health unavailable';
    if (health.status === '200') return 'API healthy';
    return 'API needs attention';
  })();

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-title-wrap">
          <div className="brand-logo" aria-hidden="true">
            <ActivityIcon />
          </div>
          <h1>Sleepless</h1>
        </div>
        <p>Keep your critical services awake and healthy</p>
      </div>

      <div className="topbar-actions">
        <div className="health-inline" aria-live="polite">
          <span className={healthDotClass} />
          <span>{healthLabel}</span>
        </div>
        <button
          className="button button-secondary"
          type="button"
          disabled={loading}
          onClick={onPingAll}
          aria-label="Trigger all pings"
        >
          <PingIcon />
          <span>{loadingAction === 'ping' ? 'Pinging...' : 'Ping all'}</span>
        </button>
        <button
          className="button button-secondary"
          type="button"
          disabled={loading}
          onClick={onRefresh}
          aria-label="Refresh dashboard data"
        >
          <RefreshIcon />
          <span>{loadingAction === 'refresh' ? 'Synchronizing...' : 'Refresh'}</span>
        </button>
      </div>
    </header>
  );
}
