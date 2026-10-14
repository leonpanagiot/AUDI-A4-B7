import React from 'react';
import { Zap } from 'lucide-react';

interface Props {
  rpm: number;
  speed: number;
  size?: number;
}

export const RpmRevCounter: React.FC<Props> = ({ rpm, speed, size = 280 }) => {
  const minRpm = 0;
  const maxRpm = 8000;
  const minAngle = -135;
  const maxAngle = 135;

  const rpmToAngle = (val: number) => {
    const clamped = Math.max(minRpm, Math.min(maxRpm, val));
    const fraction = (clamped - minRpm) / (maxRpm - minRpm);
    return minAngle + fraction * (maxAngle - minAngle);
  };

  const currentAngle = rpmToAngle(rpm);
  const isShiftWarning = rpm >= 6400;

  // Estimate gear based on speed & rpm (Audi 1.8T BFB 5/6-speed manual ratios)
  const getGear = () => {
    if (speed < 3 || rpm < 700) return 'N';
    const ratio = (speed / rpm) * 1000;
    if (ratio < 11) return '1';
    if (ratio < 19) return '2';
    if (ratio < 28) return '3';
    if (ratio < 37) return '4';
    if (ratio < 46) return '5';
    return '6';
  };

  const center = 150;
  const radius = 110;

  const ticks = [
    { val: 0, label: '0' },
    { val: 1000, label: '1' },
    { val: 2000, label: '2' },
    { val: 3000, label: '3' },
    { val: 4000, label: '4' },
    { val: 5000, label: '5' },
    { val: 6000, label: '6' },
    { val: 7000, label: '7', isRed: true },
    { val: 8000, label: '8', isRed: true },
  ];

  return (
    <div className="flex flex-col items-center select-none">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-2xl overflow-visible">
          <defs>
            <linearGradient id="bezelOuterTacho" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#334155" />
              <stop offset="50%" stop-color="#0f172a" />
              <stop offset="100%" stop-color="#1e293b" />
            </linearGradient>

            <radialGradient id="dialFaceTacho" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#161c28" />
              <stop offset="70%" stop-color="#0b0f19" />
              <stop offset="100%" stop-color="#05070c" />
            </radialGradient>

            <filter id="rpmRedGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer metal bezel */}
          <circle cx={center} cy={center} r="142" fill="url(#bezelOuterTacho)" stroke="#475569" strokeWidth="2" />
          <circle cx={center} cy={center} r="136" fill="#090d16" stroke="#1e293b" strokeWidth="1.5" />
          <circle cx={center} cy={center} r="132" fill="url(#dialFaceTacho)" />

          {/* Regular RPM arc (White/Silver 0 - 6400) */}
          <path
            d="M 72 228 A 110 110 0 1 1 205 52"
            fill="none"
            stroke="#475569"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Redline Arc (Red 6500 - 8000) */}
          <path
            d="M 205 52 A 110 110 0 0 1 228 228"
            fill="none"
            stroke="#ef4444"
            strokeWidth="7"
            strokeLinecap="round"
            filter="url(#rpmRedGlow)"
          />

          {/* Ticks */}
          {ticks.map((t, idx) => {
            const angle = rpmToAngle(t.val);
            const rad = ((angle - 90) * Math.PI) / 180;
            const innerR = radius - 18;
            const outerR = radius - 2;

            const x1 = center + innerR * Math.cos(rad);
            const y1 = center + innerR * Math.sin(rad);
            const x2 = center + outerR * Math.cos(rad);
            const y2 = center + outerR * Math.sin(rad);

            const labelR = radius - 30;
            const lx = center + labelR * Math.cos(rad);
            const ly = center + labelR * Math.sin(rad) + 4;

            return (
              <g key={idx}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={t.isRed ? '#ef4444' : '#cbd5e1'}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                <text
                  x={lx}
                  y={ly}
                  fill={t.isRed ? '#ef4444' : '#f1f5f9'}
                  fontSize="13"
                  fontFamily="Rajdhani, sans-serif"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {t.label}
                </text>
              </g>
            );
          })}

          {/* Minor intermediate ticks */}
          {Array.from({ length: 32 }).map((_, i) => {
            const rVal = i * 250;
            if (rVal % 1000 === 0) return null;
            const angle = rpmToAngle(rVal);
            const rad = ((angle - 90) * Math.PI) / 180;
            const x1 = center + (radius - 10) * Math.cos(rad);
            const y1 = center + (radius - 10) * Math.sin(rad);
            const x2 = center + (radius - 2) * Math.cos(rad);
            const y2 = center + (radius - 2) * Math.sin(rad);
            const isRed = rVal >= 6500;
            return (
              <line
                key={`sub-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isRed ? '#ef4444' : '#64748b'}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            );
          })}

          {/* Text branding */}
          <text
            x={center}
            y="95"
            fill="#64748b"
            fontFamily="Rajdhani, sans-serif"
            fontWeight="700"
            fontSize="10"
            letterSpacing="3"
            textAnchor="middle"
          >
            1/min x 1000
          </text>

          {/* Needle */}
          <g
            transform={`rotate(${currentAngle}, ${center}, ${center})`}
            className="transition-transform duration-75 ease-out"
          >
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
            <line
              x1={center}
              y1={center + 15}
              x2={center}
              y2={center - radius + 6}
              stroke={isShiftWarning ? '#ff2233' : '#ef4444'}
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#rpmRedGlow)"
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
          <circle cx={center} cy={center} r="4" fill={isShiftWarning ? '#ff2233' : '#ef4444'} />

          {/* Center Digital readout */}
          <g transform={`translate(${center}, 225)`}>
            <text
              x="0"
              y="0"
              fill={isShiftWarning ? '#ef4444' : '#f8fafc'}
              fontFamily="Orbitron, sans-serif"
              fontWeight="900"
              fontSize="24"
              letterSpacing="1"
              textAnchor="middle"
              className={isShiftWarning ? 'animate-pulse' : ''}
            >
              {rpm}
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
              RPM • {speed} KM/H
            </text>
          </g>
        </svg>

        {/* Gear badge & Shift Flash indicator */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-md px-2 py-1 text-[11px] font-mono shadow-md">
          <span className="text-slate-400 font-bold">GEAR:</span>
          <span className="text-emerald-400 font-bold text-xs">{getGear()}</span>
        </div>

        {isShiftWarning && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-600 animate-bounce text-white font-black px-2 py-0.5 rounded text-[10px] tracking-widest shadow-lg shadow-red-600/50">
            <Zap className="w-3 h-3 fill-current" />
            SHIFT!
          </div>
        )}
      </div>
    </div>
  );
};
