import { useNavigate, useParams } from 'react-router-dom';
import MonitorForm from '../components/MonitorForm';

export default function ManageMonitor({ monitors = [], onSubmit }) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Find monitor if editing
  const editingMonitor = id ? monitors.find(m => m.id === parseInt(id, 10)) : null;

  async function handleSubmit(payload, monitorId) {
    const success = await onSubmit(payload, monitorId);
    if (success) {
      navigate('/');
    }
  }

  function handleCancel() {
    navigate('/');
  }

  return (
    <main className="max-w-3xl mx-auto w-full animate-[fadeIn_0.4s_ease-out_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
      <MonitorForm 
        editingMonitor={editingMonitor} 
        onSubmit={(payload) => handleSubmit(payload, id)} 
        onCancelEdit={handleCancel} 
      />
    </main>
  );
}
