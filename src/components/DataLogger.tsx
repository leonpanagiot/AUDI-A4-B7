import React, { useState, useEffect } from 'react';
import { Database, Download, Play, Square, Trash2, LineChart } from 'lucide-react';
import { TelemetryData, TelemetryLogEntry } from '../types/telemetry';

interface Props {
  telemetry: TelemetryData;
}

export const DataLogger: React.FC<Props> = ({ telemetry }) => {
  const [isLogging, setIsLogging] = useState(false);
  const [logEntries, setLogEntries] = useState<TelemetryLogEntry[]>([]);

  useEffect(() => {
    if (!isLogging) return;

    const entry: TelemetryLogEntry = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 2 }),
      rpm: telemetry.rpm,
      speed: telemetry.speed,
      boostBar: telemetry.boostBar,
      maf: telemetry.mafGramsPerSec,
      afr: telemetry.afr,
      timing: telemetry.ignitionTiming,
      knockMax: Math.max(...telemetry.knockRetard),
      iat: telemetry.iat,
    };

    setLogEntries(prev => [entry, ...prev.slice(0, 199)]);
  }, [telemetry, isLogging]);

  const handleDownloadCsv = () => {
    if (logEntries.length === 0) return;

    const headers = ['Time', 'RPM', 'Speed (km/h)', 'Boost (bar)', 'MAF (g/s)', 'AFR', 'Timing (deg)', 'Max Knock (CF)', 'IAT (C)'];
    const rows = [...logEntries].reverse().map(e => [
      e.time,
      e.rpm,
      e.speed,
      e.boostBar,
      e.maf,
      e.afr,
      e.timing,
      e.knockMax,
      e.iat,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audi_BFB_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClear = () => {
    setLogEntries([]);
  };

  return (
    <div className="space-y-4">
      {/* Control bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              Καταγραφη Τηλεμετριας (ECU Datalogger)
            </h3>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              isLogging ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' : 'bg-slate-800 text-slate-400'
            }`}>
              {isLogging ? 'REC • 10 HZ' : 'IDLE'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Καταγραφή πραγματικών τιμών για ρύθμιση προγράμματος (Tuning log: Boost, MAF, AFR, Knock Retard).
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsLogging(!isLogging)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer ${
              isLogging
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/30'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30'
            }`}
          >
            {isLogging ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>Διακοπή REC</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Έναρξη REC</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadCsv}
            disabled={logEntries.length === 0}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md shadow-blue-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Εξαγωγή CSV ({logEntries.length})</span>
          </button>

          {logEntries.length > 0 && (
            <button
              onClick={handleClear}
              className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              title="Καθαρισμός λίστας"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mini graphical visualizer of recent 20 samples */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <LineChart className="w-4 h-4 text-emerald-400" />
          Ζωντανή Καμπύλη Πίεσης &amp; RPM (Τελευταία δείγματα)
        </h4>
        <div className="h-28 w-full flex items-end gap-1 pt-4 pb-1 border-b border-slate-800">
          {logEntries.slice(0, 30).reverse().map((entry, idx) => {
            const boostHeight = Math.max(5, Math.min(100, ((entry.boostBar + 1) / 3.5) * 100));
            const isKnock = entry.knockMax > 2;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div
                  className={`w-full rounded-t transition-all ${
                    isKnock ? 'bg-rose-500' : entry.boostBar > 0.8 ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ height: `${boostHeight}%` }}
                />
                <div className="hidden group-hover:block absolute bottom-full mb-1 z-20 bg-slate-950 border border-slate-700 p-1.5 rounded text-[10px] font-mono text-white whitespace-nowrap shadow-xl">
                  {entry.boostBar} bar | {entry.rpm} RPM | {entry.maf} g/s
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1.5">
          <span>-1.0 BAR</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Υποπίεση</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Boost</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Knock &gt; 2°</span>
          </span>
          <span>+2.5 BAR</span>
        </div>
      </div>

      {/* Real-time Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md overflow-hidden">
        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs font-mono">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="pb-2 font-semibold">Ώρα</th>
                <th className="pb-2 font-semibold">RPM</th>
                <th className="pb-2 font-semibold">Ταχύτητα</th>
                <th className="pb-2 font-semibold">Boost (bar)</th>
                <th className="pb-2 font-semibold">MAF (g/s)</th>
                <th className="pb-2 font-semibold">AFR</th>
                <th className="pb-2 font-semibold">Timing</th>
                <th className="pb-2 font-semibold">Knock Max</th>
                <th className="pb-2 font-semibold">IAT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-400 font-sans">
                    Πατήστε <strong>«Έναρξη REC»</strong> για να ξεκινήσει η καταγραφή των τιμών τηλεμετρίας.
                  </td>
                </tr>
              ) : (
                logEntries.map((e, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition text-slate-300">
                    <td className="py-1.5 text-slate-400">{e.time}</td>
                    <td className="py-1.5 text-white font-bold">{e.rpm}</td>
                    <td className="py-1.5">{e.speed} km/h</td>
                    <td className={`py-1.5 font-bold ${e.boostBar > 0.8 ? 'text-red-400' : 'text-blue-400'}`}>
                      {e.boostBar >= 0 ? `+${e.boostBar.toFixed(2)}` : e.boostBar.toFixed(2)}
                    </td>
                    <td className="py-1.5 text-blue-300">{e.maf.toFixed(1)}</td>
                    <td className="py-1.5">{e.afr.toFixed(1)}</td>
                    <td className="py-1.5">{e.timing.toFixed(1)}°</td>
                    <td className={`py-1.5 font-bold ${e.knockMax > 2 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {e.knockMax.toFixed(1)}°
                    </td>
                    <td className="py-1.5">{e.iat}°C</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
