import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, Trash2, Wrench, ShieldCheck, PlusCircle, AlertCircle, Info } from 'lucide-react';
import { DTCFault } from '../types/telemetry';
import { obdEngine } from '../services/obdService';

interface Props {
  dtcs: DTCFault[];
  onRefresh: () => void;
}

export const DtcScanner: React.FC<Props> = ({ dtcs, onRefresh }) => {
  const [scanning, setScanning] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isDemoFaults, setIsDemoFaults] = useState(false);

  const mode = obdEngine.getMode();

  const handleScan = async () => {
    setScanning(true);
    setStatusMessage('Αποστολή εντολών OBD Mode 03 & 07 στην ECU Audi 1.8T BFB (01-Engine)...');
    try {
      const results = await obdEngine.scanRealDTCs();
      setIsDemoFaults(false);
      onRefresh();
      if (results.length === 0) {
        setStatusMessage('Η ECU απάντησε: 0 Κωδικοί Βλάβης (MIL OFF). Το αυτοκίνητο δεν έχει κανένα σφάλμα.');
      } else {
        setStatusMessage(`Εντοπίστηκαν ${results.length} πραγματικοί κωδικοί βλάβης.`);
      }
    } catch (e: any) {
      setStatusMessage(`Σφάλμα επικοινωνίας: ${e.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    setShowConfirmClear(false);
    setStatusMessage('Αποστολή εντολής Mode 04 (Clear DTCs & Reset MIL)...');
    try {
      await obdEngine.clearDTCs();
      setIsDemoFaults(false);
      onRefresh();
      setStatusMessage('Όλες οι βλάβες διαγράφηκαν επιτυχώς. Η λυχνία Check Engine είναι σβηστή.');
    } catch (e: any) {
      setStatusMessage(`Σφάλμα: ${e.message}`);
    } finally {
      setClearing(false);
    }
  };

  const handleAddSampleFault = () => {
    obdEngine.loadDemoDTCs();
    setIsDemoFaults(true);
    onRefresh();
    setStatusMessage('Φορτώθηκαν εικονικά δοκιμαστικά σφάλματα DEMO (ΜΟΝΟ για δοκιμή της οθόνης).');
  };

  return (
    <div className="space-y-4">
      {/* Control Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-5 h-5 text-red-500" />
              Διαγνωστικο Εγκεφαλου VAG-COM / OBD-II (01 - Engine)
            </h3>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              dtcs.length === 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
            }`}>
              {dtcs.length === 0 ? 'MIL OFF (ΚΑΘΑΡΟ - 0 ΒΛΑΒΕΣ)' : `MIL ON (${dtcs.length} ΒΛΑΒΕΣ)`}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {mode === 'bluetooth' ? 'Bluetooth OBD-II' : mode === 'wifi' ? 'WiFi OBD-II' : mode === 'usb' ? 'USB KKL Cable' : mode === 'simulator' ? 'Εξομοιωτής (Demo)' : 'Αποσυνδεδεμένο'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Πραγματική ανάγνωση και διαγραφή σφαλμάτων DTC από την ECU Bosch ME7.5 (Audi A4 B7 1.8 Turbo BFB).
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleScan}
            disabled={scanning || clearing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md shadow-blue-600/20"
          >
            <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Έλεγχος ECU...' : 'Σάρωση Σφαλμάτων'}</span>
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
              className="px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
              title="Προβολή δοκιμαστικών σφαλμάτων για έλεγχο της οθόνης"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Δοκιμαστικά Σφάλματα (Demo)</span>
            </button>
          )}
        </div>
      </div>

      {/* Demo faults warning banner if active */}
      {isDemoFaults && dtcs.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-3 flex items-center justify-between gap-3 text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span><strong>ΠΡΟΣΟΧΗ - ΔΟΚΙΜΑΣΤΙΚΑ ΔΕΔΟΜΕΝΑ (DEMO):</strong> Τα σφάλματα που βλέπετε παρακάτω είναι εικονικά δείγματα για δοκιμή της οθόνης και ΔΕΝ προέρχονται από το αυτοκίνητό σας!</span>
          </div>
          <button
            onClick={handleClear}
            className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold uppercase cursor-pointer whitespace-nowrap"
          >
            Επαναφορα σε Καθαρο
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmClear && (
        <div className="bg-red-950/40 border border-red-500/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-red-200 animate-fadeIn">
          <div className="flex items-center gap-2.5 text-xs">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>
              <strong>Επιβεβαίωση διαγραφής (Mode 04):</strong> Θα σταλεί εντολή στην ECU για διαγραφή των κωδικών βλάβης και σβήσιμο της λυχνίας Check Engine.
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
        <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-3 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h4 className="text-lg font-bold text-white">Δεν βρέθηκαν κωδικοί σφάλματος (MIL OFF)</h4>
          <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
            Ο εγκέφαλος (ECU ME7.5) του Audi A4 B7 είναι πεντακάθαρος! Δεν υπάρχουν ενεργές ή αποθηκευμένες βλάβες στη μνήμη. Όλα τα υποσυστήματα (τούρμπο, ανάφλεξη, μπεκ ψεκασμού, αισθητήρες λ και MAF) λειτουργούν κανονικά.
          </p>
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleScan}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              <span>Επανέλεγχος ECU</span>
            </button>
            <button
              onClick={handleAddSampleFault}
              className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-slate-300 transition cursor-pointer"
            >
              Δοκιμή εμφάνισης σφαλμάτων (Demo)
            </button>
          </div>
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
                    <div className="flex items-center gap-2 flex-wrap">
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
                      {isDemoFaults && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          DEMO
                        </span>
                      )}
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
