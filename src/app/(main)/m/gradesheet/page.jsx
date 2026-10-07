export const dynamic = "force-dynamic";

import MobileGradesheetAnalyzer from "@/components/gradesheet/mobile/MobileGradesheetAnalyzer";

export const metadata = {
  title: "Gradesheet Analyzer | Boracle Mobile",
  description:
    "Upload your BRACU grade sheet PDF to analyze your CGPA and plan retakes. 100% client-side — no login required.",
};

export default function MobileGradesheetPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* App-style header */}
      <header className="sticky top-0 z-20 backdrop-blur bg-white/80 dark:bg-gray-950/80 border-b border-gray-200/60 dark:border-gray-800/60">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900 dark:text-white">
            📊 Gradesheet Analyzer
          </h1>
          <a
            href="/gradesheet"
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 active:bg-blue-200 dark:active:bg-blue-900 transition-colors"
          >
            Desktop view
          </a>
        </div>
      </header>

      <MobileGradesheetAnalyzer />
    </div>
  );
}
