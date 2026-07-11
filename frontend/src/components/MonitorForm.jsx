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

  const isEditing = editingMonitor !== null;

  useEffect(() => {
    if (editingMonitor) {
      setUrl(editingMonitor.url || '');
      setMethod((editingMonitor.method || 'GET').toUpperCase());
      setCronExpression(editingMonitor.cronExpression || '');
      setRequestBody(formatJson(normalizeJsonField(editingMonitor.requestBody)));
      setExpectedStructure(formatJson(normalizeJsonField(editingMonitor.expectedStructure)));
    }
  }, [editingMonitor]);

  function resetForm() {
    setUrl('');
    setMethod('GET');
    setCronExpression('');
    setRequestBody('');
    setExpectedStructure('');
  }

  function handleCancel() {
    resetForm();
    onCancelEdit();
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
      resetForm();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="form-title-heading">
      <div className="section-header">
        <h2 id="form-title">{isEditing ? 'Edit monitor' : 'Create monitor'}</h2>
        {isEditing && (
          <button className="button button-secondary" type="button" onClick={handleCancel}>
            <span>Cancel</span>
          </button>
        )}
      </div>

      <form className="monitor-form" autoComplete="off" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="url">Endpoint URL</label>
          <input
            id="url"
            name="url"
            type="url"
            placeholder="https://api.example.com/health"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="method">Method</label>
            <select id="method" name="method" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="cronExpression">Cron schedule</label>
            <input
              id="cronExpression"
              name="cronExpression"
              type="text"
              placeholder="0 */15 * * * *"
              required
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <span className="presets-label">Quick Presets</span>
          <div className="cron-presets" role="group" aria-label="Cron schedule presets">
            {CRON_PRESETS.map((preset) => (
              <button
                key={preset.cron}
                type="button"
                className="cron-preset-pill"
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

        <div className="field">
          <label htmlFor="requestBody">Request body JSON (Optional)</label>
          <textarea
            id="requestBody"
            name="requestBody"
            placeholder='{ "ping": "keep-alive" }'
            value={requestBody}
            onChange={(e) => setRequestBody(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="expectedStructure">Expected response JSON (Optional)</label>
          <textarea
            id="expectedStructure"
            name="expectedStructure"
            placeholder='{ "status": "ok" }'
            value={expectedStructure}
            onChange={(e) => setExpectedStructure(e.target.value)}
          />
        </div>

        <div className="form-actions">
          <button className="button button-primary" type="submit" disabled={submitting}>
            <span>{submitting ? (isEditing ? 'Updating...' : 'Saving...') : 'Save monitor'}</span>
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
