import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Activity,
  RefreshCw,
  Copy,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Send,
  Cpu,
  Radio,
  Trash2,
  Zap,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { obdEngine, ObdDebugState, PidDebugEntry } from '../services/obdService';

export const ObdDebugPanel: React.FC = () => {
  const [debug, setDebug] = useState<ObdDebugState>(obdEngine.getDebugState());
  const [customCmd, setCustomCmd] = useState('');
  const [isRunningSweep, setIsRunningSweep] = useState(false);
  const [isScanningAll, setIsScanningAll] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [isForcingProto, setIsForcingProto] = useState<string | null>(null);
  const [isProbingG266, setIsProbingG266] = useState(false);
  const [isTestingVag, setIsTestingVag] = useState(false);
  const [vagTestResult, setVagTestResult] = useState('');
  const [copiedReport, setCopiedReport] = useState(false);
  const [testingPid, setTestingPid] = useState<string | null>(null);

  useEffect(() => {
    const unsub = obdEngine.subscribe({
      onTelemetry: () => {},
      onStatusChange: () => {},
      onError: () => {},
      onDebugUpdate: (newDebug) => {
        setDebug({ ...newDebug });
      }
    });
    return () => unsub();
  }, []);

  const handleSendManual = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customCmd.trim()) return;
    const cmdToSend = customCmd.trim().toUpperCase();
    setCustomCmd('');
    await obdEngine.sendManualDebugCommand(cmdToSend);
  };

  const handleQuickCmd = async (cmd: string) => {
    setTestingPid(cmd);
    await obdEngine.sendManualDebugCommand(cmd);
    setTestingPid(null);
  };

  const handleRunSweep = async () => {
    setIsRunningSweep(true);
    try {
      await obdEngine.runFullSensorDiagnosticSweep();
    } finally {
      setIsRunningSweep(false);
    }
  };

  const handleScanAll = async () => {
    setIsScanningAll(true);
    setScanResult('');
    try {
      setScanResult(await obdEngine.scanAllSensors());
    } finally {
      setIsScanningAll(false);
    }
  };

  const handleProbeG266 = async () => {
    setIsProbingG266(true);
    try {
      await obdEngine.probe17InstrumentsOilTempG266();
    } finally {
      setIsProbingG266(false);
    }
  };

  const handleVagTest = async () => {
    setIsTestingVag(true);
    setVagTestResult('');
    try {
      setVagTestResult(await obdEngine.testVagEngineGroups115118());
    } finally {
      setIsTestingVag(false);
    }
  };

  const handleForceProtocol = async (protoCmd: string) => {
    setIsForcingProto(protoCmd);
    try {
      await obdEngine.forceProtocolAndReinit(protoCmd);
    } finally {
      setIsForcingProto(null);
    }
  };

  const handleCopyDebugReport = () => {
    const pidLines = (Object.values(debug.pidTable) as PidDebugEntry[])
      .map(
        (p) =>
          `${p.pid} (${p.name}): Raw="${p.rawResponse}" | Parsed="${p.parsedValue}" | Status=${p.status} | OK=${p.successCount}/Fail=${p.failCount} | Latency=${p.latencyMs}ms${p.bridgeLatencyMs ? ` (brg:${p.bridgeLatencyMs}ms)` : ''} | RefreshInterval=${p.refreshIntervalMs}ms`
      )
      .join('\n');

    const recentLogs = debug.commandLogs
      .slice(0, 20)
      .map((l) => `[${l.time}] TX: ${l.cmd} -> RX: ${l.rawResp} (${l.parsedInfo}) [${l.latencyMs}ms]`)
      .join('\n');

    const report = `=== AUDI BFB LIVE OBD-II DEBUG REPORT ===
Bridge: ${debug.bridgeType}
Device: ${debug.deviceName} (${debug.deviceAddress})
ELM327 Version: ${debug.elmVersion}
Protocol: ${debug.protocolName} (${debug.protocolNum})
ECU Locked: ${debug.ecuLocked ? 'YES' : 'NO'}
K-Line Timing: ${debug.kLineTimingConfig} (Dropped Frames: ${debug.kLineDroppedFrames})
Supported PIDs (0100): ${debug.supportedPids0120}
Supported PIDs (0120): ${debug.supportedPids2140}
Supported PIDs (0140): ${debug.supportedPids4160}
Lambda / O2 PIDs (0114/0124/0134/0144): ${debug.lambdaPidsStatus}
VAG KWP2000 Session (10 89): ${debug.kwpSessionStatus}
Boost Group 115/118 (010B / 2173): ${debug.boostGroup115Status}
Oil Temp PID 015C (01-Engine): ${debug.oilTempPid015CSupported}
Oil Temp G266 (17-Instruments): ${debug.instruments17G266Status}
Active Supported Sensors: ${debug.supportedSensorsCount}
Full Cycle Time: ${debug.loopCycleMs}ms | Avg Command: ${debug.avgCommandMs}ms (${debug.commandsPerSecHz} cmds/sec)
Stats: Sent=${debug.totalCommandsSent}, Valid=${debug.totalValidResponses}, Errors=${debug.totalErrors}
Last Error: ${debug.lastError}

--- SENSOR PID TABLE ---
${pidLines}

--- RECENT RAW LOGS ---
${recentLogs}
`;

    navigator.clipboard?.writeText(report).then(() => {
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 3000);
    });
  };

  const pidEntries = Object.values(debug.pidTable) as PidDebugEntry[];

  return (
    <div className="space-y-5">
      {/* Top Banner & Actions */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono">
                  Κονσόλα Debug OBD-II &amp; Πραγματικών Μετρήσεων (ME7.5)
                </h2>
                <p className="text-xs text-slate-400">
                  Πραγματικές απαντήσεις Hex, έλεγχος συνεδρίας VAG KWP2000 (10 89 / 2173), Lambda PIDs (0114/0124/0134/0144) &amp; G266 (17-Instruments).
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button onClick={handleScanAll}
              disabled={isScanningAll || isRunningSweep || isTestingVag}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white text-xs font-bold uppercase">
              <RefreshCw className={`w-4 h-4 ${isScanningAll ? 'animate-spin' : ''}`} />
              {isScanningAll ? 'Scanning...' : 'Scan All Sensors'}
            </button>
            <button
              onClick={handleRunSweep}
              disabled={isRunningSweep || isProbingG266}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-md shadow-blue-600/20"
            >
              <RefreshCw className={`w-4 h-4 ${isRunningSweep ? 'animate-spin' : ''}`} />
              <span>{isRunningSweep ? 'Έλεγχος σε εξέλιξη...' : 'Επανέλεγχος Υποστήριξης PIDs'}</span>
            </button>

            <button
              onClick={handleProbeG266}
              disabled={isProbingG266 || isRunningSweep}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-md"
            >
              <RefreshCw className={`w-4 h-4 ${isProbingG266 ? 'animate-spin' : ''}`} />
              <span>{isProbingG266 ? 'Έλεγχος 17-Instruments...' : 'Έλεγχος G266 (17-Instruments)'}</span>
            </button>

            <button
              onClick={handleVagTest}
              disabled={isTestingVag || isProbingG266 || isRunningSweep}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white text-xs font-bold uppercase"
            >
              <Radio className={`w-4 h-4 ${isTestingVag ? 'animate-pulse' : ''}`} />
              <span>{isTestingVag ? 'Έλεγχος VAG σε εξέλιξη...' : 'VAG Group Connection Test (115/118)'}</span>
            </button>
            <button
              onClick={handleCopyDebugReport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-md"
            >
              {copiedReport ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedReport ? 'Αντιγράφηκε!' : 'Αντιγραφή Αναφοράς Debug'}</span>
            </button>
          </div>
        </div>

        {scanResult && <div className="mt-3 text-xs text-cyan-300 font-mono break-words">{scanResult}</div>}
        {vagTestResult && (
          <div className="mt-3 rounded-xl border border-violet-500/40 bg-violet-950/30 p-3 text-sm text-violet-100 whitespace-pre-wrap">
            {vagTestResult}
          </div>
        )}

        {/* Connection & ECU Diagnostic Metadata Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              Γέφυρα &amp; Συσκευή Dongle
            </span>
            <div className="text-xs font-bold text-white truncate">{debug.bridgeType}</div>
            <div className="text-[11px] font-mono text-slate-400 truncate">
              {debug.deviceName} ({debug.deviceAddress})
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              Πρωτόκολλο &amp; Χρονισμός K-Line
            </span>
            <div className="text-xs font-bold text-white font-mono truncate">
              Proto: <span className="text-emerald-400">{debug.protocolName}</span> ({debug.protocolNum})
            </div>
            <div className="text-[10px] font-mono text-purple-300 truncate">
              {debug.kLineTimingConfig} • Drops: {debug.kLineDroppedFrames}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Bitmasks &amp; Lambda PIDs
            </span>
            <div className="text-[10px] font-mono text-slate-300 truncate" title={debug.supportedPids0120}>
              0100: {debug.supportedPids0120}
            </div>
            <div className="text-[10px] font-mono text-amber-300 truncate" title={debug.lambdaPidsStatus}>
              Lambda/O2: {debug.lambdaPidsStatus}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              Μέτρηση Πλήρους Κύκλου &amp; Ρυθμού
            </span>
            <div className="text-xs font-mono text-white flex items-center gap-2">
              <span>Πλήρης Κύκλος ({debug.supportedSensorsCount} PIDs):</span>
              <strong className="text-emerald-400">{debug.loopCycleMs} ms</strong>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between gap-1">
              <span>Μ.Ο. Εντολής: {debug.avgCommandMs} ms ({debug.commandsPerSecHz} cmd/s)</span>
              {debug.avgBridgeLatencyMs > 0 && (
                <span className="text-cyan-400 font-bold" title="Χρόνος διαδρομής Android Bridge">
                  Bridge: {debug.avgBridgeLatencyMs} ms
                </span>
              )}
            </div>
            {debug.minCommandLatencyMs > 0 && (
              <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-1 mt-0.5">
                <span>TX→RX: <strong className="text-white">{debug.lastCommandLatencyMs} ms</strong></span>
                <span className="text-slate-500 text-[9px]">(min: {debug.minCommandLatencyMs}ms • max: {debug.maxCommandLatencyMs}ms)</span>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Hardware Verification Status for KWP2000, Boost 115/118, and Oil Temp (015C & 17-Instruments G266) */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] font-mono">
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2.5">
            <span className="text-slate-400 block font-sans font-bold uppercase text-[10px]">
              1. Συνεδρία VAG KWP2000 (Service 10 89):
            </span>
            <span className="text-cyan-300">{debug.kwpSessionStatus}</span>
          </div>
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2.5">
            <span className="text-slate-400 block font-sans font-bold uppercase text-[10px]">
              2. Boost Specified / Actual (Group 115 / 010B):
            </span>
            <span className="text-amber-300">{debug.boostGroup115Status}</span>
          </div>
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2.5">
            <span className="text-slate-400 block font-sans font-bold uppercase text-[10px]">
              3. Θερμ. Λαδιού (015C &amp; 17-Instruments G266):
            </span>
            <span className="text-emerald-300 block">01-Engine 015C: {debug.oilTempPid015CSupported}</span>
            <span className="text-slate-300 block mt-0.5">17-Instruments G266: {debug.instruments17G266Status}</span>
          </div>
        </div>

        {/* Manual Protocol Override Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs text-slate-300">
            <strong className="text-white">Χειροκίνητο Κλείδωμα Πρωτοκόλλου VAG:</strong>{' '}
            <span className="text-slate-400">
              Επιλέξτε απευθείας το πρωτόκολλο του εγκεφάλου:
            </span>
          </div>
          <div className="flex items-center flex-wrap gap-1.5">
            {[
              { cmd: 'ATSPA4', label: '★ KWP Auto (ATSPA4 - BFB)' },
              { cmd: 'ATSP4', label: 'KWP 5-Baud (ATSP4)' },
              { cmd: 'ATSPA3', label: 'ISO Auto (ATSPA3)' },
              { cmd: 'ATSP3', label: 'ISO 9141-2 (ATSP3)' },
              { cmd: 'ATSP5', label: 'KWP Fast (ATSP5)' },
              { cmd: 'ATSP0', label: 'Auto (ATSP0)' },
            ].map((p) => (
              <button
                key={p.cmd}
                onClick={() => handleForceProtocol(p.cmd)}
                disabled={isForcingProto !== null}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-mono font-bold text-slate-200 transition cursor-pointer"
              >
                {isForcingProto === p.cmd ? 'Κλείδωμα...' : p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Sensor PID Raw Hex Table */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Ζωντανός Πίνακας Αισθητήρων OBD-II (Πραγματικοί Χρόνοι Απόκρισης &amp; Refresh Interval)
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            Μη υποστηριζόμενα PIDs εμφανίζουν αυστηρά N/A και αφαιρούνται από τον κύκλο
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                <th className="py-2 px-2.5">PID</th>
                <th className="py-2 px-2.5 font-sans">Αισθητήρας</th>
                <th className="py-2 px-2.5">Raw Απάντηση Dongle (Hex)</th>
                <th className="py-2 px-2.5">Πραγματική Τιμή</th>
                <th className="py-2 px-2.5">Κατάσταση</th>
                <th className="py-2 px-2.5">OK / Fail</th>
                <th className="py-2 px-2.5">Latency Εντολής</th>
                <th className="py-2 px-2.5">Refresh Interval</th>
                <th className="py-2 px-2.5 text-right">Δοκιμή</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {pidEntries.map((row) => (
                <tr key={row.pid} className="hover:bg-slate-800/40 transition">
                  <td className="py-2 px-2.5 font-bold text-red-400">{row.pid}</td>
                  <td className="py-2 px-2.5 font-sans text-slate-200 font-medium">{row.name}</td>
                  <td className="py-2 px-2.5">
                    <code className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300 text-[11px] break-all">
                      {row.rawResponse}
                    </code>
                  </td>
                  <td className="py-2 px-2.5 font-bold text-white">{row.parsedValue}</td>
                  <td className="py-2 px-2.5">
                    {row.status === 'ok' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> OK (Active)
                      </span>
                    ) : row.status === 'searching' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold animate-pulse">
                        <AlertTriangle className="w-3 h-3" /> SEARCHING
                      </span>
                    ) : row.status === 'no_data' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                        NO DATA (N/A)
                      </span>
                    ) : row.status === 'error' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold">
                        <XCircle className="w-3 h-3" /> ERROR
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">Αναμονή</span>
                    )}
                  </td>
                  <td className="py-2 px-2.5 text-[11px]">
                    <span className="text-emerald-400">{row.successCount}</span>
                    <span className="text-slate-600"> / </span>
                    <span className="text-red-400">{row.failCount}</span>
                  </td>
                  <td className="py-2 px-2.5 text-slate-300 text-[11px]">
                    {row.latencyMs > 0 ? (
                      <div>
                        <span>{row.latencyMs} ms</span>
                        {row.bridgeLatencyMs !== undefined && row.bridgeLatencyMs > 0 && (
                          <span className="text-[10px] text-cyan-400 block font-mono">
                            brg: {row.bridgeLatencyMs}ms
                          </span>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-2 px-2.5 text-emerald-400 font-bold text-[11px]">
                    {row.refreshIntervalMs > 0 ? `${row.refreshIntervalMs} ms` : '-'}
                  </td>
                  <td className="py-2 px-2.5 text-right">
                    <button
                      onClick={() => handleQuickCmd(row.pid)}
                      disabled={testingPid === row.pid}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white text-[10px] font-sans font-bold transition cursor-pointer"
                    >
                      {testingPid === row.pid ? '...' : 'Test'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive ELM327 Raw Terminal & Command Log */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Ζωντανό Τερματικό Εντολών ELM327 (Raw AT, OBD-II &amp; KWP2000 Terminal)
            </h3>
            <p className="text-xs text-slate-400">
              Στείλτε απευθείας εντολές στο dongle (π.χ. <code className="text-emerald-400">015C</code>, <code className="text-emerald-400">010C</code>, <code className="text-emerald-400">0110</code>, <code className="text-emerald-400">2101</code>, <code className="text-emerald-400">2173</code>).
            </p>
          </div>

          <button
            onClick={() => obdEngine.clearDebugLogs()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer self-start"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Καθαρισμός Ιστορικού</span>
          </button>
        </div>

        {/* Quick Command Buttons */}
        <div className="flex items-center flex-wrap gap-1.5">
          {['ATI', 'ATRV', 'ATDP', '0100', '0120', '0140', '010C', '0110', '0104', '0111', '0105', '010F', '015C', '0115', '0124', '03'].map((cmd) => (
            <button
              key={cmd}
              onClick={() => handleQuickCmd(cmd)}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-emerald-400 font-bold transition cursor-pointer"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Manual Input Form */}
        <form onSubmit={handleSendManual} className="flex items-center gap-2">
          <input
            type="text"
            value={customCmd}
            onChange={(e) => setCustomCmd(e.target.value)}
            placeholder="Πληκτρολογήστε εντολή AT ή PID (π.χ. 015C, 010C, 0110, 2173)..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Αποστολή</span>
          </button>
        </form>

        {/* Scrollable Log Console */}
        <div className="bg-[#050811] border border-slate-800 rounded-xl p-3 h-64 overflow-y-auto font-mono text-xs space-y-1.5">
          {debug.commandLogs.length === 0 ? (
            <div className="text-slate-500 text-center py-16">
              Δεν υπάρχουν καταγεγραμμένες εντολές ακόμη. Συνδέστε το dongle ή πατήστε μια εντολή παραπάνω.
            </div>
          ) : (
            debug.commandLogs.map((log) => (
              <div
                key={log.id}
                className={`p-1.5 rounded border ${
                  log.isError
                    ? 'bg-red-950/20 border-red-900/40 text-red-300'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-200'
                } flex flex-col sm:flex-row sm:items-center justify-between gap-1`}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-500 text-[10px]">[{log.time}]</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-bold text-[11px]">
                    TX: {log.cmd}
                  </span>
                  <span className="text-amber-300 font-bold">
                    RX: {log.rawResp}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={log.isError ? 'text-red-400' : 'text-emerald-400'}>
                    {log.parsedInfo}
                  </span>
                  <span className="text-slate-500">
                    ({log.latencyMs}ms{log.bridgeMs && log.bridgeMs > 0 ? ` • brg: ${log.bridgeMs}ms` : ''})
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
