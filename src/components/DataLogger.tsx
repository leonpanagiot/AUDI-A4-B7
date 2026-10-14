import React, { useState, useEffect } from 'react';
import { Database, Download, Play, Square, Trash2, LineChart, CheckSquare, SlidersHorizontal } from 'lucide-react';
import { TelemetryData, TelemetryLogEntry } from '../types/telemetry';
import { obdEngine, ENGINE_STAGES } from '../services/obdService';

interface Props {
  telemetry: TelemetryData;
}

export type LogParamKey = Exclude<keyof TelemetryLogEntry, 'time'>;

interface LogParamConfig {
  key: LogParamKey;
  label: string;
  csvHeader: string;
  unit: string;
  groupTag?: string;
  format: (val: number) => string;
}

const LOG_PARAM_CATALOG: LogParamConfig[] = [
  { key: 'rpm', label: 'Στροφές (RPM)', csvHeader: 'RPM (/min)', unit: '/min', groupTag: '002', format: (v) => `${Math.round(v)}` },
  { key: 'boostBar', label: 'Πίεση Τούρμπο (Boost)', csvHeader: 'Boost (bar)', unit: 'bar', groupTag: '115', format: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}` },
  { key: 'specifiedBoostMbar', label: 'Boost Specified', csvHeader: 'Boost Specified (mbar)', unit: 'mbar', groupTag: '115', format: (v) => `${Math.round(v)}` },
  { key: 'actualBoostMbar', label: 'Boost Actual', csvHeader: 'Boost Actual (mbar)', unit: 'mbar', groupTag: '115', format: (v) => `${Math.round(v)}` },
  { key: 'maf', label: 'Μάζα Αέρα (MAF G70)', csvHeader: 'MAF (g/s)', unit: 'g/s', groupTag: '002', format: (v) => v.toFixed(2) },
  { key: 'engineLoad', label: 'Φορτίο Κινητήρα (Load)', csvHeader: 'Engine Load (%)', unit: '%', groupTag: '002', format: (v) => `${v.toFixed(1)}%` },
  { key: 'throttle', label: 'Πεταλούδα (Throttle)', csvHeader: 'Throttle (%)', unit: '%', groupTag: '003', format: (v) => `${Math.round(v)}%` },
  { key: 'injectionTime', label: 'Χρόνος Ψεκασμού (Inj. Time)', csvHeader: 'Injection Time (ms)', unit: 'ms', groupTag: '002', format: (v) => `${v.toFixed(2)} ms` },
  { key: 'lambda', label: 'Lambda Actual (B1S1)', csvHeader: 'Lambda Actual', unit: 'λ', groupTag: '031', format: (v) => v.toFixed(3) },
  { key: 'lambdaSpecified', label: 'Lambda Specified', csvHeader: 'Lambda Specified', unit: 'λ', groupTag: '031', format: (v) => v.toFixed(3) },
  { key: 'afr', label: 'Αναλογία Αέρα/Καυσίμου (AFR)', csvHeader: 'AFR', unit: ':1', groupTag: '031', format: (v) => v.toFixed(1) },
  { key: 'stft', label: 'Διόρθωση STFT (Short Trim)', csvHeader: 'STFT (%)', unit: '%', groupTag: '032', format: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` },
  { key: 'ltft', label: 'Διόρθωση LTFT (Long Trim)', csvHeader: 'LTFT (%)', unit: '%', groupTag: '032', format: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` },
  { key: 'o2After', label: 'Αισθητήρας O2 After Cat', csvHeader: 'O2 After Cat (V)', unit: 'V', groupTag: '031', format: (v) => `${v.toFixed(3)} V` },
  { key: 'timing', label: 'Αβάνς Ανάφλεξης (Timing)', csvHeader: 'Ignition Timing (deg)', unit: '°', groupTag: '003', format: (v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}°` },
  { key: 'knockMax', label: 'Μέγιστο Knock Retard (Max CF)', csvHeader: 'Max Knock (CF deg)', unit: '°', groupTag: '020', format: (v) => `${v.toFixed(1)}°` },
  { key: 'knockCyl1', label: 'Knock Retard Κύλινδρος 1', csvHeader: 'Knock Cyl 1 (CF)', unit: '°', groupTag: '020', format: (v) => `${v.toFixed(1)}°` },
  { key: 'knockCyl2', label: 'Knock Retard Κύλινδρος 2', csvHeader: 'Knock Cyl 2 (CF)', unit: '°', groupTag: '020', format: (v) => `${v.toFixed(1)}°` },
  { key: 'knockCyl3', label: 'Knock Retard Κύλινδρος 3', csvHeader: 'Knock Cyl 3 (CF)', unit: '°', groupTag: '020', format: (v) => `${v.toFixed(1)}°` },
  { key: 'knockCyl4', label: 'Knock Retard Κύλινδρος 4', csvHeader: 'Knock Cyl 4 (CF)', unit: '°', groupTag: '020', format: (v) => `${v.toFixed(1)}°` },
  { key: 'iat', label: 'Θερμοκρασία Εισαγωγής (IAT)', csvHeader: 'IAT (C)', unit: '°C', groupTag: '118', format: (v) => `${Math.round(v)}°C` },
  { key: 'coolant', label: 'Θερμοκρασία Ψυκτικού (G62)', csvHeader: 'Coolant Temp (C)', unit: '°C', groupTag: '001', format: (v) => `${Math.round(v)}°C` },
  { key: 'n75', label: 'Βαλβίδα N75 Duty Cycle', csvHeader: 'N75 Duty (%)', unit: '%', groupTag: '118', format: (v) => `${Math.round(v)}%` },
  { key: 'speed', label: 'Ταχύτητα Οχήματος', csvHeader: 'Speed (km/h)', unit: 'km/h', groupTag: '005', format: (v) => `${Math.round(v)} km/h` },
  { key: 'hp', label: 'Εκτιμώμενη Ιπποδύναμη (BHP)', csvHeader: 'Estimated BHP', unit: 'HP', groupTag: '120', format: (v) => `${Math.round(v)} HP` },
  { key: 'battery', label: 'Τάση Μπαταρίας / ECU', csvHeader: 'Battery (V)', unit: 'V', groupTag: '004', format: (v) => `${v.toFixed(1)} V` },
];

