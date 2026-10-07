"use client";
import { useState } from "react";
import { Upload, FileCheck2, Loader2, Trash2, CloudDownload } from "lucide-react";

export default function MobileUploadCard({ courses, lastParsedSemester, loading, onFileUpload, onResetSheet, savedAt }) {
  const [dragOver, setDragOver] = useState(false);

  const openPicker = () => document.getElementById("m-gradesheet-file-input")?.click();

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFileUpload(file);
    e.target.value = "";
  };

  return (
    <>
      {courses.length === 0 ? (
        <div
          onClick={openPicker}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) onFileUpload(file);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          role="button"
          tabIndex={0}
          className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-3xl transition-colors ${
            dragOver
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-blue-300 dark:border-blue-800 bg-white/60 dark:bg-gray-900/50"
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Upload className="w-7 h-7" />}
          </div>
          <div className="text-center">
            <div className="text-base font-bold text-gray-900 dark:text-white">
              {loading ? "Processing…" : "Upload Grade Sheet"}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              BRACU unofficial transcript PDF — stays on your device
            </div>
          </div>
          <span className="px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wider uppercase">
            PDF
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 border border-blue-200 dark:border-blue-800 rounded-2xl bg-blue-50/40 dark:bg-blue-900/10">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {courses.length} courses loaded
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {lastParsedSemester ? `Till ${lastParsedSemester}` : "No semester data"}
              {savedAt ? ` · saved locally` : ""}
            </div>
          </div>
          <button
            onClick={openPicker}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-2.5 text-xs font-semibold rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 active:bg-blue-100 dark:active:bg-blue-900/40 transition-colors disabled:opacity-50"
          >
            <CloudDownload className="w-3.5 h-3.5" /> Reupload
          </button>
          <button
            onClick={onResetSheet}
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-gray-900 text-red-500 dark:text-red-400 active:bg-red-50 dark:active:bg-red-900/30 transition-colors"
            aria-label="Clear gradesheet"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      <input
        id="m-gradesheet-file-input"
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleChange}
      />
    </>
  );
}
