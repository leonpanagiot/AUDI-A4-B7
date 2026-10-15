import React, { useEffect, useRef, useState } from 'react';
import { TelemetryData } from '../types/telemetry';
import { obdEngine } from '../services/obdService';

const SENSOR: Record<string, { name: string; unit: string; read: (t: TelemetryData) => number | null }> = {
  '0110': { name: 'MAF', unit: 'g/s', read: t => t.mafGramsPerSec },
  '0134': { name: 'Lambda', unit: 'λ', read: t => t.lambda },
  '010E': { name: 'Ignition Timing', unit: '°', read: t => t.ignitionTiming },
  '0105': { name: 'Coolant', unit: '°C', read: t => t.coolantTemp },
  '010F': { name: 'IAT', unit: '°C', read: t => t.iat },
  '0106': { name: 'STFT', unit: '%', read: t => t.shortTermFuelTrim },
  '0111': { name: 'Throttle', unit: '%', read: t => t.throttlePosition },
};
type Sample = { time: number; value: number };

export const FocusedSensorGraph: React.FC<{ pid: string; onClose: () => void }> = ({ pid, onClose }) => {
  const sensor = SENSOR[pid];
  const [samples, setSamples] = useState<Sample[]>([]);
  const samplesRef = useRef<Sample[]>([]);
  const lastStamp = useRef(0);
  useEffect(() => {
    if (!sensor) return;
    samplesRef.current = [];
    setSamples([]);
    lastStamp.current = 0;
    obdEngine.setFocusedSensor(pid);
    const unsubscribe = obdEngine.subscribe({
      onTelemetry: (data) => {
        const value = sensor.read(data);
        const now = Date.now();
        // The focused polling loop sends updates for only the selected PID.
        if (value === null || !Number.isFinite(value) || now === lastStamp.current) return;
        lastStamp.current = now;
        const next = [...samplesRef.current, { time: now, value }];
        samplesRef.current = next;
        setSamples(next.slice(-400));
      },
      onStatusChange: () => {},
      onError: () => {},
      onDebugUpdate: () => {},
    });
    return () => { unsubscribe(); obdEngine.setFocusedSensor(null); };
  }, [pid]);
  if (!sensor) return null;
  const current = samples.length ? samples[samples.length - 1].value : null;
  const values = samples.map(s => s.value);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const span = Math.max(0.01, max - min);
  const path = samples.map((s, i) => `${i ? 'L' : 'M'} ${(i / Math.max(1, samples.length - 1)) * 760} ${190 - (s.value - min) / span * 175}`).join(' ');
  const exportCsv = () => {
    const rows = ['timestamp_iso,elapsed_ms,pid,value,unit', ...samplesRef.current.map(s =>
      `${new Date(s.time).toISOString()},${s.time - samplesRef.current[0].time},${pid},${s.value},${sensor.unit}`
    )];
    const blob = new Blob([rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `OBD_${sensor.name.replace(/\s+/g, '_')}_${Date.now()}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };
  return <div className="rounded-2xl bg-slate-950 border border-cyan-800 p-4 space-y-4">
    <div className="flex items-center justify-between gap-3">
      <div><h2 className="text-lg font-black text-white">{sensor.name} — High-Speed Live</h2>
        <p className="text-xs text-cyan-300">PID {pid} · αποκλειστικό polling · {samples.length} δείγματα στο γράφημα</p></div>
      <button className="rounded-xl bg-slate-700 px-4 py-2 text-white" onClick={onClose}>Επιστροφή</button>
    </div>
    <div className="text-4xl font-black font-mono text-white">{current === null ? 'N/A' : current.toFixed(2)} <span className="text-base text-slate-400">{sensor.unit}</span></div>
    <div className="flex gap-5 text-sm text-slate-300"><span>Min: {samples.length ? min.toFixed(2) : '—'}</span><span>Max: {samples.length ? max.toFixed(2) : '—'}</span></div>
    <svg viewBox="0 0 760 205" className="w-full rounded-xl bg-slate-900" role="img" aria-label="Live sensor graph">
      <path d={path} fill="none" stroke="#22d3ee" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
    </svg>
    <p className="text-xs text-slate-400">Καταγραφή σε πραγματικό χρόνο. Οι υπόλοιπες μετρήσεις παραμένουν προσωρινά παγωμένες, χωρίς αποσύνδεση.</p>
    <button onClick={exportCsv} disabled={!samples.length} className="rounded-xl bg-emerald-700 px-5 py-2 text-white disabled:opacity-40">Export CSV ({samplesRef.current.length} δείγματα)</button>
  </div>;
};
