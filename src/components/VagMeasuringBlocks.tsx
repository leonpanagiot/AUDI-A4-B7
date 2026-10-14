import React, { useState } from 'react';
import { Layers, Activity, AlertCircle, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';
import { TelemetryData } from '../types/telemetry';
import { obdEngine } from '../services/obdService';

interface Props {
  telemetry: TelemetryData;
}

export const VagMeasuringBlocks: React.FC<Props> = ({ telemetry }) => {
  const blocks = obdEngine.getVagMeasuringBlocks(telemetry);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | 'all'>('all');

  const selectedBlocks = activeGroupIndex === 'all' ? blocks : [blocks[activeGroupIndex]];

  return (
    <div className="space-y-4">
      {/* Header & Group Selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              Ομαδες Μετρησης VAG-COM / VCDS (Measuring Blocks 001-120)
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              ECU ME7.5
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ζωντανή παρακολούθηση καναλιών διάγνωσης VAG για Audi 1.8T BFB (Πίεση mbar, MAF g/s, Knock CF, N75 %).
          </p>
        </div>

        {/* Group Filter Buttons */}
        <div className="flex items-center flex-wrap gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveGroupIndex('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeGroupIndex === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Όλα τα Groups
          </button>
          {blocks.map((b, idx) => (
            <button
              key={b.groupNum}
              onClick={() => setActiveGroupIndex(idx)}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeGroupIndex === idx
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Group {b.groupNum}
            </button>
          ))}
        </div>
      </div>

      {/* Blocks Display */}
      <div className="space-y-4">
        {selectedBlocks.map((group) => (
          <div
            key={group.groupNum}
            className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md hover:border-slate-700 transition"
          >
            {/* Group Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-mono font-bold text-xs">
                  {group.groupNum}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white">{group.greekTitle}</h4>
                  <p className="text-[11px] text-slate-400">{group.description}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded self-start sm:self-auto">
                Sampling 10 Hz
              </span>
            </div>

            {/* 4 Measuring Fields Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 font-mono">
              {group.fields.map((field, fIdx) => (
                <div
                  key={fIdx}
                  className={`p-3 rounded-lg border transition-all ${
                    field.isWarning
                      ? 'bg-rose-950/40 border-rose-500/50 text-rose-200 shadow-md shadow-rose-950/30'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans mb-1">
                    <span className="font-semibold uppercase tracking-wider truncate">
                      Field {fIdx + 1}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      [{field.normalRange}]
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 block font-sans truncate mb-1">
                    {field.label}
                  </span>

                  <div className="flex items-baseline justify-between mt-1">
                    <span className={`text-lg sm:text-xl font-black tracking-tight ${
                      field.isWarning ? 'text-rose-400 animate-pulse' : 'text-white'
                    }`}>
                      {field.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* VAG Tuning Diagnostic Notes */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400">
        <h5 className="font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          Οδηγός Ανάγνωσης Τιμών VAG για Audi 1.8T BFB
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] leading-relaxed">
          <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
            <strong className="text-white block mb-0.5">Group 115 (Έλεγχος Boost Leak)</strong>
            Συγκρίνετε τη στήλη 3 (Specified) με τη στήλη 4 (Actual). Αν η πραγματική πίεση είναι χαμηλότερη από 200 mbar, υπάρχει διαρροή αέρα ή σκάστρα με τρύπια μεμβράνη.
          </div>
          <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
            <strong className="text-white block mb-0.5">Group 020 (Retard Ανάφλεξης)</strong>
            Τιμές έως 3.0° CF είναι απολύτως φυσιολογικές. Αν ξεπερνούν τους 5.5° - 6.0°, ο εγκέφαλος κόβει αβάνς λόγω καυσίμου χαμηλών οκτανίων ή υψηλής θερμοκρασίας IAT.
          </div>
          <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
            <strong className="text-white block mb-0.5">Group 002 (Υπολογισμός Ίππων)</strong>
            Στο κόφτη με τέρμα γκάζι (WOT) σε 3η ταχύτητα: MAF (g/s) / 0.8 = Ιπποδύναμη (BHP). Π.χ. 165 g/s / 0.8 = 206 ίπποι!
          </div>
        </div>
      </div>
    </div>
  );
};
