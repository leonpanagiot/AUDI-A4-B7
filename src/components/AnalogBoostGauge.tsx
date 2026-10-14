import React from 'react';
import { RotateCcw } from 'lucide-react';

interface Props {
  boostBar: number | null;
  boostPsi: number | null;
  peakBoostBar: number | null;
  boostSpecifiedBar?: number | null;
  onResetPeak: () => void;
  size?: number;
}

export const AnalogBoostGauge: React.FC<Props> = ({
  boostBar,
  boostPsi,
  peakBoostBar,
  boostSpecifiedBar,
  onResetPeak,
  size = 280,
}) => {
  // Boost range: -1.0 BAR (vacuum) to +2.5 BAR (overboost)
  // Total range = 3.5 BAR
  // Angle range: -135° (at -1.0 bar) to +135° (at +2.5 bar) = 270° total sweep
  const minBar = -1.0;
  const maxBar = 2.5;
  const minAngle = -135;
  const maxAngle = 135;

  const valueToAngle = (val: number) => {
    const clamped = Math.max(minBar, Math.min(maxBar, val));
    const fraction = (clamped - minBar) / (maxBar - minBar);
    return minAngle + fraction * (maxAngle - minAngle);
  };

  const currentAngle = boostBar !== null ? valueToAngle(boostBar) : valueToAngle(0);
  const peakAngle = peakBoostBar !== null ? valueToAngle(peakBoostBar) : valueToAngle(0);

  // Generate tick marks
  const ticks = [
    { val: -1.0, label: '-1.0', isMajor: true },
    { val: -0.8, isMajor: false },
    { val: -0.6, isMajor: false },
    { val: -0.4, isMajor: false },
    { val: -0.2, isMajor: false },
    { val: 0.0, label: '0.0', isMajor: true },
    { val: 0.5, label: '0.5', isMajor: true },
    { val: 1.0, label: '1.0', isMajor: true },
    { val: 1.5, label: '1.5', isMajor: true },
    { val: 2.0, label: '2.0', isMajor: true },
    { val: 2.5, label: '2.5', isMajor: true },
  ];

  const center = 150;
  const radius = 110;

  return (
    <div className="flex flex-col items-center select-none">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 300 300"
          className="w-full h-full drop-shadow-2xl overflow-visible"
        >
          <defs>
            {/* Outer bezel gradients */}
            <linearGradient id="bezelOuter" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            <radialGradient id="dialFace" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#161c28" />
              <stop offset="70%" stopColor="#0b0f19" />
              <stop offset="100%" stopColor="#05070c" />
            </radialGradient>

            <linearGradient id="boostGlowArc" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="35%" stopColor="#f8fafc" />
              <stop offset="75%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>

            <filter id="gaugeRedGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer metal bezel */}
          <circle cx={center} cy={center} r="142" fill="url(#bezelOuter)" stroke="#475569" strokeWidth="2" />
          <circle cx={center} cy={center} r="136" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />
          <circle cx={center} cy={center} r="132" fill="url(#dialFace)" />

          {/* Inner carbon ring pattern */}
          <circle cx={center} cy={center} r="95" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

          {/* Vacuum Arc (Cyan -1.0 to 0) */}
          <path
            d="M 72 228 A 110 110 0 0 1 150 40"
            fill="none"
            stroke="#0284c7"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.75"
          />

          {/* Boost Arc (Red 0 to +2.5) */}
          <path
            d="M 150 40 A 110 110 0 0 1 228 228"
            fill="none"
            stroke="#ef4444"
            strokeWidth="5"
            strokeLinecap="round"
            filter="url(#gaugeRedGlow)"
          />

          {/* Ticks and Labels */}
          {ticks.map((t, i) => {
            const angle = valueToAngle(t.val);
            const rad = ((angle - 90) * Math.PI) / 180;
            const innerR = t.isMajor ? radius - 18 : radius - 10;
            const outerR = radius - 2;

            const x1 = center + innerR * Math.cos(rad);
            const y1 = center + innerR * Math.sin(rad);
            const x2 = center + outerR * Math.cos(rad);
            const y2 = center + outerR * Math.sin(rad);

            // Label position
            const labelR = radius - 30;
            const lx = center + labelR * Math.cos(rad);
            const ly = center + labelR * Math.sin(rad) + 4;

            const isRedZone = t.val >= 1.2;
            const isVacuum = t.val < 0;

            return (
              <g key={i}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isRedZone ? '#ef4444' : isVacuum ? '#38bdf8' : '#e2e8f0'}
                  strokeWidth={t.isMajor ? 3 : 1.5}
                  strokeLinecap="round"
                />
                {t.isMajor && t.label && (
                  <text
                    x={lx}
                    y={ly}
                    fill={isRedZone ? '#f87171' : '#94a3b8'}
                    fontSize="11"
                    fontFamily="Rajdhani, sans-serif"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {t.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Audi RS BFB Badge on Dial */}
          <g transform={`translate(${center - 45}, 90)`}>
            <rect x="0" y="0" width="90" height="22" rx="4" fill="#0b0f19" stroke="#ef4444" strokeWidth="1.2" opacity="0.9" />
            <rect x="2" y="2" width="16" height="18" rx="2" fill="#ef4444" />
            <text
              x="53"
              y="15"
              fill="#ffffff"
              fontFamily="Orbitron, sans-serif"
              fontWeight="900"
              fontSize="11"
              letterSpacing="2"
              textAnchor="middle"
            >
              1.8T BFB
            </text>
          </g>

          {/* Peak Boost indicator needle (translucent orange marker) */}
          <g transform={`rotate(${peakAngle}, ${center}, ${center})`}>
            <line
              x1={center}
              y1={center - radius + 5}
              x2={center}
              y2={center - radius + 24}
              stroke="#f59e0b"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.85"
            />
          </g>

          {/* Main Needle */}
          <g
            transform={`rotate(${currentAngle}, ${center}, ${center})`}
            className="transition-transform duration-75 ease-out"
          >
            {/* Needle shadow */}
            <line
              x1={center + 3}
              y1={center + 12}
              x2={center + 3}
              y2={center - radius + 6}
              stroke="#000000"
              strokeWidth="5"
              opacity="0.4"
              strokeLinecap="round"
            />
            {/* Red Needle */}
            <line
              x1={center}
              y1={center + 15}
              x2={center}
              y2={center - radius + 6}
              stroke="#ef4444"
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#gaugeRedGlow)"
            />
            <line
              x1={center}
              y1={center - 30}
              x2={center}
              y2={center - radius + 8}
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>

          {/* Center Hub */}
          <circle cx={center} cy={center} r="18" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          <circle cx={center} cy={center} r="10" fill="#0f172a" />
          <circle cx={center} cy={center} r="4" fill="#ef4444" />

          {/* Vacuum / Boost label */}
          <text
            x={center - 45}
            y="200"
            fill="#38bdf8"
            fontFamily="Rajdhani, sans-serif"
            fontWeight="700"
            fontSize="10"
            letterSpacing="1"
            textAnchor="middle"
          >
            VACUUM
          </text>
          <text
            x={center + 45}
            y="200"
            fill="#ef4444"
            fontFamily="Rajdhani, sans-serif"
            fontWeight="700"
            fontSize="10"
            letterSpacing="1"
            textAnchor="middle"
          >
            BOOST
          </text>

          {/* Center Digital Display */}
          <g transform={`translate(${center}, 225)`}>
            <text
              x="0"
              y="0"
              fill={boostBar !== null ? (boostBar >= 1.2 ? '#ef4444' : boostBar > 0 ? '#38bdf8' : '#94a3b8') : '#94a3b8'}
              fontFamily="Orbitron, sans-serif"
              fontWeight="900"
              fontSize="24"
              letterSpacing="1"
              textAnchor="middle"
            >
              {boostBar !== null ? (boostBar >= 0 ? `+${boostBar.toFixed(2)}` : boostBar.toFixed(2)) : 'N/A'}
            </text>
            <text
              x="0"
              y="16"
              fill="#94a3b8"
              fontFamily="Rajdhani, sans-serif"
              fontWeight="600"
              fontSize="12"
              letterSpacing="2"
              textAnchor="middle"
            >
              {boostPsi !== null ? `BAR • ${boostPsi >= 0 ? `+${boostPsi.toFixed(1)}` : boostPsi.toFixed(1)} PSI` : '010B / KWP 115: N/A'}
            </text>
          </g>
        </svg>

        {/* Specified Boost badge (left) */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-md px-2 py-1 text-[11px] font-mono shadow-md">
          <span className="text-sky-400 font-bold">SPEC:</span>
          <span className="text-white font-bold">
            {boostSpecifiedBar !== null && boostSpecifiedBar !== undefined
              ? `${boostSpecifiedBar >= 0 ? '+' : ''}${boostSpecifiedBar.toFixed(2)}`
              : 'N/A'}
          </span>
          <span className="text-slate-400 text-[10px]">BAR</span>
        </div>

        {/* Peak memory badge & reset button (right) */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-md px-2 py-1 text-[11px] font-mono shadow-md">
          <span className="text-amber-400 font-bold">PEAK:</span>
          <span className="text-white font-bold">
            {peakBoostBar !== null ? `${peakBoostBar >= 0 ? '+' : ''}${peakBoostBar.toFixed(2)}` : 'N/A'}
          </span>
          <span className="text-slate-400 text-[10px]">BAR</span>
          <button
            onClick={onResetPeak}
            title="Επαναφορά Μέγιστης Πίεσης"
            className="text-slate-400 hover:text-white p-0.5 rounded transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
