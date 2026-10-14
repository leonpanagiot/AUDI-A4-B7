import React, { useState } from 'react';
import { FlipHorizontal, Maximize2, Minimize2, X, Zap, Gauge } from 'lucide-react';
import { TelemetryData } from '../types/telemetry';

interface Props {
  telemetry: TelemetryData;
  onClose: () => void;
}

export const HudDisplay: React.FC<Props> = ({ telemetry, onClose }) => {
  const [isMirrored, setIsMirrored] = useState(false);
  const [hudColor, setHudColor] = useState<'neon-green' | 'ice-cyan' | 'audi-red'>('neon-green');

  const { speed, rpm, boostBar, mafGramsPerSec, coolantTemp, iat } = telemetry;
  const isShiftWarning = rpm !== null && rpm >= 6400;

  // Estimate gear
  const getGear = () => {
    if (speed === null || rpm === null) return 'N/A';
    if (speed < 3 || rpm < 700) return 'N';
    const ratio = (speed / rpm) * 1000;
    if (ratio < 11) return '1';
    if (ratio < 19) return '2';
    if (ratio < 28) return '3';
    if (ratio < 37) return '4';
    if (ratio < 46) return '5';
    return '6';
  };

  const colorStyles = {
    'neon-green': {
      text: 'text-emerald-400',
      bgGlow: 'shadow-emerald-500/30',
      border: 'border-emerald-500/40',
      bar: 'bg-emerald-400',
    },
    'ice-cyan': {
      text: 'text-cyan-400',
      bgGlow: 'shadow-cyan-500/30',
      border: 'border-cyan-500/40',
      bar: 'bg-cyan-400',
    },
    'audi-red': {
      text: 'text-rose-500',
      bgGlow: 'shadow-rose-500/30',
      border: 'border-rose-500/40',
      bar: 'bg-rose-500',
    },
  }[hudColor];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4 sm:p-8 select-none overflow-hidden">
      {/* Shift light bar across top edge */}
      <div
        className={`fixed top-0 left-0 right-0 h-3 transition-colors duration-75 ${
          isShiftWarning ? 'bg-red-600 animate-ping' : 'bg-transparent'
        }`}
      />

      {/* Top HUD Controls (un-mirrored for easy pressing, or mirrored toggle) */}
      <div className="flex items-center justify-between text-xs text-slate-400 relative z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMirrored(!isMirrored)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
              isMirrored
                ? 'bg-amber-600 border-amber-500 text-white shadow-lg'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Αντιστροφή εικόνας για αντανάκλαση στο παρμπρίζ"
          >
            <FlipHorizontal className="w-4 h-4" />
            <span>{isMirrored ? 'Καθρέπτης: ON' : 'Καθρέπτης Παρμπρίζ'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setHudColor('neon-green')}
              className={`w-5 h-5 rounded-full bg-emerald-500 ${hudColor === 'neon-green' ? 'ring-2 ring-white' : ''}`}
            />
            <button
              onClick={() => setHudColor('ice-cyan')}
              className={`w-5 h-5 rounded-full bg-cyan-400 ${hudColor === 'ice-cyan' ? 'ring-2 ring-white' : ''}`}
            />
            <button
              onClick={() => setHudColor('audi-red')}
              className={`w-5 h-5 rounded-full bg-rose-500 ${hudColor === 'audi-red' ? 'ring-2 ring-white' : ''}`}
            />
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold uppercase transition cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>Έξοδος HUD</span>
        </button>
      </div>

      {/* Main Mirrored/Normal Content Area */}
      <div
        className={`flex-1 flex flex-col justify-center items-center transition-transform duration-200 ${
          isMirrored ? 'scale-x-[-1]' : ''
        }`}
      >
        {/* RPM Horizon Bar */}
        <div className="w-full max-w-2xl px-4 mb-6">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 mb-1">
            <span>0</span>
            <span>2000</span>
            <span>4000</span>
            <span>6000</span>
            <span className="text-red-500">8000 RPM</span>
          </div>
          <div className="w-full bg-slate-900 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                rpm !== null && rpm >= 6400 ? 'bg-red-500 animate-pulse' : colorStyles.bar
              }`}
              style={{ width: `${rpm !== null ? Math.min(100, (rpm / 8000) * 100) : 0}%` }}
            />
          </div>
        </div>

        {/* Center Giant Speed & Gear */}
        <div className="flex items-baseline justify-center gap-6 my-4">
          <div className="text-center">
            <div className={`font-mono font-black text-8xl sm:text-9xl tracking-tighter ${colorStyles.text}`}>
              {speed !== null ? speed : 'N/A'}
            </div>
            <div className="text-sm sm:text-base font-mono uppercase tracking-widest text-slate-400 font-bold mt-1">
              KM / H
            </div>
          </div>

          {/* Big Gear indicator box */}
          <div className={`border-2 ${colorStyles.border} bg-slate-950/80 rounded-2xl px-6 py-4 text-center shadow-2xl`}>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">
              ΣΧΕΣΗ
            </span>
            <span className={`text-6xl sm:text-7xl font-mono font-black ${isShiftWarning ? 'text-red-500 animate-ping' : colorStyles.text}`}>
              {getGear()}
            </span>
          </div>
        </div>

        {/* Bottom HUD Metrics: Boost, MAF, IAT */}
        <div className="grid grid-cols-3 gap-6 sm:gap-12 mt-4 text-center font-mono">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900">
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-bold">
              ΠΙΕΣΗ (010B)
            </span>
            <span className={`text-2xl sm:text-3xl font-black ${boostBar !== null && boostBar >= 1.0 ? 'text-red-400' : colorStyles.text}`}>
              {boostBar !== null ? (boostBar >= 0 ? `+${boostBar.toFixed(2)}` : boostBar.toFixed(2)) : 'N/A'}
            </span>
            <span className="text-[10px] text-slate-400 block font-bold">BAR</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900">
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-bold">
              MAF (0110)
            </span>
            <span className={`text-2xl sm:text-3xl font-black ${colorStyles.text}`}>
              {mafGramsPerSec !== null ? mafGramsPerSec.toFixed(1) : 'N/A'}
            </span>
            <span className="text-[10px] text-slate-400 block font-bold">G/S</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900">
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-bold">
              ΨΥΚΤΙΚΟ / IAT
            </span>
            <span className={`text-2xl sm:text-3xl font-black ${colorStyles.text}`}>
              {coolantTemp !== null ? `${coolantTemp}°` : 'N/A'} / {iat !== null ? `${iat}°` : 'N/A'}
            </span>
            <span className="text-[10px] text-slate-400 block font-bold">°C</span>
          </div>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="text-center text-[11px] text-slate-400 font-mono">
        {isMirrored
          ? '✦ Τοποθετήστε το κινητό στο ταμπλό: Η αντανάκλαση στο παρμπρίζ είναι ευθεία!'
          : 'Πατήστε «Καθρέπτης Παρμπρίζ» για χρήση τη νύχτα.'}
      </div>
    </div>
  );
};
