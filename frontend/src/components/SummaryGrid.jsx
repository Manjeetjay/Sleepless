const CustomServerIcon = (props) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M12 3c-4.97 0-9 1.79-9 4s4.03 4 9 4 9-1.79 9-4-4.03-4-9-4zm0 18c-4.97 0-9-1.79-9-4v-3.53c2.05 1.54 5.3 2.53 9 2.53s6.95-.99 9-2.53V17c0 2.21-4.03 4-9 4zm0-6.5c-4.97 0-9-1.79-9-4v-3.53c2.05 1.54 5.3 2.53 9 2.53s6.95-.99 9-2.53V10.5c0 2.21-4.03 4-9 4z"/>
  </svg>
);

const CustomSuccessIcon = (props) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
  </svg>
);

const CustomFailureIcon = (props) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M15.73 3H8.27L3 8.27v7.46L8.27 21h7.46L21 15.73V8.27L15.73 3zM12 17.3c-.72 0-1.3-.58-1.3-1.3 0-.72.58-1.3 1.3-1.3.72 0 1.3.58 1.3 1.3 0 .72-.58 1.3-1.3 1.3zm1-4.3h-2V7h2v6z"/>
  </svg>
);

const CustomActivityIcon = (props) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M16 6l-2.02 5.39L10.5 3 6.13 14H2v2h5.5l2.87-7.2L13.5 21l3.87-10H22v-2h-6z"/>
  </svg>
);

export default function SummaryGrid({ monitors, health }) {
  const total = monitors.length;
  const totalSuccess = monitors.reduce((sum, m) => sum + (m.successCount || 0), 0);
  const totalFailure = monitors.reduce((sum, m) => sum + (m.failureCount || 0), 0);

  const apiState = (() => {
    if (!health) return { label: 'Offline', color: 'text-rose-400' };
    if (health.status === '200') return { label: 'Online', color: 'text-emerald-400' };
    return { label: 'Warning', color: 'text-amber-400' };
  })();

  const cards = [
    {
      title: 'Total Monitors',
      value: total,
      icon: CustomServerIcon,
      iconColor: 'text-indigo-400',
      iconBg: 'bg-indigo-400/10',
      borderColor: 'border-indigo-500/20'
    },
    {
      title: 'Successful Pings',
      value: totalSuccess,
      icon: CustomSuccessIcon,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-400/10',
      borderColor: 'border-emerald-500/20'
    },
    {
      title: 'Failed Pings',
      value: totalFailure,
      icon: CustomFailureIcon,
      iconColor: 'text-rose-400',
      iconBg: 'bg-rose-400/10',
      borderColor: 'border-rose-500/20'
    },
    {
      title: 'API Health State',
      value: apiState.label,
      valueColor: apiState.color,
      icon: CustomActivityIcon,
      iconColor: 'text-sky-400',
      iconBg: 'bg-sky-400/10',
      borderColor: 'border-sky-500/20'
    }
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" aria-label="Dashboard Statistics Overview">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div key={i} className={`glass-card p-6 flex items-center gap-5 border ${card.borderColor}`}>
            <div className={`flex items-center justify-center w-14 h-14 rounded-2xl ${card.iconBg} ${card.iconColor}`}>
              <Icon className="w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <span className={`text-3xl font-bold tracking-tight ${card.valueColor || 'text-white'}`}>
                {card.value}
              </span>
              <span className="text-sm font-medium text-gray-400">{card.title}</span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
