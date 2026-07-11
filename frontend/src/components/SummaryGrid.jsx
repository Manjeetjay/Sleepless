import { ServersIcon, CheckCircleIcon, AlertCircleIcon, ActivityIcon } from './Icons';

export default function SummaryGrid({ monitors, health }) {
  const total = monitors.length;
  const totalSuccess = monitors.reduce((sum, m) => sum + (m.successCount || 0), 0);
  const totalFailure = monitors.reduce((sum, m) => sum + (m.failureCount || 0), 0);

  const apiState = (() => {
    if (!health) return { label: 'Offline', color: 'var(--danger)' };
    if (health.status === '200') return { label: 'Online', color: 'var(--success)' };
    return { label: 'Warning', color: 'var(--warning)' };
  })();

  return (
    <section className="summary-grid" aria-label="Dashboard Statistics Overview">
      <div className="stat-card total">
        <div className="stat-icon">
          <ServersIcon />
        </div>
        <div className="stat-info">
          <span className="stat-value">{total}</span>
          <span className="stat-label">Total Monitors</span>
        </div>
      </div>

      <div className="stat-card success-card">
        <div className="stat-icon">
          <CheckCircleIcon />
        </div>
        <div className="stat-info">
          <span className="stat-value">{totalSuccess}</span>
          <span className="stat-label">Successful Pings</span>
        </div>
      </div>

      <div className="stat-card failure-card">
        <div className="stat-icon">
          <AlertCircleIcon />
        </div>
        <div className="stat-info">
          <span className="stat-value">{totalFailure}</span>
          <span className="stat-label">Failed Pings</span>
        </div>
      </div>

      <div className="stat-card api-card">
        <div className="stat-icon">
          <ActivityIcon />
        </div>
        <div className="stat-info">
          <span className="stat-value" style={{ color: apiState.color }}>{apiState.label}</span>
          <span className="stat-label">API Health State</span>
        </div>
      </div>
    </section>
  );
}
