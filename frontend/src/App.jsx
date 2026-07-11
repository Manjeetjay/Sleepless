import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider, useToast } from './components/Toast';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import ManageMonitor from './pages/ManageMonitor';
import { fetchHealth, fetchMonitors, createMonitor, updateMonitor, deleteMonitor } from './api';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ToastProvider>
  );
}

function AppContent() {
  const showToast = useToast();
  const [monitors, setMonitors] = useState([]);
  const [health, setHealth] = useState(null);
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

  async function handleSubmitMonitor(payload, isEditing, id) {
    try {
      if (isEditing) {
        await updateMonitor(id, payload);
        showToast('Monitor configurations updated.', 'success');
      } else {
        await createMonitor(payload);
        showToast('New monitor initialized successfully.', 'success');
      }
      await loadDashboard();
      return true;
    } catch (err) {
      showToast(err.message || 'Failed to commit monitor config.', 'error');
      return false;
    }
  }

  async function handleDeleteMonitor(id) {
    try {
      await deleteMonitor(id);
      await loadDashboard();
      showToast('Monitor configuration deleted.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to purge monitor.', 'error');
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 min-h-screen flex flex-col gap-10">
      <Topbar
        health={health}
        loading={loading}
        loadingAction={loadingAction}
        onRefresh={() => loadDashboard(true)}
        onPingAll={handlePingAll}
      />
      <Routes>
        <Route path="/" element={
          <Dashboard 
            monitors={monitors} 
            health={health} 
            loading={loading} 
            error={error} 
            onDelete={handleDeleteMonitor} 
          />
        } />
        <Route path="/monitors/new" element={
          <ManageMonitor onSubmit={(p) => handleSubmitMonitor(p, false)} />
        } />
        <Route path="/monitors/:id/edit" element={
          <ManageMonitor 
            monitors={monitors}
            onSubmit={(p, id) => handleSubmitMonitor(p, true, id)} 
          />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
