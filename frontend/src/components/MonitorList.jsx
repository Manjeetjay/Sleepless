import { useState } from 'react';
import {
  ClockIcon,
  RefreshIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  CodeIcon,
  EditIcon,
  TrashIcon,
  ServersIcon,
} from './Icons';

export default function MonitorList({ monitors, loading, error, onEdit, onDelete }) {
  const count = monitors.length;

  return (
    <section className="panel" aria-labelledby="monitors-list-heading">
      <div className="section-header">
        <h2 id="monitors-list-heading">Monitors</h2>
        <span className="section-meta">{count} {count === 1 ? 'monitor' : 'monitors'}</span>
      </div>

      <div className="monitor-list">
        {loading ? (
          <SkeletonCards />
        ) : error ? (
          <EmptyState text="Unable to fetch registered monitors." />
        ) : count === 0 ? (
          <EmptyState text="No monitors active. Configure one on the left." />
        ) : (
          monitors.map((monitor) => (
            <MonitorCard key={monitor.id} monitor={monitor} onEdit={onEdit} onDelete={onDelete} />
          ))
        )}
      </div>
    </section>
  );
}

function MonitorCard({ monitor, onEdit, onDelete }) {
  const [showJson, setShowJson] = useState(false);
  const bodyJson = normalizeJsonField(monitor.requestBody);
  const expectedJson = normalizeJsonField(monitor.expectedStructure);
  const hasJson = bodyJson !== null || expectedJson !== null;
  const status = getStatusMeta(monitor);
  const methodStr = (monitor.method || 'GET').toUpperCase();

  function handleDeleteClick() {
    const confirmed = window.confirm(`Confirm deletion of monitor endpoint for: ${monitor.url}?`);
    if (confirmed) onDelete(monitor.id);
  }

  const jsonContent = {};
  if (bodyJson !== null) jsonContent.requestBody = bodyJson;
  if (expectedJson !== null) jsonContent.expectedStructure = expectedJson;

  return (
    <article className="monitor-item">
      <div className="monitor-main">
        <div className="monitor-info">
          <div className="monitor-url">{monitor.url || 'Untitled monitor'}</div>
          <div className="monitor-meta">
            <span className={`method-badge ${methodStr.toLowerCase()}`}>{methodStr}</span>
            <span className="monitor-cron">
              <ClockIcon />
              <span>{monitor.cronExpression || 'No cron'}</span>
            </span>
            <span className="monitor-updated">
              <RefreshIcon />
              <span>{formatDate(monitor.updatedAt || monitor.createdAt)}</span>
            </span>
          </div>
        </div>
        <span className={`status-badge ${status.className}`}>{status.label}</span>
      </div>

      <div className="monitor-stats">
        <span className="stat-item success">
          <CheckCircleIcon />
          <span>Success {monitor.successCount || 0}</span>
        </span>
        <span className="stat-item failure">
          <AlertCircleIcon />
          <span>Failure {monitor.failureCount || 0}</span>
        </span>
        <span className="stat-item validation">
          <CodeIcon />
          <span>{expectedJson !== null ? 'Validation on' : 'Validation off'}</span>
        </span>
      </div>

      {showJson && (
        <pre className="json-preview" aria-label="JSON Structure Preview">
          {JSON.stringify(jsonContent, null, 2)}
        </pre>
      )}

      <div className="monitor-actions">
        <button
          type="button"
          className="button button-secondary"
          disabled={!hasJson}
          onClick={() => setShowJson((prev) => !prev)}
        >
          <CodeIcon />
          <span>{showJson ? 'Hide' : 'JSON'}</span>
        </button>
        <button type="button" className="button button-secondary" onClick={() => onEdit(monitor)}>
          <EditIcon />
          <span>Edit</span>
        </button>
        <button type="button" className="button button-danger" onClick={handleDeleteClick}>
          <TrashIcon />
          <span>Delete</span>
        </button>
      </div>
    </article>
  );
}

function SkeletonCards() {
  return Array.from({ length: 3 }, (_, i) => (
    <div key={i} className="monitor-item skeleton-card">
      <div className="monitor-main">
        <div className="monitor-info" style={{ width: '70%' }}>
          <div className="skeleton-text heading" />
          <div className="monitor-meta">
            <span className="skeleton-text pill" />
            <span className="skeleton-text pill" style={{ width: 100 }} />
          </div>
        </div>
        <span className="skeleton-text pill" style={{ width: 75, height: 26 }} />
      </div>
      <div className="monitor-stats" style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
        <span className="skeleton-text pill" style={{ width: 80 }} />
        <span className="skeleton-text pill" style={{ width: 80 }} />
        <span className="skeleton-text pill" style={{ width: 90 }} />
      </div>
    </div>
  ));
}

function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <ServersIcon />
      <p>{text}</p>
    </div>
  );
}

function normalizeJsonField(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
}

function formatDate(value) {
  if (!value) return 'recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'recently';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function getStatusMeta(monitor) {
  const success = monitor.successCount || 0;
  const failure = monitor.failureCount || 0;
  const total = success + failure;
  if (!total) return { label: 'New Connection', className: 'neutral' };
  if (!success) return { label: 'Failing', className: 'danger' };
  if (failure === 0) return { label: 'Operational', className: 'success' };
  return { label: 'De-stabilized', className: 'warning' };
}
