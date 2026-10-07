"use client";

export default function MobileTrajectory({ chartData, targetCgpaNumber }) {
  if (!chartData.length) return null;

  const H = 120; // plot height px
  const W = 300; // viewBox width
  const pad = 6;
  const max = 4.0;
  const n = chartData.length;
  const step = (W - pad * 2) / Math.max(1, n - 1);
  const barW = Math.min(28, ((W - pad * 2) / n) * 0.55);
  const y = (v) => H - (v / max) * (H - 10) - 2;

  const cgpaLine = chartData
    .map((d, i) => `${pad + i * step},${y(d.cumulativeCgpa)}`)
    .join(" ");

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-4">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Academic Trajectory</h3>

      <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full" role="img" aria-label="Semester GPA and cumulative CGPA chart">
        {[1, 2, 3, 4].map((g) => (
          <g key={g}>
            <line x1={0} x2={W} y1={y(g)} y2={y(g)} stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="1" strokeDasharray="3 3" />
            <text x={4} y={y(g) - 2} fontSize="8" className="fill-gray-400">{g.toFixed(1)}</text>
          </g>
        ))}

        {targetCgpaNumber > 0 && (
          <line x1={0} x2={W} y1={y(targetCgpaNumber)} y2={y(targetCgpaNumber)} stroke="#10b981" strokeWidth="1.5" strokeDasharray="5 4" />
        )}

        {chartData.map((d, i) => {
          const bx = pad + i * step - barW / 2;
          const by = y(d.semesterGpa);
          return (
            <rect
              key={i}
              x={bx}
              y={by}
              width={barW}
              height={H - by - 2}
              rx="3"
              fill="#93c5fd"
            />
          );
        })}

        <polyline points={cgpaLine} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {chartData.map((d, i) => (
          <circle key={i} cx={pad + i * step} cy={y(d.cumulativeCgpa)} r="3" fill="#fff" stroke="#2563eb" strokeWidth="2" />
        ))}

        {chartData.map((d, i) => (
          <text
            key={`l${i}`}
            x={pad + i * step}
            y={H + 16}
            fontSize="8"
            textAnchor="middle"
            className="fill-gray-500"
          >
            S{(d.name.match(/Sem (\d+)/)?.[1] || "?")}
          </text>
        ))}
      </svg>

      <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-300 inline-block" /> Sem GPA</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-blue-600 inline-block" /> CGPA</span>
        {targetCgpaNumber > 0 && (
          <span className="flex items-center gap-1"><span className="w-2.5 h-0.5 bg-emerald-500 inline-block" /> Target</span>
        )}
      </div>
    </div>
  );
}
