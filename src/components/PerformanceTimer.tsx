import React, { useEffect, useRef, useState } from 'react';
import { Flag, RotateCcw, Trophy } from 'lucide-react';
import { obdEngine } from '../services/obdService';

type TestId = '0-100' | '0-200' | '100-200' | '60-160' | '0-402m';
type Phase = 'armed' | 'running' | 'completed';
type Sample = { speed: number; at: number };
type Run = { id: string; test: TestId; seconds: number; at: string; distance?: number; speed?: number };
const TESTS: { id: TestId; title: string; start: number; end: number; distance: boolean }[] = [
  { id: '0-100', title: '0–100 km/h', start: 0, end: 100, distance: false },
  { id: '0-200', title: '0–200 km/h', start: 0, end: 200, distance: false },
  { id: '100-200', title: '100–200 km/h', start: 100, end: 200, distance: false },
  { id: '60-160', title: '60–160 km/h', start: 60, end: 160, distance: false },
  { id: '0-402m', title: '0–402 m', start: 0, end: 402, distance: true },
];
const STORE_KEY = 'audi_bfb_draggy_v1';
const interpolate = (a: Sample, b: Sample, speed: number): number =>
  a.at + (b.at - a.at) * Math.max(0, Math.min(1, (speed - a.speed) / (b.speed - a.speed || 1)));

