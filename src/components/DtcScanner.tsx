import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Trash2,
  Wrench,
  ShieldCheck,
  Terminal,
  CheckCircle2,
  XCircle,
  BookOpen,
  Search,
  FlaskConical
} from 'lucide-react';
import { DTCFault, DtcScanDebugInfo } from '../types/telemetry';
import { obdEngine } from '../services/obdService';
import { VAG_GREEK_DTC_DICTIONARY, lookupAndTranslateDtcToGreek } from '../services/vagDtcDictionary';

interface Props {
  dtcs: DTCFault[];
  onRefresh: () => void;
}

interface KnownDtcFrameTestCase {
  id: string;
  title: string;
  protocolDesc: string;
  modeHex: '43' | '47';
  rawHexInput: string;
  expectedCodes: string[];
  explanation: string;
}

const KNOWN_DTC_TEST_VECTORS: KnownDtcFrameTestCase[] = [
  {
    id: 'kline-single-frame',
    title: 'K-Line ISO 9141-2 / KWP2000 (ATH0): 2 Βλάβες (P0171 + P0299)',
    protocolDesc: 'Mode 03 (6 bytes payload χωρίς count byte)',
    modeHex: '43',
    rawHexInput: '43 01 71 02 99 00 00',
    expectedCodes: ['P0171', 'P0299'],
    explanation: 'Στο K-Line τα 6 bytes μετά το 43 είναι 3 ζεύγη DTC (0171=P0171, 0299=P0299, 0000=Padding). Με το παλιό startIdx=i+2 χανόταν το 01 και διαβαζόταν λάθος.'
  },
  {
    id: 'kline-c0100-bug-guard',
    title: 'Αποκλεισμός Ψευδούς C0100 από Echo / Mode 01 (41 00) ή 43 00',
    protocolDesc: 'Έλεγχος απομόνωσης Mode 03 & Mode 01',
    modeHex: '43',
    rawHexInput: '43 00 00 00 00 00 00\r\n41 00 BE 3F A8 11',
    expectedCodes: [],
    explanation: 'Το "41 00" (Mode 01 Supported PIDs) αν διαβαστεί ως ζεύγος DTC (0x41, 0x00) δίνει C0100 (bits 01 = C). Ο νέος αποκωδικοποιητής απορρίπτει frames Mode 01 (41 xx) και αναγνωρίζει 0 βλάβες.'
  },
  {
    id: 'kline-with-headers-ath1',
    title: 'K-Line με Headers (ATH1): 48 6B 10 43 ... + Checksum',
    protocolDesc: 'ISO 9141-2 Header (48 6B 10) + 3 Βλάβες + Checksum',
    modeHex: '43',
    rawHexInput: '48 6B 10 43 03 00 03 01 01 02 B9',
    expectedCodes: ['P0300', 'P0301', 'P0102'],
    explanation: 'Αφαιρεί αυτόματα την κεφαλίδα 48 6B 10 και το τελικό byte checksum (B9) και αποκωδικοποιεί τα P0300, P0301, P0102.'
  },
  {
    id: 'kline-multiframe-2lines',
    title: 'K-Line Πολλαπλά Frames (Multi-Frame 2 γραμμών)',
    protocolDesc: '4 Βλάβες σε 2 διαδοχικά frames 43 ...',
    modeHex: '43',
    rawHexInput: '43 01 71 02 99 03 01\r\n43 04 20 00 00 00 00',
    expectedCodes: ['P0171', 'P0299', 'P0301', 'P0420'],
    explanation: 'Επεξεργάζεται κάθε γραμμή K-Line ξεχωριστά χωρίς να ενώνει τα bytes του 2ου header (43) με τα δεδομένα του 1ου frame.'
  },
  {
    id: 'count-byte-can-format',
    title: 'Frame με Count Byte (43 <Count> <DTC1> <DTC2>)',
    protocolDesc: 'Odd payload length (Count = 02 -> P0118, P1297)',
    modeHex: '43',
    rawHexInput: '43 02 01 18 12 97',
    expectedCodes: ['P0118', 'P1297'],
    explanation: 'Όταν υπάρχει byte πλήθους (02 = 2 βλάβες, περιττό πλήθος bytes μετά το 43), παραλείπει το count byte και διαβάζει σωστά τα 01 18 (P0118) και 12 97 (P1297).'
  },
  {
    id: 'isotp-multiframe-colon',
    title: 'ISO-TP Multi-Frame με Αρίθμηση Γραμμών (0:, 1:)',
    protocolDesc: 'Segmented response (3 βλάβες: P0102, P0234, P0597)',
    modeHex: '43',
    rawHexInput: '0: 43 03 01 02 02 34\r\n1: 05 97 00 00 00 00',
    expectedCodes: ['P0102', 'P0234', 'P0597'],
    explanation: 'Ανασυνθέτει τα τμήματα 0: και 1:, αφαιρεί το count byte (03) και εξάγει τους κωδικούς P0102, P0234 και P0597.'
  }
];

