import React, { useState } from 'react';
import { Gauge, Zap, Flame, Trophy, Play, CheckCircle } from 'lucide-react';
import { TelemetryData, EngineStageId } from '../types/telemetry';
import { ENGINE_STAGES, obdEngine } from '../services/obdService';

interface Props {
  telemetry: TelemetryData;
  currentStage: EngineStageId;
}

export const DynoPowerGraph: React.FC<Props> = ({ telemetry, currentStage }) => {
  const [hoverRpm, setHoverRpm] = useState<number | null>(null);
  const stageConf = ENGINE_STAGES[currentStage];
  const { rpm, calculatedHp, calculatedTorque } = telemetry;

  // Generate dyno curve points for current stage from 1500 to 7200 RPM
  const generateDynoCurve = (stage: EngineStageId) => {
    const conf = ENGINE_STAGES[stage];
    const peakHp = conf.peakHp;
    const peakTorque = conf.peakTorqueNm;
    const revLimit = conf.revLimit;

    const points: { rpm: number; hp: number; torque: number }[] = [];

    for (let r = 1500; r <= revLimit; r += 200) {
      let torque = 0;
      // Realistic 1.8T BFB turbo torque curve:
      // Rapid spool up from 1800 to 2800 RPM
      if (r < 2200) {
        torque = 140 + ((r - 1500) / 700) * (peakTorque * 0.7 - 140);
      } else if (r < 3400) {
        // Spooling to peak torque
        torque = peakTorque * 0.7 + ((r - 2200) / 1200) * (peakTorque * 0.3);
      } else if (r < 4800) {
        // Flat torque plateau
        torque = peakTorque - ((r - 3400) / 1400) * 15;
      } else {
        // Tapering torque at high RPM due to small K03 turbine housing
        torque = peakTorque - 15 - ((r - 4800) / (revLimit - 4800)) * (peakTorque * 0.35);
      }

      // HP = (Torque * RPM) / 7120
      const hp = Math.round((torque * r) / 7120);

      points.push({ rpm: r, hp, torque: Math.round(torque) });
    }

    return points;
  };

  const curve = generateDynoCurve(currentStage);
  const stockCurve = generateDynoCurve('stock');

  const maxHp = Math.max(...curve.map(p => p.hp), 320);
  const maxTorque = Math.max(...curve.map(p => p.torque), 420);

  // SVG coordinate helpers
  const svgWidth = 700;
  const svgHeight = 280;
  const padding = { top: 30, right: 40, bottom: 40, left: 50 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const minRpm = 1500;
  const maxRpm = 7200;

  const getX = (r: number) => {
    return padding.left + ((r - minRpm) / (maxRpm - minRpm)) * graphWidth;
  };

  const getYHp = (hpVal: number) => {
    return padding.top + graphHeight - (hpVal / maxHp) * graphHeight;
  };

  const getYTorque = (tVal: number) => {
    return padding.top + graphHeight - (tVal / maxTorque) * graphHeight;
  };

  // Build SVG path strings
  const hpPath = curve.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.rpm)} ${getYHp(p.hp)}`).join(' ');
  const torquePath = curve.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.rpm)} ${getYTorque(p.torque)}`).join(' ');
  const stockHpPath = stockCurve.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.rpm)} ${getYHp(p.hp)}`).join(' ');

  const currentX = rpm !== null ? getX(Math.max(minRpm, Math.min(maxRpm, rpm))) : null;

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Δυναμομετρηση σε Πραγματικο Χρονο (Dyno Power Curve)
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white">
              {stageConf.name}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Καμπύλες Ιπποδύναμης (BHP) και Ροπής (Nm) σε σχέση με τις πραγματικές στροφές κινητήρα (RPM).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right font-mono">
            <span className="text-[10px] text-slate-400 block font-sans">Ζωντανή Ισχύς / Ροπή ECU</span>
            <span className="text-lg font-black text-red-400">
              {calculatedHp !== null ? `${calculatedHp} BHP` : 'N/A'}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-bold">
              ({calculatedTorque !== null ? `${calculatedTorque} Nm` : 'N/A'})
            </span>
          </div>
        </div>
      </div>

      {/* SVG Dyno Graph Card */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Legend */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4 text-xs font-mono">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 font-bold text-red-400">
              <span className="w-3.5 h-1 bg-red-500 rounded-full inline-block" />
              Ιπποδύναμη (BHP) - Peak: {stageConf.peakHp} HP
            </span>
            <span className="flex items-center gap-1.5 font-bold text-blue-400">
              <span className="w-3.5 h-1 bg-blue-500 rounded-full inline-block" />
              Ροπή (Nm) - Peak: {stageConf.peakTorqueNm} Nm
            </span>
            {currentStage !== 'stock' && (
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-3.5 h-0.5 border-t border-dashed border-slate-400 inline-block" />
                Stock OEM (163 PS)
              </span>
            )}
          </div>

          <span className="text-slate-400 text-[11px] font-sans">
            Στροφές: <strong className="text-white font-mono">{rpm !== null ? `${rpm} RPM` : 'N/A'}</strong>
          </span>
        </div>

        {/* Graph SVG */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto min-w-[500px]"
          >
            <defs>
              <linearGradient id="hpAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="torqueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[2000, 3000, 4000, 5000, 6000, 7000].map((rVal) => (
              <g key={rVal}>
                <line
                  x1={getX(rVal)}
                  y1={padding.top}
                  x2={getX(rVal)}
                  y2={padding.top + graphHeight}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={getX(rVal)}
                  y={padding.top + graphHeight + 18}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="Rajdhani, sans-serif"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {rVal}
                </text>
              </g>
            ))}

            {/* Horizontal Grid (HP / Torque levels) */}
            {[100, 200, 300].map((level) => (
              <g key={level}>
                <line
                  x1={padding.left}
                  y1={getYHp(level)}
                  x2={padding.left + graphWidth}
                  y2={getYHp(level)}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={getYHp(level) + 4}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {level}
                </text>
              </g>
            ))}

            {/* Stock HP dotted line */}
            {currentStage !== 'stock' && (
              <path
                d={stockHpPath}
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray="3 3"
                opacity="0.6"
              />
            )}

            {/* Stage Torque Curve (Blue) */}
            <path
              d={torquePath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Stage HP Curve (Red) */}
            <path
              d={hpPath}
              fill="none"
              stroke="#ef4444"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Current RPM Cursor Line */}
            {currentX !== null && (
              <line
                x1={currentX}
                y1={padding.top}
                x2={currentX}
                y2={padding.top + graphHeight}
                stroke="#f59e0b"
                strokeWidth="2"
              />
            )}
            {currentX !== null && calculatedHp !== null && (
              <circle
                cx={currentX}
                cy={getYHp(calculatedHp)}
                r="6"
                fill="#ef4444"
                stroke="#ffffff"
                strokeWidth="2"
              />
            )}
            {currentX !== null && calculatedTorque !== null && (
              <circle
                cx={currentX}
                cy={getYTorque(calculatedTorque)}
                r="5"
                fill="#3b82f6"
                stroke="#ffffff"
                strokeWidth="2"
              />
            )}
          </svg>
        </div>

        {/* Bottom Dyno Specs & Gains */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Μέγιστη Ιπποδύναμη</span>
            <span className="text-base font-black text-red-400 font-mono">{stageConf.peakHp} BHP</span>
            <span className="text-[10px] text-slate-400 block">@ 5600 RPM</span>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Μέγιστη Ροπή</span>
            <span className="text-base font-black text-blue-400 font-mono">{stageConf.peakTorqueNm} Nm</span>
            <span className="text-[10px] text-slate-400 block">@ 3100 RPM</span>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Κέρδος έναντι Stock</span>
            <span className="text-base font-black text-emerald-400 font-mono">
              +{stageConf.peakHp - 163} HP / +{stageConf.peakTorqueNm - 225} Nm
            </span>
            <span className="text-[10px] text-slate-400 block">Audi 1.8T BFB</span>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Όριο Στροφών (Rev Limit)</span>
            <span className="text-base font-black text-amber-400 font-mono">{stageConf.revLimit} RPM</span>
            <span className="text-[10px] text-slate-400 block">Hard Cut Limiter</span>
          </div>
        </div>
      </div>
    </div>
  );
};
