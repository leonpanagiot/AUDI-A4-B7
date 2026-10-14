import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, Trash2, Wrench, ShieldCheck, PlusCircle } from 'lucide-react';
import { DTCFault } from '../types/telemetry';
import { obdEngine, BFB_COMMON_DTCS } from '../services/obdService';

interface Props {
  dtcs: DTCFault[];
  onRefresh: () => void;
}

export const DtcScanner: React.FC<Props> = ({ dtcs, onRefresh }) => {
  const [scanning, setScanning] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleScan = () => {
    setScanning(true);
    setStatusMessage('Ανάγνωση διαγνωστικής μνήμης ECU (Audi 1.8T BFB - 01 Engine)...');
    setTimeout(() => {
      setScanning(false);
      onRefresh();
      setStatusMessage(`Ολοκληρώθηκε ο έλεγχος. Βρέθηκαν ${dtcs.length} κωδικοί βλάβης.`);
    }, 1200);
  };

  const handleClear = () => {
    setClearing(true);
    setShowConfirmClear(false);
    setStatusMessage('Αποστολή εντολής Mode 04 (Clear DTCs & Reset MIL)...');
    setTimeout(() => {
      obdEngine.clearDTCs();
      setClearing(false);
      onRefresh();
      setStatusMessage('Όλες οι βλάβες διαγράφηκαν επιτυχώς. Η λυχνία Check Engine είναι σβηστή.');
    }, 1400);
  };

  const handleAddSampleFault = () => {
    obdEngine.resetMockDTCs();
    onRefresh();
    setStatusMessage('Φορτώθηκαν δοκιμαστικές βλάβες για έλεγχο.');
  };

  return (
    <div className="space-y-4">
      {/* Control Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-5 h-5 text-red-500" />
              Διαγνωστικο Εγκεφαλου VAG-COM / OBD-II (01 - Engine)
            </h3>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              dtcs.length === 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
            }`}>
              {dtcs.length === 0 ? 'MIL OFF (ΚΑΘΑΡΟ)' : `MIL ON (${dtcs.length} ΒΛΑΒΕΣ)`}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ανάγνωση και διαγραφή σφαλμάτων DTC για κινητήρες Audi A4 B6/B7 1.8 Turbo (BFB / BEX / AVJ).
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleScan}
            disabled={scanning || clearing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin text-blue-400' : ''}`} />
            <span>{scanning ? 'Έλεγχος...' : 'Σάρωση'}</span>
          </button>

          {dtcs.length > 0 && (
            <button
              onClick={() => setShowConfirmClear(true)}
              disabled={scanning || clearing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md shadow-red-600/20"
            >
              <Trash2 className="w-4 h-4" />
              <span>Σβήσιμο DTC</span>
            </button>
          )}

          {dtcs.length === 0 && (
            <button
              onClick={handleAddSampleFault}
              className="px-3 py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
              title="Προσθήκη δοκιμαστικής βλάβης για τεστ"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Δοκιμαστικό Σφάλμα</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmClear && (
        <div className="bg-red-950/40 border border-red-500/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-red-200 animate-fadeIn">
          <div className="flex items-center gap-2.5 text-xs">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>
              <strong>Επιβεβαίωση διαγραφής:</strong> Θα διαγραφούν όλοι οι κωδικοί βλάβης από τη μνήμη της ECU και θα σβήσει το Check Engine.
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleClear}
              className="flex-1 sm:flex-none px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Ναι, Διαγραφή
            </button>
            <button
              onClick={() => setShowConfirmClear(false)}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
            >
              Ακύρωση
            </button>
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="text-xs font-mono text-slate-400 bg-slate-950/60 border border-slate-800 px-3 py-2 rounded-lg flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Codes List or Clean State */}
      {dtcs.length === 0 ? (
        <div className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-white">Δεν βρέθηκαν κωδικοί σφάλματος (DTC)</h4>
          <p className="text-xs text-slate-400 max-w-md">
            Ο εγκέφαλος του Audi 1.8T BFB δεν καταγράφει ενεργές ή αποθηκευμένες βλάβες. Όλα τα υποσυστήματα (τούρμπο, ανάφλεξη, μπεκ, αισθητήρες) λειτουργούν εντός προδιαγραφών.
          </p>
          <button
            onClick={handleAddSampleFault}
            className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline underline-offset-4 cursor-pointer"
          >
            Εμφάνιση χαρακτηριστικών βλαβών BFB για δοκιμή
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {dtcs.map((fault) => (
            <div
              key={fault.code}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    fault.severity === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    fault.severity === 'high' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black font-mono text-white tracking-wider">
                        {fault.code}
                      </span>
                      {fault.vagCode && (
                        <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          VAG: {fault.vagCode}
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {fault.system}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-200 mt-0.5">{fault.title}</h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    fault.status === 'Active' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    fault.status === 'Pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {fault.status === 'Active' ? 'Ενεργή Βλάβη' : fault.status === 'Pending' ? 'Σε Εκκρεμότητα' : 'Αποθηκευμένη'}
                  </span>
                </div>
              </div>

              <div className="pt-3 text-xs space-y-2">
                <p className="text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                  <strong className="text-red-400">Ελληνική Εξήγηση &amp; Συμπτώματα: </strong>
                  {fault.greekDescription}
                </p>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Επίσημη περιγραφή VAG: <em>{fault.description}</em></span>
                  <span className="font-mono text-slate-400">ECU 06A 906 018 / ME7.5</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Common 1.8T BFB Diagnostic Quick Guide */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400">
        <h5 className="font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-blue-400" />
          Συμβουλές Συντήρησης Audi 1.8T BFB (163hp / 20V Turbo)
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
          <div className="p-2.5 rounded bg-slate-950/50 border border-slate-800">
            <strong className="text-slate-200 block mb-0.5">Underboost (P0299)</strong>
            Συχνά οφείλεται στη σκάστρα (Diverter Valve 06A 145 710 N) ή σε σχισμένο κολάρο intercooler.
          </div>
          <div className="p-2.5 rounded bg-slate-950/50 border border-slate-800">
            <strong className="text-slate-200 block mb-0.5">Misfires (P0300-P0304)</strong>
            Αναβάθμιση σε κόκκινους πολλαπλασιαστές από 2.0 TFSI (R8 coils) και μπουζί NGK BKR7E / PFR6Q.
          </div>
          <div className="p-2.5 rounded bg-slate-950/50 border border-slate-800">
            <strong className="text-slate-200 block mb-0.5">System Lean (P0171)</strong>
            Έλεγχος των σωληνώσεων αναθυμιάσεων στροφαλοθαλάμου (PCV breather pipe) κάτω από την πολλαπλή εισαγωγής.
          </div>
        </div>
      </div>
    </div>
  );
};