export const DtcScanner: React.FC<Props> = ({ dtcs, onRefresh }) => {
  const [scanning, setScanning] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [scanDebug, setScanDebug] = useState<DtcScanDebugInfo>(() => obdEngine.getLastDtcScanDebug());

  // Custom HEX Frame Tester & Greek Dictionary Search
  const [showVerifier, setShowVerifier] = useState(false);
  const [customRawHex, setCustomRawHex] = useState('43 01 71 02 99 00 00');
  const [customMode, setCustomMode] = useState<'43' | '47'>('43');
  const [dictSearch, setDictSearch] = useState('');
  const [showDictionary, setShowDictionary] = useState(false);

  const mode = obdEngine.getMode();

  const handleScan = async () => {
    setScanning(true);
    setStatusMessage('Αποστολή ξεχωριστών εντολών OBD Mode 03 & Mode 07 στην ECU Audi 1.8T BFB...');
    try {
      const results = await obdEngine.scanRealDTCs();
      setScanDebug(obdEngine.getLastDtcScanDebug());
      onRefresh();
      if (results.length === 0) {
        setStatusMessage('Η ECU απάντησε: 0 Κωδικοί Βλάβης (MIL OFF). Δείτε παρακάτω τις ακριβείς HEX απαντήσεις Mode 03 & 07.');
      } else {
        setStatusMessage(`Εντοπίστηκαν ${results.length} πραγματικοί κωδικοί βλάβης με πλήρη ελληνική επεξήγηση.`);
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
      setScanDebug(obdEngine.getLastDtcScanDebug());
      onRefresh();
      setStatusMessage('Όλες οι βλάβες διαγράφηκαν επιτυχώς. Η λυχνία Check Engine είναι σβηστή.');
    } catch (e: any) {
      setStatusMessage(`Σφάλμα: ${e.message}`);
    } finally {
      setClearing(false);
    }
  };

  // Run automated verification on known DTC frames
  const testResults = useMemo(() => {
    return KNOWN_DTC_TEST_VECTORS.map(tv => {
      const res = obdEngine.decodeObdDtcResponse(tv.rawHexInput, tv.modeHex);
      const actualCodes = res.decoded.map(d => d.code);
      const passed =
        actualCodes.length === tv.expectedCodes.length &&
        tv.expectedCodes.every((c, i) => actualCodes[i] === c);
      return {
        ...tv,
        actualCodes,
        decodedDetails: res.decoded,
        passed
      };
    });
  }, []);

  const customTestDecoded = useMemo(() => {
    const res = obdEngine.decodeObdDtcResponse(customRawHex, customMode);
    return {
      frames: res.cleanFrames,
      items: res.decoded.map(d => ({
        ...d,
        fault: lookupAndTranslateDtcToGreek(
          d.code,
          customMode === '43' ? 'Active' : 'Pending',
          d.frameHex
        )
      }))
    };
  }, [customRawHex, customMode]);

  const filteredDictionary = useMemo(() => {
    const allEntries = Object.values(VAG_GREEK_DTC_DICTIONARY);
    const q = dictSearch.trim().toUpperCase();
    if (!q) return allEntries;
    return allEntries.filter(
      e =>
        e.code.toUpperCase().includes(q) ||
        (e.vagCode && e.vagCode.includes(q)) ||
        e.title.toUpperCase().includes(q) ||
        e.greekDescription.toUpperCase().includes(q) ||
        e.description.toUpperCase().includes(q)
    );
  }, [dictSearch]);

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
              {mode === 'bluetooth' ? 'Bluetooth OBD-II' : mode === 'wifi' ? 'WiFi OBD-II' : 'Αποσυνδεδεμένο'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ξεχωριστή αποκωδικοποίηση K-Line / ISO-TP για Mode 03 (Ενεργά) &amp; Mode 07 (Εκκρεμή) με εμφάνιση RAW HEX και πλήρες Ελληνικό Λεξικό Βλαβών VAG.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
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

          <button
            onClick={() => setShowDictionary(!showDictionary)}
            className={`px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 border ${
              showDictionary
                ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Ελληνικό Λεξικό DTC ({Object.keys(VAG_GREEK_DTC_DICTIONARY).length})</span>
          </button>

          <button
            onClick={() => setShowVerifier(!showVerifier)}
            className={`px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 border ${
              showVerifier
                ? 'bg-amber-600/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>Δοκιμές DTC Frames</span>
          </button>
        </div>
      </div>

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
        <div className="text-xs font-mono text-slate-300 bg-slate-950/70 border border-slate-800 px-3 py-2 rounded-lg flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Raw HEX Responses Panel for Mode 03 & Mode 07 side-by-side */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Αρχικες HEX Απαντησεις ECU (Ξεχωριστη Αποκωδικοποιηση Mode 03 &amp; Mode 07)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Τελευταία Ανάγνωση: {scanDebug.timestamp}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Mode 03 Box */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-red-400 uppercase">
                OBD Mode 03 (Ενεργά Σφάλματα • Service 0x43)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                {scanDebug.mode03Codes.length} Κωδικοί
              </span>
            </div>
            <div className="text-xs font-mono text-cyan-300 bg-slate-900/90 px-2.5 py-1.5 rounded border border-slate-800 break-all">
              RAW HEX: {scanDebug.rawMode03Hex}
            </div>
            {scanDebug.mode03Codes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {scanDebug.mode03Codes.map((c, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30"
                  >
                    <strong>{c.code}</strong> ← <span className="text-cyan-300">[{c.pairHex}]</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Mode 07 Box */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 uppercase">
                OBD Mode 07 (Εκκρεμή Σφάλματα • Service 0x47)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                {scanDebug.mode07Codes.length} Κωδικοί
              </span>
            </div>
            <div className="text-xs font-mono text-cyan-300 bg-slate-900/90 px-2.5 py-1.5 rounded border border-slate-800 break-all">
              RAW HEX: {scanDebug.rawMode07Hex}
            </div>
            {scanDebug.mode07Codes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {scanDebug.mode07Codes.map((c, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  >
                    <strong>{c.code}</strong> ← <span className="text-cyan-300">[{c.pairHex}]</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Known DTC Frames Test Suite & Custom Frame Tester */}
      {showVerifier && (
        <div className="bg-slate-900/95 border border-amber-500/40 rounded-xl p-4 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <FlaskConical className="w-4 h-4" />
                Επαληθευση Αποκωδικοποιητη K-Line / Multi-Frame με Γνωστα DTC Frames
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Αυτόματες δοκιμές (Unit Tests) πάνω σε πραγματικά K-Line frames για επιβεβαίωση ότι δεν εμφανίζεται ψευδές C0100.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold">
              {testResults.filter(t => t.passed).length}/{testResults.length} TESTS PASSED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {testResults.map(tr => (
              <div
                key={tr.id}
                className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-200">{tr.title}</div>
                    <div className="text-[11px] text-slate-400">{tr.protocolDesc}</div>
                  </div>
                  {tr.passed ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-500/15 px-2 py-0.5 rounded border border-red-500/30 shrink-0">
                      <XCircle className="w-3.5 h-3.5" /> FAIL
                    </span>
                  )}
                </div>

                <div className="font-mono text-[11px] bg-slate-900 p-2 rounded border border-slate-800 text-cyan-300 whitespace-pre-wrap">
                  HEX Input: {tr.rawHexInput}
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-slate-400">
                    Αποκωδικοποιήθηκαν:{' '}
                    <strong className="text-white font-mono">
                      {tr.actualCodes.length > 0 ? tr.actualCodes.join(', ') : '0 Σφάλματα (Καθαρό)'}
                    </strong>
                  </span>
                  {tr.decodedDetails.length > 0 && (
                    <div className="flex gap-1">
                      {tr.decodedDetails.map((d, i) => (
                        <span key={i} className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">
                          {d.pairHex} → {d.code}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/80 pt-1.5">
                  {tr.explanation}
                </p>
              </div>
            ))}
          </div>

          {/* Interactive Custom HEX Frame Tester */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 space-y-3">
            <div className="text-xs font-bold text-slate-200 uppercase">
              Δοκιμάστε Δικό σας RAW HEX Frame (K-Line / CAN / Multi-Frame):
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={customMode}
                onChange={e => setCustomMode(e.target.value as '43' | '47')}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
              >
                <option value="43">Mode 03 (Service 43)</option>
                <option value="47">Mode 07 (Service 47)</option>
              </select>
              <input
                type="text"
                value={customRawHex}
                onChange={e => setCustomRawHex(e.target.value)}
                placeholder="π.χ. 43 01 71 02 99 00 00 ή 48 6B 10 43 03 00 00 00 00 00"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300"
              />
            </div>
            <div className="space-y-2">
              {customTestDecoded.items.length === 0 ? (
                <div className="text-xs text-emerald-400 font-mono">
                  Αποτέλεσμα: 0 Κωδικοί Σφάλματος
                </div>
              ) : (
                customTestDecoded.items.map((item, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-mono font-bold text-white">
                        {item.code} {item.fault.vagCode ? `(VAG ${item.fault.vagCode})` : ''} — {item.fault.title}
                      </span>
                      <span className="font-mono text-[11px] bg-cyan-500/15 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                        HEX Byte Pair: [{item.pairHex}] | Frame: [{item.frameHex}]
                      </span>
                    </div>
                    <p className="text-slate-300">{item.fault.greekDescription}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Offline Built-in Greek VAG & OBD-II DTC Dictionary */}
      {showDictionary && (
        <div className="bg-slate-900/95 border border-emerald-500/40 rounded-xl p-4 space-y-3 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Ενσωματωμενο Ελληνικο Λεξικο Κωδικων Σφαλματος (Audi 1.8T BFB &amp; OBD-II)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Αναζητήστε οποιονδήποτε κωδικό (π.χ. P0171, P0299, 17705, N75, MAF, G62, Πολλαπλασιαστής) για ελληνική μετάφραση και αιτίες.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={dictSearch}
                onChange={e => setDictSearch(e.target.value)}
                placeholder="Αναζήτηση κωδικού (π.χ. P0299, 17705)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {filteredDictionary.map(entry => (
              <div
                key={entry.code}
                className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black font-mono text-white">{entry.code}</span>
                    {entry.vagCode && (
                      <span className="text-[11px] font-mono bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-slate-700">
                        VAG: {entry.vagCode}
                      </span>
                    )}
                    <span className="text-xs font-bold text-emerald-300">{entry.title}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {entry.system}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{entry.greekDescription}</p>
                <div className="text-[11px] text-slate-500 font-mono">OBD-II: {entry.description}</div>
              </div>
            ))}
          </div>
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
            Πατήστε «Σάρωση Σφαλμάτων» ενώ είστε συνδεδεμένος με το OBD2 dongle για ξεχωριστή ανάγνωση της μνήμης βλαβών (Mode 03 &amp; Mode 07) από την ECU Bosch ME7.5.
          </p>
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleScan}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              <span>Έλεγχος ECU τώρα</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {dtcs.map((fault) => (
            <div
              key={`${fault.code}-${fault.modeSource || '03'}`}
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
                        <span className="text-xs font-mono text-amber-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          VAG: {fault.vagCode}
                        </span>
                      )}
                      {fault.decodedPairHex && (
                        <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                          HEX Bytes: [{fault.decodedPairHex}]
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
                    {fault.status === 'Active'
                      ? `Mode ${fault.modeSource || '03'} • Ενεργή Βλάβη`
                      : fault.status === 'Pending'
                      ? `Mode ${fault.modeSource || '07'} • Σε Εκκρεμότητα`
                      : 'Αποθηκευμένη'}
                  </span>
                </div>
              </div>

              <div className="pt-3 text-xs space-y-2">
                {fault.rawHexFrame && (
                  <div className="font-mono text-[11px] text-cyan-300 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between flex-wrap gap-2">
                    <span>
                      <strong className="text-slate-400">Αρχικό Πλαίσιο ECU (RAW HEX Frame):</strong> {fault.rawHexFrame}
                    </span>
                    {fault.decodedPairHex && (
                      <span className="text-amber-300">
                        Δυαδική Αποκωδικοποίηση: 0x{fault.decodedPairHex.replace(' ', ', 0x')} → {fault.code}
                      </span>
                    )}
                  </div>
                )}
                <p className="text-slate-200 leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                  <strong className="text-red-400">Ελληνική Εξήγηση &amp; Αιτίες: </strong>
                  {fault.greekDescription}
                </p>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Αγγλική Περιγραφή OBD-II: {fault.description}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
