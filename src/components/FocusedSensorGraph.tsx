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
const WIDTH = 760;
const HEIGHT = 205;

export const FocusedSensorGraph: React.FC<{ pid: string; onClose: () => void }> = ({ pid, onClose }) => {
  const sensor = SENSOR[pid];
  const [samples, setSamples] = useState<Sample[]>([]);
  const samplesRef = useRef<Sample[]>([]);
  const [recording, setRecording] = useState(true);
  const recordingRef = useRef(true);
  const lastStamp = useRef(0);
  const [windowSeconds, setWindowSeconds] = useState(20);
  const [followLive, setFollowLive] = useState(true);
  const [scrollEnd, setScrollEnd] = useState<number | null>(null);
  const [exportMessage, setExportMessage] = useState('');
  const touchStartX = useRef<number | null>(null);
  const touchStartEnd = useRef<number | null>(null);

  useEffect(() => {
    if (!sensor) return;
    samplesRef.current = [];
    setSamples([]);
    lastStamp.current = 0;
    recordingRef.current = true;
    setRecording(true);
    setFollowLive(true);
    setScrollEnd(null);
    obdEngine.setFocusedSensor(pid);
    const unsubscribe = obdEngine.subscribe({
      onTelemetry: data => {
        if (!recordingRef.current) return;
        const value = sensor.read(data);
        const now = Date.now();
        if (value === null || !Number.isFinite(value) || now === lastStamp.current) return;
        lastStamp.current = now;
        const next = [...samplesRef.current, { time: now, value }];
        samplesRef.current = next;
        // Keep the full recording for CSV; the viewport is time-windowed.
        setSamples(next);
      },
      onStatusChange: () => {},
      onError: () => {},
      onDebugUpdate: () => {},
    });
    return () => { unsubscribe(); obdEngine.setFocusedSensor(null); };
  }, [pid]);

  if (!sensor) return null;

  const current = samples.length ? samples[samples.length - 1].value : null;
  const allMin = samples.length ? Math.min(...samples.map(s => s.value)) : null;
  const allMax = samples.length ? Math.max(...samples.map(s => s.value)) : null;
  const firstTime = samples[0]?.time ?? Date.now();
  const lastTime = samples[samples.length - 1]?.time ?? firstTime;
  const durationMs = windowSeconds * 1000;
  const viewEnd = followLive ? Math.max(firstTime + durationMs, lastTime) : Math.max(firstTime + durationMs, Math.min(scrollEnd ?? lastTime, lastTime));
  const viewStart = viewEnd - durationMs;
  const visible = samples.filter(s => s.time >= viewStart && s.time <= viewEnd);
  const values = visible.map(s => s.value);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const span = Math.max(0.01, max - min);
  const path = visible.map((s, i) => `${i ? 'L' : 'M'} ${((s.time - viewStart) / durationMs) * WIDTH} ${190 - (s.value - min) / span * 175}`).join(' ');

  const toggleRecording = () => {
    const next = !recordingRef.current;
    recordingRef.current = next;
    setRecording(next);
  };

  const panBy = (deltaMs: number) => {
    setFollowLive(false);
    setScrollEnd(previous => Math.max(firstTime + durationMs, Math.min(lastTime, (previous ?? viewEnd) + deltaMs)));
  };

  const exportCsv = async () => {
    if (!samplesRef.current.length) return;
    const name = `AUDI_BFB_${sensor.name.replace(/\s+/g, '_')}_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    const rows = ['timestamp_iso,elapsed_ms,pid,value,unit', ...samplesRef.current.map(s =>
      `${new Date(s.time).toISOString()},${s.time - samplesRef.current[0].time},${pid},${s.value},${sensor.unit}`
    )];
    const csv = '\uFEFF' + rows.join('\r\n');
    const file = new File([csv], name, { type: 'text/csv' });
    setExportMessage('');
    try {
      // Android WebView often blocks synthetic <a download>. Prefer native share sheet.
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ files: [file], title: name });
        setExportMessage('Άνοιξε η κοινοποίηση αρχείου CSV.');
        return;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
    }
    try {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Defer revocation; immediate revoke can cancel Android WebView downloads.
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      setExportMessage('Ζητήθηκε η αποθήκευση CSV. Ελέγξτε τις Λήψεις.');
    } catch {
      try {
        await navigator.clipboard.writeText(csv);
        setExportMessage('Η αποθήκευση δεν υποστηρίζεται εδώ. Το CSV αντιγράφηκε στο πρόχειρο.');
      } catch {
        setExportMessage('Αποτυχία εξαγωγής. Απαιτείται υποστήριξη αρχείων από το Android APK.');
      }
    }
  };

  return <div className="rounded-2xl bg-slate-950 border border-cyan-800 p-4 space-y-4">
    <div className="flex items-center justify-between gap-3">
      <div><h2 className="text-lg font-black text-white">{sensor.name} — High-Speed Live</h2>
        <p className="text-xs text-cyan-300">PID {pid} · αποκλειστικό polling · {recording ? 'Καταγραφή ενεργή' : 'Καταγραφή σε παύση'}</p></div>
      <button className="rounded-xl bg-slate-700 px-4 py-2 text-white" onClick={onClose}>Επιστροφή</button>
    </div>
    <div className="text-4xl font-black font-mono text-white">{current === null ? 'N/A' : current.toFixed(2)} <span className="text-base text-slate-400">{sensor.unit}</span></div>
    <div className="flex flex-wrap gap-5 text-sm text-slate-300">
      <span>Min: {allMin === null ? '—' : allMin.toFixed(2)}</span>
      <span>Max: {allMax === null ? '—' : allMax.toFixed(2)}</span>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={toggleRecording} className={`rounded-xl px-4 py-2 text-white font-bold ${recording ? 'bg-amber-700' : 'bg-emerald-700'}`}>
        {recording ? '⏸ Παύση καταγραφής' : '▶ Έναρξη καταγραφής'}
      </button>
      <button onClick={() => setWindowSeconds(v => Math.max(2, v / 2))} className="rounded-xl bg-slate-700 px-3 py-2 text-white" aria-label="Zoom in">＋</button>
      <button onClick={() => setWindowSeconds(v => Math.min(600, v * 2))} className="rounded-xl bg-slate-700 px-3 py-2 text-white" aria-label="Zoom out">－</button>
      <button onClick={() => { setFollowLive(true); setScrollEnd(null); }} className="rounded-xl bg-slate-700 px-3 py-2 text-white">Τελευταία μέτρηση</button>
    </div>
    <div onWheel={e => { if (e.ctrlKey) { setWindowSeconds(v => Math.min(600, Math.max(2, e.deltaY > 0 ? v * 1.25 : v / 1.25))); } else { panBy(e.deltaY * windowSeconds * 5); } }}
      onTouchStart={e => { if (e.touches.length === 1) { touchStartX.current = e.touches[0].clientX; touchStartEnd.current = viewEnd; } }}
      onTouchEnd={e => { if (touchStartX.current !== null && touchStartEnd.current !== null && e.changedTouches.length === 1) { const delta = e.changedTouches[0].clientX - touchStartX.current; setFollowLive(false); setScrollEnd(Math.max(firstTime + durationMs, Math.min(lastTime, touchStartEnd.current - delta / Math.max(1, e.currentTarget.clientWidth) * durationMs))); } touchStartX.current = null; touchStartEnd.current = null; }}
      className="w-full rounded-xl bg-slate-900 overflow-hidden" style={{ touchAction: 'pan-y' }}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Scrollable live sensor graph">
        {[0, 0.25, 0.5, 0.75, 1].map(v => <line key={v} x1={v * WIDTH} x2={v * WIDTH} y1="0" y2={HEIGHT} stroke="#334155" strokeWidth="1" />)}
        <path d={path} fill="none" stroke="#22d3ee" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
    <div className="text-xs text-slate-400 flex justify-between"><span>{new Date(viewStart).toLocaleTimeString('el-GR')}</span><span>Παράθυρο {windowSeconds} δευτ.</span><span>{new Date(viewEnd).toLocaleTimeString('el-GR')}</span></div>
    <p className="text-xs text-slate-400">Σύρε το γράφημα οριζόντια για παλιότερες μετρήσεις. Τα +/− αλλάζουν το χρονικό zoom. Η παύση δεν αποσυνδέει την ECU.</p>
    <button onClick={() => { void exportCsv(); }} disabled={!samples.length} className="rounded-xl bg-emerald-700 px-5 py-2 text-white disabled:opacity-40">Εξαγωγή CSV</button>
    {exportMessage && <p className="text-xs text-amber-300">{exportMessage}</p>}
  </div>;
};
