import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, RefreshCw, CheckCircle2, AlertCircle, 
  Code2, Edit2, Trash2, Server 
} from 'lucide-react';

export default function MonitorList({ monitors, loading, error, onDelete }) {
  const count = monitors.length;

  return (
    <section className="glass-panel p-8" aria-labelledby="monitors-list-heading">
      <div className="flex justify-between items-center mb-6">
        <h2 id="monitors-list-heading" className="text-xl font-bold text-white">Active Monitors</h2>
        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-gray-400">
          {count} {count === 1 ? 'monitor' : 'monitors'}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          <SkeletonCards />
        ) : error ? (
          <EmptyState text="Unable to fetch registered monitors." />
        ) : count === 0 ? (
          <EmptyState text="No monitors active. Add one to get started." />
        ) : (
          monitors.map((monitor) => (
            <MonitorCard key={monitor.id} monitor={monitor} onDelete={onDelete} />
          ))
        )}
      </div>
    </section>
  );
}

function MonitorCard({ monitor, onDelete }) {
  const [showJson, setShowJson] = useState(false);
  const bodyJson = normalizeJsonField(monitor.requestBody);
  const expectedJson = normalizeJsonField(monitor.expectedStructure);
  const hasJson = bodyJson !== null || expectedJson !== null;
  const status = getStatusMeta(monitor);
  const methodStr = (monitor.method || 'GET').toUpperCase();

  function handleDeleteClick() {
    if (window.confirm(`Confirm deletion of monitor endpoint for: ${monitor.url}?`)) {
      onDelete(monitor.id);
    }
  }

  const jsonContent = {};
  if (bodyJson !== null) jsonContent.requestBody = bodyJson;
  if (expectedJson !== null) jsonContent.expectedStructure = expectedJson;

  const methodColor = methodStr === 'GET' 
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';

  return (
    <article className="glass-card p-5 group">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <div className="text-lg font-semibold text-white break-all">
            {monitor.url || 'Untitled monitor'}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
            <span className={`px-2 py-0.5 rounded-md border font-bold tracking-wider ${methodColor}`}>
              {methodStr}
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
              <Clock className="w-3.5 h-3.5" />
              {monitor.cronExpression || 'No cron'}
            </span>
            <span className="flex items-center gap-1.5 text-gray-500">
              <RefreshCw className="w-3.5 h-3.5" />
              {formatDate(monitor.updatedAt || monitor.createdAt)}
            </span>
          </div>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${status.className} whitespace-nowrap`}>
          {status.label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-white/5 text-sm">
        <span className="flex items-center gap-1.5 font-medium text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          Success {monitor.successCount || 0}
        </span>
        <span className="flex items-center gap-1.5 font-medium text-rose-400">
          <AlertCircle className="w-4 h-4" />
          Failure {monitor.failureCount || 0}
        </span>
        <span className="flex items-center gap-1.5 font-medium text-gray-500">
          <Code2 className="w-4 h-4" />
          {expectedJson !== null ? 'Validation on' : 'Validation off'}
        </span>
        
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition-colors disabled:opacity-30"
            disabled={!hasJson}
            onClick={() => setShowJson((prev) => !prev)}
          >
            <Code2 className="w-3.5 h-3.5" />
            {showJson ? 'Hide JSON' : 'View JSON'}
          </button>
          <Link 
            to={`/monitors/${monitor.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </Link>
          <button 
            type="button" 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium transition-colors" 
            onClick={handleDeleteClick}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      {showJson && (
        <pre className="mt-4 p-4 bg-black/50 border border-white/10 rounded-xl text-indigo-300 text-sm font-mono overflow-x-auto animate-[fadeIn_0.2s_ease-out_forwards]">
          {JSON.stringify(jsonContent, null, 2)}
        </pre>
      )}
    </article>
  );
}

function SkeletonCards() {
  return Array.from({ length: 3 }, (_, i) => (
    <div key={i} className="glass-card p-5 animate-pulse">
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-3 w-2/3">
          <div className="h-6 bg-white/10 rounded-lg w-3/4" />
          <div className="flex gap-2">
            <div className="h-5 bg-white/10 rounded-md w-12" />
            <div className="h-5 bg-white/10 rounded-md w-24" />
          </div>
        </div>
        <div className="h-6 bg-white/10 rounded-full w-20" />
      </div>
      <div className="flex gap-4 mt-5 pt-4 border-t border-white/5">
        <div className="h-4 bg-white/10 rounded w-20" />
        <div className="h-4 bg-white/10 rounded w-20" />
        <div className="h-4 bg-white/10 rounded w-24" />
      </div>
    </div>
  ));
}

function EmptyState({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 border-2 border-dashed border-white/10 rounded-2xl text-gray-500 bg-white/5">
      <Server className="w-12 h-12 mb-4 opacity-50" />
      <p className="font-medium text-center">{text}</p>
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
  if (!total) return { label: 'New Connection', className: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
  if (!success) return { label: 'Failing', className: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
  if (failure === 0) return { label: 'Operational', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
  return { label: 'De-stabilized', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
}
