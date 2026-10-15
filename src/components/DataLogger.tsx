import React, { useState, useEffect } from 'react';
import { Database, Download, Play, Square, Trash2, LineChart, CheckSquare, SlidersHorizontal } from 'lucide-react';
import { TelemetryData, TelemetryLogEntry } from '../types/telemetry';

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
  format: (val: number | null) => string;
}

const fmtOrNa = (val: number | null, fn: (v: number) => string): string => {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  return fn(val);
};

const LOG_PARAM_CATALOG: LogParamConfig[] = [
  { key: 'rpm', label: 'Στροφές (RPM 010C)', csvHeader: 'RPM (/min)', unit: '/min', groupTag: '010C', format: (v) => fmtOrNa(v, x => `${Math.round(x)}`) },
  { key: 'maf', label: 'Μάζα Αέρα (MAF 0110)', csvHeader: 'MAF (g/s)', unit: 'g/s', groupTag: '0110', format: (v) => fmtOrNa(v, x => x.toFixed(2)) },
  { key: 'engineLoad', label: 'Φορτίο Κινητήρα (0104)', csvHeader: 'Engine Load (%)', unit: '%', groupTag: '0104', format: (v) => fmtOrNa(v, x => `${x.toFixed(1)}%`) },
  { key: 'throttle', label: 'Πεταλούδα (0111)', csvHeader: 'Throttle (%)', unit: '%', groupTag: '0111', format: (v) => fmtOrNa(v, x => `${Math.round(x)}%`) },
  { key: 'timing', label: 'Αβάνς Ανάφλεξης (010E)', csvHeader: 'Ignition Timing (deg)', unit: '°', groupTag: '010E', format: (v) => fmtOrNa(v, x => `${x >= 0 ? '+' : ''}${x.toFixed(1)}°`) },
  { key: 'coolant', label: 'Θερμ. Ψυκτικού (0105)', csvHeader: 'Coolant Temp (C)', unit: '°C', groupTag: '0105', format: (v) => fmtOrNa(v, x => `${Math.round(x)}°C`) },
  { key: 'iat', label: 'Θερμ. Εισαγωγής IAT (010F)', csvHeader: 'IAT (C)', unit: '°C', groupTag: '010F', format: (v) => fmtOrNa(v, x => `${Math.round(x)}°C`) },
  { key: 'oilTemp', label: 'Θερμ. Λαδιού (015C)', csvHeader: 'Oil Temp (C)', unit: '°C', groupTag: '015C', format: (v) => fmtOrNa(v, x => `${Math.round(x)}°C`) },
  { key: 'oilPressure', label: 'Πίεση Λαδιού', csvHeader: 'Oil Pressure (bar)', unit: 'bar', groupTag: 'Sensor', format: (v) => fmtOrNa(v, x => `${x.toFixed(1)} bar`) },
  { key: 'stft', label: 'Διόρθωση STFT (0106)', csvHeader: 'STFT (%)', unit: '%', groupTag: '0106', format: (v) => fmtOrNa(v, x => `${x >= 0 ? '+' : ''}${x.toFixed(1)}%`) },
  { key: 'ltft', label: 'Διόρθωση LTFT (0107)', csvHeader: 'LTFT (%)', unit: '%', groupTag: '0107', format: (v) => fmtOrNa(v, x => `${x >= 0 ? '+' : ''}${x.toFixed(1)}%`) },
  { key: 'lambda', label: 'Lambda Actual (0124)', csvHeader: 'Lambda Actual', unit: 'λ', groupTag: '0124', format: (v) => fmtOrNa(v, x => x.toFixed(3)) },
  { key: 'lambdaSpecified', label: 'Lambda Specified (0144)', csvHeader: 'Lambda Specified', unit: 'λ', groupTag: '0144', format: (v) => fmtOrNa(v, x => x.toFixed(3)) },
  { key: 'afr', label: 'Αναλογία Αέρα/Καυσίμου (AFR)', csvHeader: 'AFR', unit: ':1', groupTag: '0124', format: (v) => fmtOrNa(v, x => x.toFixed(1)) },
  { key: 'o2After', label: 'Αισθητήρας O2 B1S2 (0115)', csvHeader: 'O2 After Cat (V)', unit: 'V', groupTag: '0115', format: (v) => fmtOrNa(v, x => `${x.toFixed(3)} V`) },
  { key: 'speed', label: 'Ταχύτητα Οχήματος (010D)', csvHeader: 'Speed (km/h)', unit: 'km/h', groupTag: '010D', format: (v) => fmtOrNa(v, x => `${Math.round(x)} km/h`) },
  { key: 'battery', label: 'Τάση Μπαταρίας (ATRV)', csvHeader: 'Battery (V)', unit: 'V', groupTag: 'ATRV', format: (v) => fmtOrNa(v, x => `${x.toFixed(1)} V`) },
  { key: 'boostBar', label: 'Πίεση Τούρμπο (010B)', csvHeader: 'Boost (bar)', unit: 'bar', groupTag: '010B', format: (v) => fmtOrNa(v, x => `${x >= 0 ? '+' : ''}${x.toFixed(2)}`) },
  { key: 'actualBoostMbar', label: 'MAP Πίεση (010B mbar)', csvHeader: 'MAP Actual (mbar)', unit: 'mbar', groupTag: '010B', format: (v) => fmtOrNa(v, x => `${Math.round(x)}`) },
  { key: 'specifiedBoostMbar', label: 'Boost Specified (KWP 115)', csvHeader: 'Boost Specified (mbar)', unit: 'mbar', groupTag: 'KWP 115', format: (v) => fmtOrNa(v, x => `${Math.round(x)}`) },
  { key: 'injectionTime', label: 'Χρόνος Ψεκασμού (KWP 002)', csvHeader: 'Injection Time (ms)', unit: 'ms', groupTag: 'KWP 002', format: (v) => fmtOrNa(v, x => `${x.toFixed(2)} ms`) },
  { key: 'knockMax', label: 'Max Knock Retard (KWP 020)', csvHeader: 'Max Knock (CF deg)', unit: '°', groupTag: 'KWP 020', format: (v) => fmtOrNa(v, x => `${x.toFixed(1)}°`) },
  { key: 'knockCyl1', label: 'Knock Κύλινδρος 1 (KWP 020)', csvHeader: 'Knock Cyl 1 (CF)', unit: '°', groupTag: 'KWP 020', format: (v) => fmtOrNa(v, x => `${x.toFixed(1)}°`) },
  { key: 'knockCyl2', label: 'Knock Κύλινδρος 2 (KWP 020)', csvHeader: 'Knock Cyl 2 (CF)', unit: '°', groupTag: 'KWP 020', format: (v) => fmtOrNa(v, x => `${x.toFixed(1)}°`) },
  { key: 'knockCyl3', label: 'Knock Κύλινδρος 3 (KWP 020)', csvHeader: 'Knock Cyl 3 (CF)', unit: '°', groupTag: 'KWP 020', format: (v) => fmtOrNa(v, x => `${x.toFixed(1)}°`) },
  { key: 'knockCyl4', label: 'Knock Κύλινδρος 4 (KWP 020)', csvHeader: 'Knock Cyl 4 (CF)', unit: '°', groupTag: 'KWP 020', format: (v) => fmtOrNa(v, x => `${x.toFixed(1)}°`) },
  { key: 'n75', label: 'N75 Duty Cycle (KWP 118)', csvHeader: 'N75 Duty (%)', unit: '%', groupTag: 'KWP 118', format: (v) => fmtOrNa(v, x => `${Math.round(x)}%`) },
  { key: 'hp', label: 'Ιπποδύναμη (KWP 120)', csvHeader: 'Power (HP)', unit: 'HP', groupTag: 'KWP 120', format: (v) => fmtOrNa(v, x => `${Math.round(x)} HP`) },
];

