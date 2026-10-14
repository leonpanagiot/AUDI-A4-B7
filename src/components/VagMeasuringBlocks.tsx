import React, { useState } from 'react';
import { Layers, Search, ChevronLeft, ChevronRight, Plus, X, ShieldAlert } from 'lucide-react';
import { TelemetryData } from '../types/telemetry';
import { obdEngine } from '../services/obdService';

interface Props {
  telemetry: TelemetryData;
}

const POPULAR_GROUPS = ['001', '002', '003', '004', '020', '031', '032', '060', '114', '115', '118', '120'];

export const VagMeasuringBlocks: React.FC<Props> = ({ telemetry }) => {
  const [manualInput, setManualInput] = useState<string>('115');
  const [selectedGroups, setSelectedGroups] = useState<string[]>(['002', '020', '115', '118', '031']);
  const [viewMode, setViewMode] = useState<'single' | 'multi'>('multi');
  const [singleGroupNum, setSingleGroupNum] = useState<string>('115');

  const formatGroupStr = (val: string | number): string => {
    const parsed = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
    if (isNaN(parsed) || parsed < 1) return '001';
    if (parsed > 255) return '255';
    return parsed.toString().padStart(3, '0');
  };

  const handleManualSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const formatted = formatGroupStr(manualInput);
    setManualInput(formatted);
    setSingleGroupNum(formatted);
    setViewMode('single');
    if (!selectedGroups.includes(formatted)) {
      setSelectedGroups(prev => [formatted, ...prev]);
    }
  };

  const handleStepGroup = (delta: number) => {
    const currentInt = parseInt(singleGroupNum, 10) || 1;
    const nextInt = Math.max(1, Math.min(255, currentInt + delta));
    const formatted = nextInt.toString().padStart(3, '0');
    setManualInput(formatted);
    setSingleGroupNum(formatted);
    setViewMode('single');
  };

  const handleAddGroupToMulti = () => {
    const formatted = formatGroupStr(manualInput);
    setManualInput(formatted);
    if (!selectedGroups.includes(formatted)) {
      setSelectedGroups(prev => [formatted, ...prev]);
    }
    setViewMode('multi');
  };

  const handleRemoveGroupFromMulti = (grp: string) => {
    if (selectedGroups.length <= 1) return;
    setSelectedGroups(prev => prev.filter(g => g !== grp));
  };

  const handleQuickSelect = (grp: string) => {
    setManualInput(grp);
    setSingleGroupNum(grp);
    setViewMode('single');
  };

  const displayedGroups =
    viewMode === 'single'
      ? [obdEngine.getVagGroupByNumber(singleGroupNum, telemetry)]
      : selectedGroups.map(g => obdEngine.getVagGroupByNumber(g, telemetry));

  return (
    <div className="space-y-4">
      {/* Header & Manual Group Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                Ομάδες Μέτρησης VAG-COM / VCDS (Measuring Blocks 001-255)
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                ECU ME7.5
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Πληκτρολογήστε οποιοδήποτε νούμερο Group (001 έως 255) και πατήστε <strong>«Ανάγνωση Group»</strong> για άμεση προβολή των 4 καναλιών.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('multi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                viewMode === 'multi'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Προβολή Λίστας ({selectedGroups.length} Groups)
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Μεμονωμένο Group ({singleGroupNum})
            </button>
          </div>
        </div>

        {/* VCDS Manual Group Number Input Box */}
        <form
          onSubmit={handleManualSearch}
          className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono whitespace-nowrap">
              Αριθμός Group:
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleStepGroup(-1)}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Προηγούμενο Group (-1)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="text"
                inputMode="numeric"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="π.χ. 020 ή 115"
                className="w-24 sm:w-28 bg-slate-900 border border-blue-500/50 focus:border-blue-400 rounded-lg px-3 py-1.5 text-center font-mono text-base font-black text-white focus:outline-none"
              />

              <button
                type="button"
                onClick={() => handleStepGroup(1)}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Επόμενο Group (+1)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md shadow-blue-600/30"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Ανάγνωση Group</span>
            </button>

            <button
              type="button"
              onClick={handleAddGroupToMulti}
              className="hidden md:flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition active:scale-95 cursor-pointer"
              title="Προσθήκη αυτού του Group στη λίστα ταυτόχρονης προβολής"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Προσθήκη στη Λίστα</span>
            </button>
          </div>

          {/* Quick Jump Popular ME7.5 Groups */}
          <div className="flex items-center flex-wrap gap-1 text-[11px] font-mono">
            <span className="text-slate-400 mr-1 font-sans">Γρήγορη επιλογή:</span>
            {POPULAR_GROUPS.map(g => (
              <button
                key={g}
                type="button"
                onClick={() => handleQuickSelect(g)}
                className={`px-2 py-1 rounded font-bold transition cursor-pointer ${
                  viewMode === 'single' && singleGroupNum === g
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Blocks Display */}
      <div className="space-y-4">
        {displayedGroups.map((group) => (
          <div
            key={group.groupNum}
            className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md hover:border-slate-700 transition"
          >
            {/* Group Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-mono font-black text-xs">
                  GROUP {group.groupNum}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white">{group.greekTitle}</h4>
                  <p className="text-[11px] text-slate-400">{group.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded">
                  LIVE ME7.5 DATA
                </span>
                {viewMode === 'multi' && selectedGroups.length > 1 && (
                  <button
                    onClick={() => handleRemoveGroupFromMulti(group.groupNum)}
                    className="p-1 rounded bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                    title="Αφαίρεση Group από τη λίστα"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
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
          Χρήσιμα Groups VAG για Audi 1.8T BFB (ME7.5)
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[11px] leading-relaxed">
          <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
            <strong className="text-white block mb-0.5">Group 001 / 002 / 003</strong>
            Βασικές μετρήσεις ρελαντί, Μάζα Αέρα MAF (g/s), Χρόνος Ψεκασμού Μπεκ (ms), Πεταλούδα (%) και Αβάνς (°BTDC).
          </div>
          <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
            <strong className="text-white block mb-0.5">Group 020 / 022 / 023</strong>
            Απόσυρση Αβάνς (Knock Retard CF) ανά κύλινδρο 1–4. Τιμές έως 3.0° είναι ασφαλείς. Πάνω από 5.0° δείχνουν προανάφλεξη/heatsoak.
          </div>
          <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
            <strong className="text-white block mb-0.5">Group 031 / 032 / 033</strong>
            Wideband Λάμδα (Πραγματικό vs Ζητούμενο), AFR και διορθώσεις καυσίμου Short Term (STFT) &amp; Long Term (LTFT).
          </div>
          <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
            <strong className="text-white block mb-0.5">Group 114 / 115 / 118</strong>
            Έλεγχος πίεσης Τούρμπο (Boost Specified vs Actual σε mbar), θερμοκρασία εισαγωγής (IAT) και παλμός βαλβίδας N75 (%).
          </div>
        </div>
      </div>
    </div>
  );
};
