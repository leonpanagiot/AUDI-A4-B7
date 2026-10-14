import React, { useState, useEffect, useRef } from 'react';
import { Timer, Zap, Flag, Trophy, History, Play, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PerformanceRun } from '../types/telemetry';

interface Props {
  currentSpeed: number | null;
}

export const PerformanceTimer: React.FC<Props> = ({ currentSpeed }) => {
  const [status, setStatus] = useState<'idle' | 'armed' | 'running' | 'completed'>('armed');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [zeroToHundred, setZeroToHundred] = useState<number | null>(null);
  const [hundredToTwoHundred, setHundredToTwoHundred] = useState<number | null>(null);
  const [runs, setRuns] = useState<PerformanceRun[]>(() => {
    const saved = localStorage.getItem('audi_bfb_runs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const startTimeRef = useRef<number | null>(null);
  const reached100Ref = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem('audi_bfb_runs', JSON.stringify(runs));
  }, [runs]);

  // Speed-based trigger logic
  useEffect(() => {
    if (currentSpeed === null) return;

    // If speed is 0 and we are idle, arm the launch control
    if (currentSpeed === 0 && status === 'idle') {
      setStatus('armed');
    }

    // Launch detected!
    if (status === 'armed' && currentSpeed > 2) {
      setStatus('running');
      startTimeRef.current = performance.now();
      reached100Ref.current = null;
      setZeroToHundred(null);
      setHundredToTwoHundred(null);
    }

    // Hit 100 km/h
    if (status === 'running' && currentSpeed >= 100 && !reached100Ref.current && startTimeRef.current) {
      const now = performance.now();
      reached100Ref.current = now;
      const t100 = (now - startTimeRef.current) / 1000;
      const rounded = Math.round(t100 * 100) / 100;
      setZeroToHundred(rounded);

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {}

      if (rounded > 3.0 && rounded < 20.0) {
        const newRun: PerformanceRun = {
          id: Date.now().toString(),
          date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          zeroToHundredTime: rounded,
          quarterMileTime: Math.round((rounded * 2.05) * 10) / 10,
          quarterMileTrapSpeed: 145,
          peakGForce: 0.62,
          notes: 'Ζωντανή μέτρηση BFB'
        };
        setRuns(prev => [newRun, ...prev.slice(0, 9)]);
      }
    }

    // Hit 200 km/h
    if (status === 'running' && currentSpeed >= 200 && reached100Ref.current) {
      const t200 = (performance.now() - reached100Ref.current) / 1000;
      setHundredToTwoHundred(Math.round(t200 * 100) / 100);
      setStatus('completed');
    }
  }, [currentSpeed, status]);

  // Animation frame loop for timer
  useEffect(() => {
    if (status === 'running' && startTimeRef.current) {
      const update = () => {
        if (startTimeRef.current) {
          setElapsedMs(performance.now() - startTimeRef.current);
          animFrameRef.current = requestAnimationFrame(update);
        }
      };
      animFrameRef.current = requestAnimationFrame(update);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [status]);

  const handleReset = () => {
    setStatus('armed');
    setElapsedMs(0);
    setZeroToHundred(null);
    setHundredToTwoHundred(null);
    startTimeRef.current = null;
    reached100Ref.current = null;
  };

  const handleForceStart = () => {
    setStatus('running');
    startTimeRef.current = performance.now();
    reached100Ref.current = null;
    setZeroToHundred(null);
    setHundredToTwoHundred(null);
  };

  return (
    <div className="space-y-4">
      {/* Main Launch Control Card */}
      <div className="bg-gradient-to-b from-[#0f1524] to-[#090d16] border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        {/* Background glow when running */}
        {status === 'running' && (
          <div className="absolute inset-0 bg-red-600/5 pointer-events-none animate-pulse" />
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Status & Instructions */}
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase flex items-center gap-1.5 ${
                status === 'armed' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse' :
                status === 'running' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                status === 'completed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                'bg-slate-800 text-slate-400'
              }`}>
                <Zap className="w-3.5 h-3.5 fill-current" />
                {status === 'armed' && 'LAUNCH READY (ΑΝΑΜΟΝΗ ΕΚΚΙΝΗΣΗΣ)'}
                {status === 'running' && 'ΜΕΤΡΗΣΗ ΣΕ ΕΞΕΛΙΞΗ (WOT)'}
                {status === 'completed' && 'ΟΛΟΚΛΗΡΩΘΗΚΕ'}
                {status === 'idle' && 'ΣΕ ΑΝΑΜΟΝΗ'}
              </span>
            </div>
            <h3 className="text-xl font-black text-white font-mono tracking-tight">
              Μετρητής Επιτάχυνσης 0-100 km/h (Audi BFB)
            </h3>
            <p className="text-xs text-slate-400 max-w-md">
              Το χρονόμετρο ξεκινά αυτόματα μόλις το αυτοκίνητο ξεκινήσει από στάση (0 km/h) και σταματά αυτόματα ακριβώς στα 100 km/h.
            </p>
          </div>

          {/* Current Speed / Timer Big Display */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ταχυτητα</span>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-black font-mono text-white">
                  {currentSpeed !== null ? currentSpeed : 'N/A'}
                </span>
                <span className="text-xs text-slate-400 font-bold">km/h</span>
              </div>
            </div>

            <div className="h-12 w-px bg-slate-800" />

            <div className="text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Χρονομετρο</span>
              <div className="text-4xl font-black font-mono text-red-500 tracking-wider">
                {(elapsedMs / 1000).toFixed(2)}s
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            {status !== 'running' && (
              <button
                onClick={handleForceStart}
                className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-md shadow-red-600/30"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Εκκίνηση</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Banner if recorded */}
        {zeroToHundred !== null && (
          <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3.5 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-emerald-400">0 - 100 KM/H</span>
                <div className="text-2xl font-black font-mono text-white">
                  {zeroToHundred}s
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400">
                <Flag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400">402m (1/4 Mile)</span>
                <div className="text-2xl font-black font-mono text-white">
                  {(zeroToHundred * 2.05).toFixed(1)}s
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400">Εκτιμώμενη Ιπποδύναμη</span>
                <div className="text-2xl font-black font-mono text-white">
                  {zeroToHundred < 7.5 ? '~210 BHP' : '~165 BHP'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-red-500" />
            Ιστορικό Μετρήσεων &amp; Σημείο Αναφοράς BFB
          </h4>
          <span className="text-xs text-slate-400 font-mono">1.8T 20V Telemetry</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800/80">
                <th className="pb-2 font-semibold">Ημερομηνία / Έκδοση</th>
                <th className="pb-2 font-semibold">0-100 km/h</th>
                <th className="pb-2 font-semibold">402m (1/4m)</th>
                <th className="pb-2 font-semibold">Trap Speed</th>
                <th className="pb-2 font-semibold">Σημειώσεις</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono">
              {runs.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 font-sans font-medium text-slate-200">{r.date}</td>
                  <td className="py-2.5 text-emerald-400 font-bold">{r.zeroToHundredTime}s</td>
                  <td className="py-2.5 text-slate-300">{r.quarterMileTime}s</td>
                  <td className="py-2.5 text-slate-300">{r.quarterMileTrapSpeed} km/h</td>
                  <td className="py-2.5 font-sans text-slate-400 text-[11px]">{r.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
