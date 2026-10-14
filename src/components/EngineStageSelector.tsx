import React, { useState } from 'react';
import { Cpu, Flame, Volume2, VolumeX, CheckCircle, Zap, ShieldAlert, Sparkles, Layers, Info, HelpCircle, AlertTriangle } from 'lucide-react';
import { obdEngine, ENGINE_STAGES } from '../services/obdService';
import { EngineStageId, FuelOctane } from '../types/telemetry';
import { audioEngine } from '../services/audioEngine';

interface Props {
  currentStage: EngineStageId;
  currentOctane: FuelOctane;
  onStageChange: (stage: EngineStageId) => void;
  onOctaneChange: (octane: FuelOctane) => void;
}

export const EngineStageSelector: React.FC<Props> = ({
  currentStage,
  currentOctane,
  onStageChange,
  onOctaneChange,
}) => {
  const [audioActive, setAudioActive] = useState(audioEngine.getIsEnabled());

  const handleStageSelect = (stageId: EngineStageId) => {
    onStageChange(stageId);
    obdEngine.setEngineStage(stageId);
  };

  const handleOctaneSelect = (octane: FuelOctane) => {
    onOctaneChange(octane);
    obdEngine.setFuelOctane(octane);
  };

  const toggleSound = () => {
    const next = !audioActive;
    setAudioActive(next);
    audioEngine.setEnabled(next);
  };

  const triggerBlowOffSound = () => {
    if (!audioActive) {
      setAudioActive(true);
      audioEngine.setEnabled(true);
    }
    audioEngine.playBlowOffSound(1.3);
  };

  const activeConf = ENGINE_STAGES[currentStage];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-5 h-5 text-red-500" />
              Προφιλ Tuning &amp; Ρυθμισεις Κινητηρα Audi 1.8T BFB
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Επιλέξτε το στάδιο του αυτοκινήτου σας (OEM Stock, Stage 1, Stage 2, Stage 3 K04) για σύγκριση τηλεμετρίας σε πραγματικό χρόνο.
          </p>
        </div>

        {/* Audio Toggle & Blow-Off Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
              audioActive
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {audioActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <span>{audioActive ? 'Ήχος ON' : 'Ήχος OFF'}</span>
          </button>

          <button
            onClick={triggerBlowOffSound}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
            title="Δοκιμή ήχου σκάστρας / blow-off valve"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Σκάστρα (Blow-Off)</span>
          </button>
        </div>
      </div>

      {/* Explanation Banner: What is this category for? */}
      <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 rounded-xl p-4 text-xs space-y-2.5">
        <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-wider">
          <HelpCircle className="w-4 h-4" />
          <span>Σε τι χρησιμεύει η κατηγορία «Στάδια Tuning»;</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          Η επιλογή σταδίου <strong>ΔΕΝ αλλάζει το πρόγραμμα (reflash) του εγκεφάλου</strong> σας — ένα απλό OBD dongle διαβάζει μόνο δεδομένα (read-only telematics) και δεν μπορεί να προγραμματίσει την ECU.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <strong className="text-white block mb-1">1. Μέτρο Σύγκρισης (Benchmark)</strong>
            Ορίζει την αναμενόμενη πίεση boost (π.χ. 0.6 bar για Stock ή 1.25 bar για Stage 1) ώστε τα όργανα να συγκρίνουν τι ζητάει η ECU με το τι αποδίδει το μοτέρ.
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <strong className="text-white block mb-1">2. Έλεγχος Διαρροής (Boost Leak)</strong>
            Αν το αμάξι σας είναι Stage 1 και στο τέρμα γκάζι βλέπετε μόνο 0.6 bar, καταλαβαίνετε αμέσως ότι έχετε διαρροή κολάρου intercooler ή κομμένη σκάστρα!
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <strong className="text-white block mb-1">3. Κλίμακα Οργάνων &amp; Dyno</strong>
            Προσαρμόζει την κόκκινη γραμμή στο μπαρόμετρο και τις κλίμακες του υπολογισμού ίππων (BHP) και ροπής (Nm).
          </div>
        </div>
      </div>

      {/* Stage Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.keys(ENGINE_STAGES) as EngineStageId[]).map((stageId) => {
          const conf = ENGINE_STAGES[stageId];
          const isSelected = currentStage === stageId;

          return (
            <button
              key={stageId}
              onClick={() => handleStageSelect(stageId)}
              className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-b from-red-950/60 to-slate-900 border-red-500/80 shadow-lg shadow-red-950/30 ring-1 ring-red-500'
                  : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800 text-slate-300'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <CheckCircle className="w-3 h-3" />
                  Ενεργο
                </div>
              )}

              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold uppercase tracking-wider">
                  {conf.badge}
                </span>
                <h4 className="text-sm font-bold text-white mt-2">{conf.name}</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  {conf.greekDescription}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Μέγιστη Πίεση</span>
                  <span className="font-bold text-red-400">+{conf.maxBoostBar} bar</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Ροπή</span>
                  <span className="font-bold text-blue-400">{conf.peakTorqueNm} Nm</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Fuel Octane selector & Active setup summary */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Octane choices */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" />
            Καύσιμο Αναφοράς (RON):
          </span>
          <div className="flex items-center gap-1.5">
            {([95, 98, 100] as FuelOctane[]).map((oct) => (
              <button
                key={oct}
                onClick={() => handleOctaneSelect(oct)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  currentOctane === oct
                    ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                }`}
              >
                {oct} RON
              </button>
            ))}
          </div>
        </div>

        {/* Hardware spec info */}
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Απαιτούμενο Hardware για {activeConf.badge}:</strong> {activeConf.hardware}
          </span>
        </div>
      </div>
    </div>
  );
};