const DEFAULT_SELECTED_KEYS: LogParamKey[] = [
  'rpm',
  'maf',
  'engineLoad',
  'throttle',
  'timing',
  'coolant',
  'iat',
  'stft',
  'ltft',
  'lambda',
];

export const DataLogger: React.FC<Props> = ({ telemetry }) => {
  const [isLogging, setIsLogging] = useState(false);
  const [logEntries, setLogEntries] = useState<TelemetryLogEntry[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<LogParamKey[]>(DEFAULT_SELECTED_KEYS);
  const [showSelector, setShowSelector] = useState<boolean>(true);

  const buildSnapshotFromTelemetry = (t: TelemetryData): TelemetryLogEntry => {
    const validKnocks = t.knockRetard.filter((v): v is number => v !== null);
    const knockMax = validKnocks.length > 0 ? Math.max(...validKnocks) : null;
    const actualBoostMbar = t.boostBar !== null ? Math.round((t.boostBar + 1.013) * 1000) : null;

    return {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 2 }),
      rpm: t.rpm,
      speed: t.speed,
      boostBar: t.boostBar,
      specifiedBoostMbar: t.boostSpecifiedMbar ?? null,
      actualBoostMbar,
      maf: t.mafGramsPerSec,
      engineLoad: t.engineLoad,
      throttle: t.throttlePosition,
      injectionTime: t.injectionTimeMs,
      lambda: t.lambda,
      lambdaSpecified: t.lambdaSpecified,
      afr: t.afr,
      stft: t.shortTermFuelTrim,
      ltft: t.longTermFuelTrim,
      o2After: t.o2SensorAfterVoltage,
      timing: t.ignitionTiming,
      knockMax,
      knockCyl1: t.knockRetard[0],
      knockCyl2: t.knockRetard[1],
      knockCyl3: t.knockRetard[2],
      knockCyl4: t.knockRetard[3],
      iat: t.iat,
      coolant: t.coolantTemp,
      oilTemp: t.oilTemp,
      oilPressure: t.oilPressure,
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
        if (prev.length <= 1) return prev;
        return prev.filter(k => k !== key);
      }
      return [...prev, key];
    });
  };

  const handleSelectAll = () => {
    setSelectedKeys(availableConfigs.map(c => c.key));
  };

  const handleSelectObdRealPreset = () => {
    setSelectedKeys(availableConfigs.filter(c => ['rpm', 'maf', 'engineLoad', 'throttle', 'timing', 'coolant', 'iat', 'stft', 'ltft', 'lambda', 'o2After', 'speed', 'battery'].includes(c.key)).map(c => c.key));
  };

  const currentLiveSnapshot = buildSnapshotFromTelemetry(telemetry);
  // Hide sensors that are unavailable, but do not confuse a valid zero with N/A.
  // Preserve a channel if it has ever supplied valid data in this recording.
  const availableConfigs = LOG_PARAM_CATALOG.filter(c => {
    const value = currentLiveSnapshot[c.key];
    return (typeof value === 'number' && Number.isFinite(value)) ||
      logEntries.some(entry => typeof entry[c.key] === 'number' && Number.isFinite(entry[c.key] as number));
  });
  const activeConfigs = availableConfigs.filter(c => selectedKeys.includes(c.key));

  const handleDownloadCsv = () => {
    if (logEntries.length === 0) return;

    const headers = ['Time', ...activeConfigs.map(c => c.csvHeader)];
    const rows = [...logEntries].reverse().map(e => [
      e.time,
      ...activeConfigs.map(c => (e[c.key] !== null && e[c.key] !== undefined ? e[c.key] : 'N/A')),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audi_BFB_RealLog_${new Date().toISOString().slice(0, 10)}.csv`);
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
              Καταγραφή Πραγματικής Τηλεμετρίας (ECU Datalogger)
            </h3>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              isLogging ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' : 'bg-slate-800 text-slate-400'
            }`}>
              {isLogging ? 'REC • LIVE' : 'IDLE'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Εμφανίζονται μόνο διαθέσιμες παράμετροι. Οι αισθητήρες με N/A αποκρύπτονται αυτόματα από τη λίστα και την καταγραφή.
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
            <span>Λίστα Παραμέτρων ({activeConfigs.length}/{availableConfigs.length})</span>
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
                Επιλογή Παραμέτρων προς Καταγραφή ({activeConfigs.length} επιλεγμένα)
              </h4>
            </div>
            <div className="flex items-center flex-wrap gap-1.5 text-[11px]">
              <button
                onClick={handleSelectObdRealPreset}
                className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-semibold transition cursor-pointer"
              >
                Πραγματικοί Αισθητήρες OBD-II Mode 01
              </button>
              <button
                onClick={handleSelectAll}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
              >
                Επιλογή Όλων ({availableConfigs.length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {availableConfigs.map((param) => {
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
                          {param.groupTag}
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
          Ζωντανή Καμπύλη Στροφών RPM (Τελευταία 30 δείγματα)
        </h4>
        <div className="h-28 w-full flex items-end gap-1 pt-4 pb-1 border-b border-slate-800">
          {logEntries.slice(0, 30).reverse().map((entry, idx) => {
            const rpmVal = entry.rpm ?? 0;
            const rpmHeight = Math.max(4, Math.min(100, (rpmVal / 7000) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div
                  className="w-full rounded-t transition-all bg-blue-500"
                  style={{ height: `${rpmHeight}%` }}
                />
                <div className="hidden group-hover:block absolute bottom-full mb-1 z-20 bg-slate-950 border border-slate-700 p-1.5 rounded text-[10px] font-mono text-white whitespace-nowrap shadow-xl">
                  RPM: {entry.rpm ?? 'N/A'} | MAF: {entry.maf ?? 'N/A'} g/s | Load: {entry.engineLoad ?? 'N/A'}%
                </div>
              </div>
            );
          })}
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
                      return (
                        <td
                          key={cfg.key}
                          className={`py-1.5 pr-3 whitespace-nowrap ${
                            val === null ? 'text-slate-500' : cfg.key === 'rpm' ? 'text-white font-bold' : ''
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
