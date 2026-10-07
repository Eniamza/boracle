"use client";

export default function MobileMetrics({ statisticsCards }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {statisticsCards.map((statCard) => (
        <div
          key={statCard.label}
          className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm"
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
            {statCard.label}
          </div>
          <div className={`text-2xl font-bold font-mono tracking-tight leading-none ${statCard.color}`}>
            {statCard.value}
          </div>
          {statCard.sub && (
            <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500 mt-1.5 font-mono">
              {statCard.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
