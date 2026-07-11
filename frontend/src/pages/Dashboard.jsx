import SummaryGrid from '../components/SummaryGrid';
import MonitorList from '../components/MonitorList';

export default function Dashboard({ monitors, health, loading, error, onDelete }) {
  return (
    <main className="flex flex-col gap-10 animate-[fadeIn_0.4s_ease-out_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
      <SummaryGrid monitors={monitors} health={health} />
      <MonitorList
        monitors={monitors}
        loading={loading}
        error={error}
        onDelete={onDelete}
      />
    </main>
  );
}
