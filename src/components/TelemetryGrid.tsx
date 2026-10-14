import React from 'react';
import { Wind, Flame, Gauge, Thermometer, ShieldAlert, Activity, Battery, Compass } from 'lucide-react';
import { TelemetryData } from '../types/telemetry';

interface Props {
  telemetry: TelemetryData;
}

export const TelemetryGrid: React.FC<Props> = ({ telemetry }) => {
  const {
    mafGramsPerSec,
    calculatedHp,
    calculatedTorque,
    lambda,
    afr,
    ignitionTiming,
    knockRetard,
    coolantTemp,
    iat,
    oilTemp,
    oilPressure,
    n75DutyCycle,
    batteryVoltage,
    throttlePosition,
  } = telemetry;

  const maxKnock = Math.max(...knockRetard);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* 1. MAF & Estimated Power */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-blue-400" />
            MAF (G70 Bosch)
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold">
            BHP: ~{calculatedHp} hp
          </span>
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-white tracking-tight">
              {mafGramsPerSec.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-bold">g/s</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
            Ροπή: <strong className="text-slate-200">{calculatedTorque} Nm</strong>
          </p>
        </div>
        {/* Progress bar relative to 200 g/s */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-150"
            style={{ width: `${Math.min(100, (mafGramsPerSec / 190) * 100)}%` }}
          />
        </div>
      </div>

      {/* 2. AFR & Lambda */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Air-Fuel Ratio
          </span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
            afr < 12.2 ? 'bg-emerald-500/15 text-emerald-400' : afr < 14.2 ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'
          }`}>
            λ {lambda.toFixed(2)}
          </span>
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-black font-mono tracking-tight ${
              afr < 12.0 ? 'text-emerald-400' : afr > 15.0 ? 'text-red-400' : 'text-white'
            }`}>
              {afr.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-bold">: 1 AFR</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {afr < 12.5 ? 'Πλούσιο (WOT Boost)' : afr > 14.8 ? 'Φτωχό (Lean)' : 'Στοιχειομετρικό (14.7)'}
          </p>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
          <div
            className={`h-full rounded-full transition-all duration-150 ${
              afr < 12.5 ? 'bg-emerald-500' : afr > 15.0 ? 'bg-red-500' : 'bg-amber-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(10, ((16 - afr) / 6) * 100))}%` }}
          />
        </div>
      </div>

      {/* 3. Knock Retard (CF) Cylinders 1-4 */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Knock Retard (CF)
          </span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
            maxKnock === 0 ? 'bg-emerald-500/10 text-emerald-400' : maxKnock < 3 ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/20 text-red-400'
          }`}>
            Max: {maxKnock.toFixed(1)}°
          </span>
        </div>
        <div className="my-1.5">
          <div className="grid grid-cols-4 gap-1 text-center font-mono">
            {knockRetard.map((cf, idx) => (
              <div key={idx} className="bg-slate-950/70 rounded p-1 border border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">Cyl {idx + 1}</span>
                <span className={`text-xs font-bold ${
                  cf === 0 ? 'text-emerald-400' : cf < 3 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {cf.toFixed(1)}°
                </span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[10px] text-slate-400">
          VAG Group 020 • {maxKnock > 3 ? 'Υψηλό retard - ελέγξτε οκτάνια!' : 'Καύση ασφαλής'}
        </p>
      </div>

      {/* 4. Ignition Timing */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-purple-400" />
            Ignition Timing
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-semibold">
            Group 011
          </span>
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-white tracking-tight">
              {ignitionTiming > 0 ? `+${ignitionTiming.toFixed(1)}` : ignitionTiming.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-bold">° BTDC</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Προπορεία σπινθήρα ανάφλεξης
          </p>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-purple-500 h-full rounded-full transition-all duration-150"
            style={{ width: `${Math.min(100, Math.max(0, (ignitionTiming / 35) * 100))}%` }}
          />
        </div>
      </div>

      {/* 5. Coolant & Oil Temp */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-red-400" />
            Θερμοκρασίες (G62)
          </span>
          <span className="text-[10px] font-mono text-slate-400">Κινητήρας</span>
        </div>
        <div className="my-2 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-black font-mono ${coolantTemp > 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                {coolantTemp}
              </span>
              <span className="text-xs text-slate-400 font-semibold">°C</span>
            </div>
            <span className="text-[10px] text-slate-400">Ψυκτικό (Νορμάλ 90°)</span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black font-mono text-amber-400">
                {oilTemp}
              </span>
              <span className="text-xs text-slate-400 font-semibold">°C</span>
            </div>
            <span className="text-[10px] text-slate-400">Λάδι • {oilPressure.toFixed(1)} bar</span>
          </div>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${coolantTemp > 98 ? 'bg-red-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(100, (coolantTemp / 115) * 100)}%` }}
          />
        </div>
      </div>

      {/* 6. Intake Air Temp (IAT) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
            IAT (Εισαγωγή)
          </span>
          <span className="text-[10px] font-mono text-cyan-400">Intercooler</span>
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-black font-mono tracking-tight ${iat > 48 ? 'text-amber-400' : 'text-cyan-400'}`}>
              {iat}
            </span>
            <span className="text-xs text-slate-400 font-bold">°C</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {iat > 50 ? 'Heatsoak - Μείωση απόδοσης' : 'Ιδανική θερμοκρασία αέρα'}
          </p>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${iat > 50 ? 'bg-amber-500' : 'bg-cyan-500'}`}
            style={{ width: `${Math.min(100, (iat / 70) * 100)}%` }}
          />
        </div>
      </div>

      {/* 7. N75 Valve Duty Cycle */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            N75 Wastegate
          </span>
          <span className="text-[10px] font-mono text-slate-400">Group 118</span>
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-white tracking-tight">
              {n75DutyCycle}
            </span>
            <span className="text-xs text-slate-400 font-bold">% Duty</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Εντολή βαλβίδας wastegate
          </p>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all"
            style={{ width: `${n75DutyCycle}%` }}
          />
        </div>
      </div>

      {/* 8. Voltage & Throttle */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Battery className="w-3.5 h-3.5 text-amber-300" />
            Μπαταρία &amp; Γκάζι
          </span>
          <span className="text-[10px] font-mono text-slate-400">Ηλεκτρικά</span>
        </div>
        <div className="my-2 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black font-mono text-white">
                {batteryVoltage.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-semibold">V</span>
            </div>
            <span className="text-[10px] text-slate-400">Δυναμό (OK)</span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black font-mono text-white">
                {throttlePosition}
              </span>
              <span className="text-xs text-slate-400 font-semibold">%</span>
            </div>
            <span className="text-[10px] text-slate-400">Πεταλούδα</span>
          </div>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-amber-400 h-full rounded-full transition-all"
            style={{ width: `${throttlePosition}%` }}
          />
        </div>
      </div>
    </div>
  );
};