const DEFAULT_SELECTED_KEYS: LogParamKey[] = [
  'rpm',
  'boostBar',
  'maf',
  'injectionTime',
  'lambda',
  'timing',
  'knockMax',
  'iat',
];

export const DataLogger: React.FC<Props> = ({ telemetry }) => {
  const [isLogging, setIsLogging] = useState(false);
  const [logEntries, setLogEntries] = useState<TelemetryLogEntry[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<LogParamKey[]>(DEFAULT_SELECTED_KEYS);
  const [showSelector, setShowSelector] = useState<boolean>(true);

  const buildSnapshotFromTelemetry = (t: TelemetryData): TelemetryLogEntry => {
    const stage = ENGINE_STAGES[obdEngine.getCurrentStage()];
    const loadPct = t.engineLoad || 0;
    const isRunning = t.rpm > 350;
    const demandFactor = Math.max(
      t.throttlePosition > 10 ? (t.throttlePosition - 10) / 85 : 0,
      loadPct > 25 ? (loadPct - 25) / 75 : 0
    );
    const targetBoostBar = isRunning ? (stage.maxBoostBar * Math.min(1, demandFactor)) : 0;
    const specifiedBoostMbar = isRunning ? Math.round(1013 + targetBoostBar * 1000) : 1013;
    const actualBoostMbar = isRunning ? Math.round(1013 + t.boostBar * 1000) : 1013;

    return {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 2 }),
      rpm: t.rpm,
      speed: t.speed,
      boostBar: t.boostBar,
      specifiedBoostMbar,
      actualBoostMbar,
      maf: t.mafGramsPerSec,
      engineLoad: t.engineLoad || 0,
      throttle: t.throttlePosition,
      injectionTime: t.injectionTimeMs || 0,
      lambda: t.lambda,
      lambdaSpecified: t.lambdaSpecified || 0,
      afr: t.afr,
      stft: t.shortTermFuelTrim || 0,
      ltft: t.longTermFuelTrim || 0,
      o2After: t.o2SensorAfterVoltage || 0,
      timing: t.ignitionTiming,
      knockMax: Math.max(...t.knockRetard),
      knockCyl1: t.knockRetard[0],
      knockCyl2: t.knockRetard[1],
      knockCyl3: t.knockRetard[2],
      knockCyl4: t.knockRetard[3],
      iat: t.iat,
      coolant: t.coolantTemp,
      n75: t.n75DutyCycle,
      hp: t.calculatedHp,
      battery: t.batteryVoltage,
    };
  };

  useEffect(() => {
    if (!isLogging) return;
    const entry = buildSnapshotFromTelemetry(telemetry);
    setLogEntries(prev => [entry, ...prev.slice(0, 299)]);
  }, [telemetry, isLogging]);

  const toggleParam = (key: LogParamKey) => {
    setSelectedKeys(prev => {
      if (prev.includes(key)) {
        if (prev.length <= 1) return prev; // Keep at least 1 column
        return prev.filter(k => k !== key);
      }
      return [...prev, key];
    });
  };

  const handleSelectAll = () => {
    setSelectedKeys(LOG_PARAM_CATALOG.map(c => c.key));
  };

  const handleSelectTuningPreset = () => {
    setSelectedKeys(['rpm', 'boostBar', 'specifiedBoostMbar', 'actualBoostMbar', 'maf', 'injectionTime', 'lambda', 'timing', 'knockMax', 'iat']);
  };

  const handleSelectKnockPreset = () => {
    setSelectedKeys(['rpm', 'engineLoad', 'timing', 'knockCyl1', 'knockCyl2', 'knockCyl3', 'knockCyl4', 'iat', 'lambda']);
  };

  const activeConfigs = LOG_PARAM_CATALOG.filter(c => selectedKeys.includes(c.key));
  const currentLiveSnapshot = buildSnapshotFromTelemetry(telemetry);

  const handleDownloadCsv = () => {
    if (logEntries.length === 0) return;

    const headers = ['Time', ...activeConfigs.map(c => c.csvHeader)];
    const rows = [...logEntries].reverse().map(e => [
      e.time,
      ...activeConfigs.map(c => e[c.key]),
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
              Καταγραφή Τηλεμετρίας (ECU Datalogger)
            </h3>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              isLogging ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' : 'bg-slate-800 text-slate-400'
            }`}>
              {isLogging ? 'REC • LIVE' : 'IDLE'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Επιλέξτε από τη λίστα παρακάτω ποια κανάλια της ECU θέλετε να καταγράψετε και να εξάγετε σε CSV.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowSelector(!showSelector)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
              showSelector
                ? 'bg-slate-800 text-blue-300 border-blue-500/40'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-blue-400" />
            <span>Λίστα Παραμέτρων ({selectedKeys.length}/{LOG_PARAM_CATALOG.length})</span>
          </button>

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

      {/* Custom Parameter Selector Checklist */}
      {showSelector && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Επιλογή Παραμέτρων προς Καταγραφή ({selectedKeys.length} επιλεγμένα)
              </h4>
            </div>
            <div className="flex items-center flex-wrap gap-1.5 text-[11px]">
              <button
                onClick={handleSelectTuningPreset}
                className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-semibold transition cursor-pointer"
              >
                Προεπιλογή Stage Tuning (115+002+031)
              </button>
              <button
                onClick={handleSelectKnockPreset}
                className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-semibold transition cursor-pointer"
              >
                Προεπιλογή Knock Retard (Grp 020)
              </button>
              <button
                onClick={handleSelectAll}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
              >
                Επιλογή Όλων ({LOG_PARAM_CATALOG.length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {LOG_PARAM_CATALOG.map((param) => {
              const checked = selectedKeys.includes(param.key);
              const liveVal = currentLiveSnapshot[param.key];
              return (
                <button
                  key={param.key}
                  type="button"
                  onClick={() => toggleParam(param.key)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition cursor-pointer ${
                    checked
                      ? 'bg-blue-950/40 border-blue-500/60 text-white shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                        checked
                          ? 'bg-blue-600 border-blue-400 text-white'
                          : 'bg-slate-900 border-slate-700'
                      }`}
                    >
                      {checked && <span className="text-[10px] font-black">✓</span>}
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-semibold block truncate">{param.label}</span>
                      {param.groupTag && (
                        <span className="text-[9px] font-mono text-slate-400">
                          VAG Grp {param.groupTag}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-300 shrink-0">
                    {param.format(liveVal)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mini graphical visualizer of recent 30 samples */}
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
                  {entry.boostBar} bar | {entry.rpm} RPM | {entry.maf} g/s | CF: {entry.knockMax.toFixed(1)}°
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

      {/* Real-time Table with User-Selected Columns */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md overflow-hidden">
        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left text-xs font-mono">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="pb-2 pr-3 font-semibold whitespace-nowrap">Ώρα</th>
                {activeConfigs.map(cfg => (
                  <th key={cfg.key} className="pb-2 pr-3 font-semibold whitespace-nowrap">
                    {cfg.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logEntries.length === 0 ? (
                <tr>
                  <td colSpan={activeConfigs.length + 1} className="py-6 text-center text-slate-400 font-sans">
                    Επιλέξτε τις παραμέτρους που θέλετε από τη λίστα και πατήστε <strong>«Έναρξη REC»</strong> για ζωντανή καταγραφή.
                  </td>
                </tr>
              ) : (
                logEntries.map((e, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition text-slate-300">
                    <td className="py-1.5 pr-3 text-slate-400 whitespace-nowrap">{e.time}</td>
                    {activeConfigs.map(cfg => {
                      const val = e[cfg.key];
                      const isHighKnock = cfg.key.startsWith('knock') && val > 2.5;
                      const isHighBoost = cfg.key === 'boostBar' && val > 0.8;
                      return (
                        <td
                          key={cfg.key}
                          className={`py-1.5 pr-3 whitespace-nowrap ${
                            isHighKnock
                              ? 'text-rose-400 font-bold'
                              : isHighBoost
                              ? 'text-red-400 font-bold'
                              : cfg.key === 'rpm'
                              ? 'text-white font-bold'
                              : ''
                          }`}
                        >
                          {cfg.format(val)}
                        </td>
                      );
                    })}
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
