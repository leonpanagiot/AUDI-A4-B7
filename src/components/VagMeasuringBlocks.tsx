import React, { useState } from 'react';
import { Layers, Search, ChevronLeft, ChevronRight, Plus, X, ShieldAlert, RefreshCw } from 'lucide-react';
import { TelemetryData } from '../types/telemetry';
import { obdEngine } from '../services/obdService';

interface Props {
  telemetry: TelemetryData;
}

const POPULAR_GROUPS = ['001', '002', '003', '004', '005', '020', '031', '032', '060', '115', '118', '130'];

export const VagMeasuringBlocks: React.FC<Props> = ({ telemetry }) => {
  const [manualInput, setManualInput] = useState<string>('003');
  const [selectedGroups, setSelectedGroups] = useState<string[]>(['001', '002', '003', '004', '031', '032', '115', '130']);
  const [viewMode, setViewMode] = useState<'single' | 'multi'>('multi');
  const [singleGroupNum, setSingleGroupNum] = useState<string>('003');
  const [isQueryingEcu, setIsQueryingEcu] = useState<boolean>(false);

  const formatGroupStr = (val: string | number): string => {
    const parsed = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
    if (isNaN(parsed) || parsed < 1) return '001';
    if (parsed > 255) return '255';
    return parsed.toString().padStart(3, '0');
  };

  const triggerRealEcuGroupQuery = async (formattedGroup: string) => {
    setIsQueryingEcu(true);
    try {
      await obdEngine.queryVagGroupFromEcu(formattedGroup);
    } finally {
      setIsQueryingEcu(false);
    }
  };

  const handleManualSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const formatted = formatGroupStr(manualInput);
    setManualInput(formatted);
    setSingleGroupNum(formatted);
    setViewMode('single');
    if (!selectedGroups.includes(formatted)) {
      setSelectedGroups(prev => [formatted, ...prev]);
    }
    await triggerRealEcuGroupQuery(formatted);
  };

  const handleStepGroup = async (delta: number) => {
    const currentInt = parseInt(singleGroupNum, 10) || 1;
    const nextInt = Math.max(1, Math.min(255, currentInt + delta));
    const formatted = nextInt.toString().padStart(3, '0');
    setManualInput(formatted);
    setSingleGroupNum(formatted);
    setViewMode('single');
    await triggerRealEcuGroupQuery(formatted);
  };

  const handleAddGroupToMulti = async () => {
    const formatted = formatGroupStr(manualInput);
    setManualInput(formatted);
    if (!selectedGroups.includes(formatted)) {
      setSelectedGroups(prev => [formatted, ...prev]);
    }
    setViewMode('multi');
    await triggerRealEcuGroupQuery(formatted);
  };

  const handleRemoveGroupFromMulti = (grp: string) => {
    if (selectedGroups.length <= 1) return;
    setSelectedGroups(prev => prev.filter(g => g !== grp));
  };

  const handleQuickSelect = async (grp: string) => {
    setManualInput(grp);
    setSingleGroupNum(grp);
    setViewMode('single');
    await triggerRealEcuGroupQuery(grp);
  };

  const displayedGroups =
    viewMode === 'single'
      ? [obdEngine.getVagGroupByNumber(singleGroupNum, telemetry)]
      : selectedGroups.map(g => obdEngine.getVagGroupByNumber(g, telemetry));

  return (
    <div className="space-y-4">
      {/* Separate standard OBD-II information, not VAG measuring groups. */}
      <section className="bg-slate-900/90 border border-cyan-800/60 rounded-xl p-4 space-y-3">
        <h3 className="text-white font-bold text-base">Πληροφορίες ECU / OBD-II — Επιβεβαιωμένα PID</h3>
        <p className="text-xs text-slate-400">Οι τιμές κατάστασης παρακάτω προέρχονται από την τελευταία φωτογραφία σάρωσης (όχι ζωντανή επανάληψη). Οι τιμές Lambda/O2 ανανεώνονται από την τηλεμετρία όταν είναι διαθέσιμες.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            ['0101', 'Check Engine / DTC / Readiness', 'MIL OFF · 7 δηλωμένοι DTC · Readiness 07 6D 29'],
            ['0103', 'Σύστημα καυσίμου', 'Open loop λόγω φορτίου · Σύστημα 2 μη διαθέσιμο'],
            ['0112', 'Δευτερεύων αέρας', 'Εξωτερική ατμόσφαιρα'],
            ['0113', 'Παρουσία αισθητήρων οξυγόνου', 'Bank 1 Sensor 1 και Sensor 2'],
            ['011C', 'Πρότυπο OBD', 'EOBD (Ευρωπαϊκό)'],
            ['0121', 'Απόσταση με αναμμένη MIL', '0 km'],
          ].map(([pid, label, value]) => <div key={pid} className="bg-slate-950/70 rounded-lg border border-slate-800 p-3">
            <span className="text-xs text-cyan-400 font-mono">{pid}</span>
            <div className="text-xs text-slate-400 mt-1">{label}</div>
            <div className="text-sm font-semibold text-white mt-1">{value}</div>
          </div>)}
        </div>
        <h4 className="text-sm font-bold text-white">Ζωντανές μετρήσεις αισθητήρων οξυγόνου</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-950/70 rounded-lg p-3 border border-slate-800">
            <div className="text-xs text-slate-400">0134 · B1S1 · Lambda πριν τον καταλύτη</div>
            <div className="text-xl font-bold text-white">{telemetry.lambda === null ? 'N/A' : telemetry.lambda.toFixed(3) + ' λ'}</div>
          </div>
          <div className="bg-slate-950/70 rounded-lg p-3 border border-slate-800">
            <div className="text-xs text-slate-400">0115 · B1S2 · O2 μετά τον καταλύτη</div>
            <div className="text-xl font-bold text-white">{telemetry.o2SensorAfterVoltage === null ? 'N/A' : telemetry.o2SensorAfterVoltage.toFixed(3) + ' V'}</div>
          </div>
        </div>
        <p className="text-xs text-slate-400">Το 0113 δείχνει ποιοι αισθητήρες υπάρχουν, όχι τι μετρούν. Το 0134 δείχνει το πραγματικό λ του μείγματος και το 0115 την τάση του αισθητήρα μετά τον καταλύτη.</p>
      </section>
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
                REAL ECU READ ONLY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Εμφανίζονται <strong>αποκλειστικά πραγματικές μετρήσεις από την ECU</strong> (KWP2000 Service 21 ή OBD-II Mode 01). Όσα πεδία δεν υποστηρίζονται από την ECU εμφανίζουν <strong>N/A</strong>.
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
                disabled={isQueryingEcu}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer disabled:opacity-50"
                title="Προηγούμενο Group (-1)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="text"
                inputMode="numeric"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="π.χ. 003 ή 115"
                className="w-24 sm:w-28 bg-slate-900 border border-blue-500/50 focus:border-blue-400 rounded-lg px-3 py-1.5 text-center font-mono text-base font-black text-white focus:outline-none"
              />

              <button
                type="button"
                onClick={() => handleStepGroup(1)}
                disabled={isQueryingEcu}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer disabled:opacity-50"
                title="Επόμενο Group (+1)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="submit"
              disabled={isQueryingEcu}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md shadow-blue-600/30"
            >
              {isQueryingEcu ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>{isQueryingEcu ? 'Ανάγνωση ECU...' : 'Ανάγνωση Group από ECU'}</span>
            </button>

            <button
              type="button"
              onClick={handleAddGroupToMulti}
              disabled={isQueryingEcu}
              className="hidden md:flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition active:scale-95 cursor-pointer"
              title="Προσθήκη αυτού του Group στη λίστα ταυτόχρονης προβολής"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Προσθήκη στη Λίστα</span>
            </button>
          </div>

          {/* Quick Jump Popular ME7.5 Groups */}
          <div className="flex items-center flex-wrap gap-1 text-[11px] font-mono">
            <span className="text-slate-400 mr-1 font-sans">Groups:</span>
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
                {group.sourceMode && (
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded">
                    {group.sourceMode}
                  </span>
                )}
                <button
                  onClick={() => triggerRealEcuGroupQuery(group.groupNum)}
                  disabled={isQueryingEcu}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-blue-600 text-[10px] font-mono font-bold text-slate-200 hover:text-white transition cursor-pointer"
                >
                  Query ECU
                </button>
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
              {group.fields.map((field, fIdx) => {
                const isNa = field.value === 'N/A';
                return (
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
                        Field {fIdx + 1} {field.sourcePid ? `(${field.sourcePid})` : ''}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        [{field.normalRange}]
                      </span>
                    </div>

                    <span className="text-xs text-slate-400 block font-sans truncate mb-1">
                      {field.label}
                    </span>

                    <div className="flex items-baseline justify-between mt-1">
                      <span
                        className={`text-lg sm:text-xl font-black tracking-tight ${
                          field.isWarning
                            ? 'text-rose-400 animate-pulse'
                            : isNa
                            ? 'text-slate-500'
                            : 'text-white'
                        }`}
                      >
                        {field.value}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* VAG Technical Note on K-Line ISO 9141-2 vs KWP2000 */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400">
        <h5 className="font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          Τεχνική Σημείωση Ανάγνωσης VAG Groups μέσω ELM327
        </h5>
        <p className="text-[11px] leading-relaxed">
          Τα Groups <strong>001, 003, 004, 005, 031, 032, 033, 130</strong> περιέχουν παραμέτρους που διαβάζονται απευθείας από τα πραγματικά PIDs του προτύπου OBD-II Mode 01 (<code className="text-slate-200">010C, 0104, 0105, 0106, 0107, 010D, 010E, 010F, 0110, 0111, 0115, 0124, 015C</code>). Πεδία που απαιτούν αποκλειστικό πρωτόκολλο VAG KWP2000 Service 21 (όπως <code className="text-slate-200">Knock Retard 2114</code>, <code className="text-slate-200">Injection Time 2102</code>, <code className="text-slate-200">N75 2176</code>) ελέγχονται με πραγματική εντολή <code className="text-slate-200">21 XX</code> στην ECU και εμφανίζουν αυστηρά <strong>N/A</strong> αν το dongle/πρωτόκολλο επιστρέψει <code className="text-slate-200">NO DATA</code>.
        </p>
      </div>
    </div>
  );
};
