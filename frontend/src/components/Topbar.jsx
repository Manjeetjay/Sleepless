import { Link, useLocation } from 'react-router-dom';
import { RefreshCw, Radio, Plus, LayoutDashboard } from 'lucide-react';

export default function Topbar({ health, loading, loadingAction, onRefresh, onPingAll }) {
  const location = useLocation();
  const isDashboard = location.pathname === '/';

  const healthState = (() => {
    if (!health) return { label: 'Health unavailable', dot: 'bg-gray-500' };
    if (health.status === '200') return { label: 'API healthy', dot: 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]' };
    return { label: 'API needs attention', dot: 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]' };
  })();

  return (
    <header className="flex flex-col sm:flex-row justify-between items-center gap-6 glass-panel px-6 py-4">
      <Link to="/" className="flex flex-col sm:flex-row items-center gap-4 group">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl group-hover:scale-105 transition-transform duration-300">
          <img src="/logo.png" alt="Sleepless Logo" className="h-12 w-12 object-contain drop-shadow-md" />
        </div>
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200">
            Sleepless
          </h1>
          <p className="text-sm text-indigo-200/60 font-medium">Keep your critical services awake</p>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-gray-300">
          <span className={`w-2 h-2 rounded-full ${healthState.dot}`} />
          {healthState.label}
        </div>
        
        {isDashboard ? (
          <>
            <button
              className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${loading && loadingAction === 'refresh' ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
              onClick={onPingAll}
              disabled={loading}
              title="Trigger all pings"
            >
              <Radio className={`w-4 h-4 ${loading && loadingAction === 'ping' ? 'animate-ping' : ''}`} />
              <span className="hidden sm:inline">Ping All</span>
            </button>
            <Link
              to="/monitors/new"
              className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:shadow-indigo-500/40"
            >
              <Plus className="w-4 h-4" />
              <span>Add Monitor</span>
            </Link>
          </>
        ) : (
          <Link
            to="/"
            className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-all hover:-translate-y-0.5"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        )}
      </div>
    </header>
  );
}
