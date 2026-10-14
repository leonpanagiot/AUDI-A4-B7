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
  const [isForcingProto, setIsForcingProto] = useState<string | null>(null);
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
          `${p.pid} (${p.name}): Raw="${p.rawResponse}" | Parsed="${p.parsedValue}" | Status=${p.status} | OK=${p.successCount}/Fail=${p.failCount} | Latency=${p.latencyMs}ms | RefreshInterval=${p.refreshIntervalMs}ms`
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
Oil Temp PID 015C: ${debug.oilTempPid015CSupported}
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
                  Πραγματικές απαντήσεις Hex χωρίς υπολογισμένες/ψεύτικες τιμές, έλεγχος K-Line ATAT2/ATST 19, PID 015C και μέτρηση πλήρους κύκλου.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleRunSweep}
              disabled={isRunningSweep}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-md shadow-blue-600/20"
            >
              <RefreshCw className={`w-4 h-4 ${isRunningSweep ? 'animate-spin' : ''}`} />
              <span>{isRunningSweep ? 'Έλεγχος σε εξέλιξη...' : 'Επανέλεγχος Υποστήριξης PIDs'}</span>
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
              Bitmasks &amp; Θερμ. Λαδιού (015C)
            </span>
            <div className="text-[10px] font-mono text-slate-300 truncate">
              0100: {debug.supportedPids0120}
            </div>
            <div className="text-[10px] font-mono text-amber-300 truncate">
              PID 015C (Oil Temp): {debug.oilTempPid015CSupported}
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
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Μ.Ο. Εντολής: {debug.avgCommandMs} ms ({debug.commandsPerSecHz} cmd/s)</span>
            </div>
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
              { cmd: 'ATSP0', label: 'Auto (ATSP0)' },
              { cmd: 'ATSP3', label: 'ISO 9141-2 K-Line (ATSP3)' },
              { cmd: 'ATSP5', label: 'KWP Fast (ATSP5 - ME7.5)' },
              { cmd: 'ATSP4', label: 'KWP 5-Baud (ATSP4)' },
              { cmd: 'ATSP6', label: 'CAN 500k (ATSP6)' },
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
                    {row.latencyMs > 0 ? `${row.latencyMs} ms` : '-'}
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
                  <span className="text-slate-500">({log.latencyMs}ms)</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
