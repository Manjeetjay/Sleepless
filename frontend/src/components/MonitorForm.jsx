import { useState, useEffect } from 'react';
import { useToast } from './Toast';

const CRON_PRESETS = [
  { label: 'Every min', cron: '0 */1 * * * *' },
  { label: 'Every 5m', cron: '0 */5 * * * *' },
  { label: 'Every 15m', cron: '0 */15 * * * *' },
  { label: 'Every hr', cron: '0 0 * * * *' },
  { label: 'Every day', cron: '0 0 0 * * *' },
];

export default function MonitorForm({ editingMonitor, onSubmit, onCancelEdit }) {
  const showToast = useToast();
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [cronExpression, setCronExpression] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [expectedStructure, setExpectedStructure] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEditing = editingMonitor !== null && editingMonitor !== undefined;

  useEffect(() => {
    if (editingMonitor) {
      setUrl(editingMonitor.url || '');
      setMethod((editingMonitor.method || 'GET').toUpperCase());
      setCronExpression(editingMonitor.cronExpression || '');
      setRequestBody(formatJson(normalizeJsonField(editingMonitor.requestBody)));
      setExpectedStructure(formatJson(normalizeJsonField(editingMonitor.expectedStructure)));
    } else {
      resetForm();
    }
  }, [editingMonitor]);

  function resetForm() {
    setUrl('');
    setMethod('GET');
    setCronExpression('');
    setRequestBody('');
    setExpectedStructure('');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    let parsedBody = null;
    let parsedExpected = null;

    try {
      parsedBody = parseJsonTextarea(requestBody, 'Request body JSON');
      parsedExpected = parseJsonTextarea(expectedStructure, 'Expected response JSON');
    } catch (err) {
      showToast(err.message, 'error');
      return;
    }

    const payload = {
      url: url.trim(),
      method,
      cronExpression: cronExpression.trim(),
      requestBody: parsedBody,
      expectedStructure: parsedExpected,
    };

    setSubmitting(true);
    try {
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="glass-panel p-8" aria-labelledby="form-title-heading">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
        <h2 id="form-title" className="text-xl font-bold text-white">
          {isEditing ? 'Edit Monitor' : 'Create New Monitor'}
        </h2>
        {isEditing && (
          <button 
            type="button" 
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            onClick={onCancelEdit}
          >
            Cancel Edit
          </button>
        )}
      </div>

      <form className="flex flex-col gap-6" autoComplete="off" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <label htmlFor="url" className="text-sm font-medium text-gray-300">Endpoint URL</label>
          <input
            id="url"
            type="url"
            placeholder="https://api.example.com/health"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="method" className="text-sm font-medium text-gray-300">Method</label>
            <select 
              id="method" 
              value={method} 
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label htmlFor="cronExpression" className="text-sm font-medium text-gray-300">Cron Schedule</label>
            <input
              id="cronExpression"
              type="text"
              placeholder="0 */15 * * * *"
              required
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs text-gray-500 font-medium mr-1 py-1">Presets:</span>
              {CRON_PRESETS.map((preset) => (
                <button
                  key={preset.cron}
                  type="button"
                  className="px-3 py-1 text-xs font-medium bg-white/5 hover:bg-indigo-500/20 border border-white/5 hover:border-indigo-500/30 rounded-lg text-gray-400 hover:text-indigo-300 transition-all"
                  onClick={() => {
                    setCronExpression(preset.cron);
                    showToast(`Applied preset: ${preset.label}`, 'success');
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="requestBody" className="text-sm font-medium text-gray-300">Request Body JSON (Optional)</label>
          <textarea
            id="requestBody"
            placeholder='{ "ping": "keep-alive" }'
            value={requestBody}
            onChange={(e) => setRequestBody(e.target.value)}
            className="w-full px-4 py-3 h-32 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-y"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="expectedStructure" className="text-sm font-medium text-gray-300">Expected Response JSON (Optional)</label>
          <textarea
            id="expectedStructure"
            placeholder='{ "status": "ok" }'
            value={expectedStructure}
            onChange={(e) => setExpectedStructure(e.target.value)}
            className="w-full px-4 py-3 h-32 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-y"
          />
        </div>

        <div className="mt-4">
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {submitting ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update Monitor' : 'Create Monitor')}
          </button>
        </div>
      </form>
    </section>
  );
}

function normalizeJsonField(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
}

function formatJson(value) {
  return value === null ? '' : JSON.stringify(value, null, 2);
}

function parseJsonTextarea(value, label) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error(`${label} contains syntax issues (must be valid JSON).`);
  }
}