export const PerformanceTimer: React.FC<{ currentSpeed: number | null }> = ({ currentSpeed }) => {
  const [testId, setTestId] = useState<TestId>('0-100');
  const [phase, setPhase] = useState<Phase>('armed');
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [displaySpeed, setDisplaySpeed] = useState<number | null>(null);
  const [result, setResult] = useState<Run | null>(null);
  const [runs, setRuns] = useState<Run[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch { return []; }
  });
  const phaseRef = useRef<Phase>('armed');
  const previous = useRef<Sample | null>(null);
  const startAt = useRef<number | null>(null);
  const distanceRef = useRef(0);
  const lastValidAt = useRef<number | null>(null);
  const testRef = useRef<TestId>(testId);

  useEffect(() => { try { localStorage.setItem(STORE_KEY, JSON.stringify(runs)); } catch {} }, [runs]);

  const reset = (nextTest: TestId = testRef.current) => {
    testRef.current = nextTest;
    phaseRef.current = 'armed';
    previous.current = null;
    startAt.current = null;
    lastValidAt.current = null;
    distanceRef.current = 0;
    setPhase('armed'); setElapsed(0); setDistance(0); setDisplaySpeed(null); setResult(null);
  };

  useEffect(() => {
    // Keep the ECU session alive and give PID 010D the entire K-Line polling budget.
    obdEngine.setFocusedSensor('010D');
    const unsubscribe = obdEngine.subscribeSpeedSamples((speed, at) => {
      if (!Number.isFinite(speed) || speed < 0) return;
      const now: Sample = { speed, at };
      const prev = previous.current;
      setDisplaySpeed(speed);
      if (phaseRef.current === 'completed') { previous.current = now; return; }
      const test = TESTS.find(t => t.id === testRef.current)!;
      if (!prev) { previous.current = now; lastValidAt.current = at; return; }
      const dt = (at - prev.at) / 1000;
      // Discard stale/disconnected intervals; never integrate a large blind gap.
      if (dt <= 0 || dt > 1.5) {
        previous.current = now;
        lastValidAt.current = at;
        if (phaseRef.current === 'running') reset(test.id);
        return;
      }
      lastValidAt.current = at;

      if (phaseRef.current === 'armed') {
        if (test.start === 0) {
          // Launch must be observed from a stationary sample.
          if (prev.speed === 0 && speed > 0) {
            startAt.current = prev.at;
            phaseRef.current = 'running'; setPhase('running');
            if (test.distance) {
              const metres = (prev.speed + speed) / 2 / 3.6 * dt;
              distanceRef.current = metres; setDistance(metres);
            }
          }
        } else if (prev.speed < test.start && speed >= test.start) {
          startAt.current = interpolate(prev, now, test.start);
          phaseRef.current = 'running'; setPhase('running');
        }
      } else if (phaseRef.current === 'running' && startAt.current !== null) {
        if (test.distance) {
          // Distance ONLY from successive ECU speed samples, trapezoidal integration.
          const delta = (prev.speed + speed) / 2 / 3.6 * dt;
          const before = distanceRef.current;
          const after = before + delta;
          distanceRef.current = after;
          setDistance(Math.min(402, after));
          if (after >= 402 && delta > 0) {
            const fraction = (402 - before) / delta;
            const finish = prev.at + fraction * (at - prev.at);
            const seconds = (finish - startAt.current) / 1000;
            const run: Run = { id: String(Date.now()), test: test.id, seconds, at: new Date().toLocaleString('el-GR'), distance: 402, speed };
            phaseRef.current = 'completed'; setPhase('completed'); setElapsed(seconds * 1000); setResult(run);
            setRuns(old => [run, ...old].slice(0, 30));
          }
        } else if (prev.speed < test.end && speed >= test.end) {
          const finish = interpolate(prev, now, test.end);
          const seconds = (finish - startAt.current) / 1000;
          const run: Run = { id: String(Date.now()), test: test.id, seconds, at: new Date().toLocaleString('el-GR'), speed: test.end };
          phaseRef.current = 'completed'; setPhase('completed'); setElapsed(seconds * 1000); setResult(run);
          setRuns(old => [run, ...old].slice(0, 30));
        }
        if (phaseRef.current === 'running') setElapsed(at - startAt.current);
      }
      previous.current = now;
    });
    return () => { unsubscribe(); obdEngine.setFocusedSensor(null); };
  }, []);

  const selected = TESTS.find(t => t.id === testId)!;
  return <div className="space-y-4">
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 text-white font-black text-xl"><Flag className="text-red-500" /> Draggy</div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {TESTS.map(test => <button key={test.id} onClick={() => { setTestId(test.id); reset(test.id); }}
          className={`rounded-xl px-3 py-3 text-sm font-bold border ${testId === test.id ? 'bg-red-700 border-red-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-300'}`}>
          {test.title}
        </button>)}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={`text-sm font-bold ${phase === 'completed' ? 'text-emerald-400' : phase === 'running' ? 'text-red-400' : 'text-amber-400'}`}>
          {phase === 'armed' ? (selected.start === 0 ? 'Αναμονή εκκίνησης από 0 km/h' : `Αναμονή διέλευσης ${selected.start} km/h`) : phase === 'running' ? 'ΜΕΤΡΗΣΗ ΣΕ ΕΞΕΛΙΞΗ' : 'ΟΛΟΚΛΗΡΩΘΗΚΕ'}
        </span>
        <button onClick={() => reset()} className="rounded-lg bg-slate-700 px-4 py-2 text-white text-sm flex gap-2 items-center"><RotateCcw size={16}/> Επαναφορά / Οπλισμός</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div><p className="text-xs text-slate-400">Χρόνος</p><p className="text-4xl font-mono font-black text-white">{(elapsed / 1000).toFixed(2)} s</p></div>
        <div><p className="text-xs text-slate-400">Ταχύτητα ECU</p><p className="text-4xl font-mono font-black text-white">{displaySpeed ?? currentSpeed ?? '—'} <span className="text-sm">km/h</span></p></div>
        {selected.distance && <div><p className="text-xs text-slate-400">Υπολογισμένη απόσταση</p><p className="text-4xl font-mono font-black text-white">{distance.toFixed(1)} <span className="text-sm">m</span></p></div>}
      </div>
      {result && <div className="border-t border-emerald-700 pt-4 flex items-center gap-3 text-emerald-300"><Trophy size={24}/><strong>{selected.title}: {result.seconds.toFixed(2)} s</strong></div>}
      <p className="text-xs text-slate-400">Αποκλειστικό polling PID 010D (ταχύτητα ECU). Στα 402 m η απόσταση υπολογίζεται μόνο από διαδοχικές τιμές ταχύτητας, με ολοκλήρωση στον χρόνο. Χωρίς GPS ή ανεξάρτητο αισθητήρα απόστασης. Η ανάλυση του OBD-II PID είναι 1 km/h και η συχνότητα K-Line περιορίζει την ακρίβεια. Χρήση μόνο σε ελεγχόμενο, ασφαλή χώρο.</p>
    </div>
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
      <h3 className="text-white font-bold mb-3">Ιστορικό Draggy</h3>
      {runs.length === 0 ? <p className="text-slate-400 text-sm">Δεν υπάρχουν ολοκληρωμένες μετρήσεις.</p> :
        <div className="overflow-x-auto"><table className="w-full text-xs text-left text-slate-300">
          <thead><tr className="border-b border-slate-700"><th className="py-2">Ημερομηνία</th><th>Δοκιμή</th><th>Χρόνος</th></tr></thead>
          <tbody>{runs.map(r => <tr key={r.id} className="border-b border-slate-800"><td className="py-2">{r.at}</td><td>{r.test}</td><td className="font-bold text-emerald-300">{r.seconds.toFixed(2)} s</td></tr>)}</tbody>
        </table></div>}
    </div>
  </div>;
};
