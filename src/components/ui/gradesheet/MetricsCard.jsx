export default function MetricsCard({ statisticsCards }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Metrics</h3>
      </div>
      <div className="p-5 grid grid-cols-2 gap-4">
        {statisticsCards.map((statCard) => (
          <div key={statCard.label} className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">{statCard.label}</div>
            <div className={`text-2xl font-bold font-mono tracking-tight leading-none ${statCard.color}`}>{statCard.value}</div>
            {statCard.sub && <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mt-1.5 font-mono">{statCard.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
