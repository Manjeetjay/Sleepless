import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchHealth() {
  const { data } = await API.get('/api/health');
  return data;
}

export async function fetchMonitors() {
  const { data } = await API.get('/api/monitors');
  return data;
}

export async function createMonitor(payload) {
  const { data } = await API.post('/api/monitors', payload);
  return data;
}

export async function updateMonitor(id, payload) {
  const { data } = await API.put(`/api/monitors/${id}`, payload);
  return data;
}

export async function deleteMonitor(id) {
  const { data } = await API.delete(`/api/monitors/${id}`);
  return data;
}
