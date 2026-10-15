import React from 'react';
import { Wind, Flame, Thermometer, Activity, Battery, Compass } from 'lucide-react';
import { TelemetryData } from '../types/telemetry';

interface Props {
  telemetry: TelemetryData;
}

export const TelemetryGrid: React.FC<Props> = ({ telemetry }) => {
  const {
    mafGramsPerSec,
    engineLoad,
    lambda,
    afr,
    ignitionTiming,
    coolantTemp,
    iat,
    shortTermFuelTrim,
    longTermFuelTrim,
    o2SensorVoltage,
    o2SensorAfterVoltage,
    lambdaSpecified,
    batteryVoltage,
    throttlePosition,
  } = telemetry;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* 1. MAF (0110) & Engine Load (0104) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-blue-400" />
            MAF (PID 0110)
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold">
            Load: {engineLoad !== null ? `${engineLoad.toFixed(1)}%` : 'N/A'}
          </span>
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-white tracking-tight">
              {mafGramsPerSec !== null ? mafGramsPerSec.toFixed(2) : 'N/A'}
            </span>
            {mafGramsPerSec !== null && <span className="text-xs text-slate-400 font-bold">g/s</span>}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
            Φορτίο (0104):{' '}
            <strong className="text-slate-200">
              {engineLoad !== null ? `${engineLoad.toFixed(1)}%` : 'N/A'}
            </strong>
          </p>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-150"
            style={{ width: `${mafGramsPerSec !== null ? Math.min(100, (mafGramsPerSec / 190) * 100) : 0}%` }}
          />
        </div>
      </div>

      {/* 2. AFR, Wideband Lambda (0124/0134), Lambda Spec (0144) & O2 Voltage (0114/0115) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Lambda &amp; O2
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-semibold">
            {lambda !== null ? `λ ${lambda.toFixed(3)}` : 'λ N/A'}
          </span>
        </div>
        <div className="my-2">
          <div className="flex items-baseline justify-between gap-1.5">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono tracking-tight text-white">
                {afr !== null ? afr.toFixed(1) : 'N/A'}
              </span>
              {afr !== null && <span className="text-xs text-slate-400 font-bold">: 1</span>}
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Spec: <strong className="text-slate-200">{lambdaSpecified !== null ? lambdaSpecified.toFixed(3) : 'N/A'}</strong>
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono flex items-center justify-between">
            <span>
              B1S1: <strong className="text-slate-200">{o2SensorVoltage !== null ? `${o2SensorVoltage.toFixed(3)}V` : 'N/A'}</strong>
            </span>
            <span>
              B1S2: <strong className="text-slate-200">{o2SensorAfterVoltage !== null ? `${o2SensorAfterVoltage.toFixed(3)}V` : 'N/A'}</strong>
            </span>
          </p>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
          <div
            className="h-full rounded-full transition-all duration-150 bg-amber-400"
            style={{ width: `${afr !== null ? Math.min(100, Math.max(10, ((16 - afr) / 6) * 100)) : 0}%` }}
          />
        </div>
      </div>

      {/* 4. Ignition Timing (PID 010E) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-purple-400" />
            Ignition Timing
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-semibold">
            PID 010E
          </span>
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-white tracking-tight">
              {ignitionTiming !== null
                ? `${ignitionTiming > 0 ? `+${ignitionTiming.toFixed(1)}` : ignitionTiming.toFixed(1)}`
                : 'N/A'}
            </span>
            {ignitionTiming !== null && <span className="text-xs text-slate-400 font-bold">° BTDC</span>}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Πραγματική προπορεία σπινθήρα (010E)
          </p>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-purple-500 h-full rounded-full transition-all duration-150"
            style={{ width: `${ignitionTiming !== null ? Math.min(100, Math.max(0, ((ignitionTiming + 10) / 45) * 100)) : 0}%` }}
          />
        </div>
      </div>

      {/* 5. Coolant temperature only */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-red-400" /> Θερμοκρασία Ψυκτικού
          </span>
          <span className="text-[10px] font-mono">PID 0105</span>
        </div>
        <div className="my-2 text-2xl font-black font-mono text-white">
          {coolantTemp !== null ? `${coolantTemp} °C` : 'N/A'}
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${coolantTemp !== null ? Math.min(100, Math.max(0, coolantTemp / 115 * 100)) : 0}%` }} />
        </div>
      </div>

      {/* 6. Intake Air Temp (PID 010F) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
            IAT (PID 010F)
          </span>
          <span className="text-[10px] font-mono text-cyan-400">G42</span>
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-black font-mono tracking-tight ${
                iat !== null && iat > 48 ? 'text-amber-400' : 'text-cyan-400'
              }`}
            >
              {iat !== null ? iat : 'N/A'}
            </span>
            {iat !== null && <span className="text-xs text-slate-400 font-bold">°C</span>}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Θερμοκρασία αέρα εισαγωγής (010F)
          </p>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${iat !== null && iat > 50 ? 'bg-amber-500' : 'bg-cyan-500'}`}
            style={{ width: `${iat !== null ? Math.min(100, Math.max(0, (iat / 70) * 100)) : 0}%` }}
          />
        </div>
      </div>

      {/* 7. Fuel Trims STFT (0106) & LTFT (0107) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Fuel Trims
          </span>
          <span className="text-[10px] font-mono text-slate-400">0106 / 0107</span>
        </div>
        <div className="my-2 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black font-mono text-white">
                {shortTermFuelTrim !== null
                  ? `${shortTermFuelTrim >= 0 ? '+' : ''}${shortTermFuelTrim.toFixed(1)}%`
                  : 'N/A'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">STFT (0106)</span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black font-mono text-white">
                {longTermFuelTrim !== null
                  ? `${longTermFuelTrim >= 0 ? '+' : ''}${longTermFuelTrim.toFixed(1)}%`
                  : 'N/A'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">LTFT (0107)</span>
          </div>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all"
            style={{
              width: `${
                shortTermFuelTrim !== null ? Math.min(100, Math.max(0, ((shortTermFuelTrim + 25) / 50) * 100)) : 0
              }%`
            }}
          />
        </div>
      </div>

      {/* 8. Voltage (ATRV) & Throttle (0111) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Battery className="w-3.5 h-3.5 text-amber-300" />
            Τάση &amp; Πεταλούδα
          </span>
          <span className="text-[10px] font-mono text-slate-400">ATRV / 0111</span>
        </div>
        <div className="my-2 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black font-mono text-white">
                {batteryVoltage !== null ? `${batteryVoltage.toFixed(1)} V` : 'N/A'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">Μπαταρία</span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black font-mono text-white">
                {throttlePosition !== null ? `${throttlePosition}%` : 'N/A'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">Πεταλούδα (0111)</span>
          </div>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-amber-400 h-full rounded-full transition-all"
            style={{ width: `${throttlePosition !== null ? throttlePosition : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
};
