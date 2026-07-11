import { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './components/Toast';
import Topbar from './components/Topbar';
import SummaryGrid from './components/SummaryGrid';
import MonitorForm from './components/MonitorForm';
import MonitorList from './components/MonitorList';
import {
  fetchHealth,
  fetchMonitors,
  createMonitor,
  updateMonitor,
  deleteMonitor,
} from './api';

export default function App() {
  return (
    <ToastProvider>
      <Dashboard />
    </ToastProvider>
  );
}

function Dashboard() {
  const showToast = useToast();
  const [monitors, setMonitors] = useState([]);
  const [health, setHealth] = useState(null);
  const [editingMonitor, setEditingMonitor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const [error, setError] = useState(null);

  const sortMonitors = (list) =>
    [...list].sort((a, b) => {
      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
      return bTime - aTime;
    });

  const loadDashboard = useCallback(
    async (showSuccess = false) => {
      setLoading(true);
      setLoadingAction('refresh');
      setError(null);

      try {
        const [healthData, monitorsData] = await Promise.all([
          fetchHealth(),
          fetchMonitors(),
        ]);
        setHealth(healthData);
        setMonitors(sortMonitors(Array.isArray(monitorsData) ? monitorsData : []));
        if (showSuccess) showToast('Dashboard synchronized.', 'success');
      } catch (err) {
        setHealth(null);
        setError(err);
        showToast(err.message || 'Failed to retrieve monitors status.', 'error');
      } finally {
        setLoading(false);
        setLoadingAction(null);
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handlePingAll() {
    setLoading(true);
    setLoadingAction('ping');

    try {
      const monitorsData = await fetchMonitors();
      setMonitors(sortMonitors(Array.isArray(monitorsData) ? monitorsData : []));
      showToast('Synchronous ping dispatched to all endpoints.', 'success');
    } catch (err) {
      showToast(err.message || 'Ping invocation failed.', 'error');
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  }

  async function handleSubmit(payload) {
    const isEditing = editingMonitor !== null;
    try {
      if (isEditing) {
        await updateMonitor(editingMonitor.id, payload);
        showToast('Monitor configurations updated.', 'success');
      } else {
        await createMonitor(payload);
        showToast('New monitor initialized successfully.', 'success');
      }
      setEditingMonitor(null);
      await loadDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to commit monitor config.', 'error');
    }
  }

  async function handleDelete(id) {
    try {
      await deleteMonitor(id);
      if (editingMonitor && editingMonitor.id === id) {
        setEditingMonitor(null);
      }
      await loadDashboard();
      showToast('Monitor configuration deleted.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to purge monitor.', 'error');
    }
  }

  return (
    <div className="app-shell">
      <Topbar
        health={health}
        loading={loading}
        loadingAction={loadingAction}
        onRefresh={() => loadDashboard(true)}
        onPingAll={handlePingAll}
      />

      <SummaryGrid monitors={monitors} health={health} />

      <main className="layout">
        <MonitorForm
          editingMonitor={editingMonitor}
          onSubmit={handleSubmit}
          onCancelEdit={() => setEditingMonitor(null)}
        />
        <MonitorList
          monitors={monitors}
          loading={loading}
          error={error}
          onEdit={(monitor) => setEditingMonitor(monitor)}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}
