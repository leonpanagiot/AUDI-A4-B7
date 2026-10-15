import React, { useState, useEffect } from 'react';
import { 
  Gauge, 
  Wrench, 
  Timer, 
  Database, 
  Maximize2, 
  Minimize2, 
  Layers,
  FlipHorizontal,
  Terminal,
  Radio,
  Lock
} from 'lucide-react';
import { obdEngine, ConnectionMode, ZERO_TELEMETRY } from './services/obdService';
import { TelemetryData, DTCFault } from './types/telemetry';
import { AnalogBoostGauge } from './components/AnalogBoostGauge';
import { RpmRevCounter } from './components/RpmRevCounter';
import { TelemetryGrid } from './components/TelemetryGrid';
import { ThrottleSimulatorControl } from './components/ThrottleSimulatorControl';
import { VagMeasuringBlocks } from './components/VagMeasuringBlocks';
import { HudDisplay } from './components/HudDisplay';
import { DtcScanner } from './components/DtcScanner';
import { PerformanceTimer } from './components/PerformanceTimer';
import { DataLogger } from './components/DataLogger';
import { ObdDebugPanel } from './components/ObdDebugPanel';

export default function App() {
  const [isEcuLocked, setIsEcuLocked] = useState<boolean>(() => obdEngine.getDebugState().ecuLocked);
  const [activeTab, setActiveTab] = useState<'connect' | 'cockpit' | 'debug' | 'vagblocks' | 'dtc' | 'timer' | 'logger'>('connect');
  const [isHudOpen, setIsHudOpen] = useState(false);

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    ...ZERO_TELEMETRY,
    timestamp: Date.now()
  });

  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('disconnected');
  const [statusMessage, setStatusMessage] = useState<string>('Αποσυνδεδεμένο • Συνδέστε το OBD-II dongle (Bluetooth / WiFi) για ανάγνωση ζωντανών δεδομένων');
  const [activeDTCs, setActiveDTCs] = useState<DTCFault[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setActiveDTCs(obdEngine.getActiveDTCs());

    const unsubscribe = obdEngine.subscribe({
      onTelemetry: (data) => {
        setTelemetry(data);
      },
      onStatusChange: (status, mode) => {
        setStatusMessage(status);
        setConnectionMode(mode);
        setActiveDTCs(obdEngine.getActiveDTCs());
        if (mode === 'disconnected') {
          setIsEcuLocked(false);
          setActiveTab('connect');
        }
      },
      onDebugUpdate: (dbg) => {
        setIsEcuLocked(dbg.ecuLocked);
        if (dbg.ecuLocked) {
          setActiveTab((prev) => (prev === 'connect' ? 'cockpit' : prev));
        }
      },
      onError: (err) => {
        setStatusMessage(`Σφάλμα: ${err}`);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleResetPeak = () => {
    obdEngine.resetPeakBoost();
  };

  const handleRefreshDTCs = () => {
    setActiveDTCs(obdEngine.getActiveDTCs());
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* HUD Windshield Overlay Mode */}
      {isHudOpen && (
        <HudDisplay
          telemetry={telemetry}
          onClose={() => setIsHudOpen(false)}
        />
      )}

      {/* Top Header / Status bar */}
      <header className="bg-[#0b101c]/95 border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md px-3 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Model */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5 opacity-80 hover:opacity-100 transition">
                <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
              </div>
              <div className="h-5 w-px bg-slate-800" />
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-4 bg-red-600 rounded-sm skew-x-[-12deg]" />
                <h1 className="text-sm sm:text-base font-black tracking-wider text-white uppercase font-mono">
                  AudiBFB <span className="text-red-500">Live</span>
                </h1>
              </div>
            </div>

            <div
              className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
              title="Audi A4 B7 1.8T 20V (BFB / Bosch ME7.5)"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span>1.8T 20V BFB</span>
              <span className="text-slate-400">(Bosch ME7.5)</span>
            </div>
          </div>

          {/* Quick HUD Metrics in Header */}
          <div className="hidden lg:flex items-center gap-5 font-mono text-xs text-slate-300">
            {connectionMode === 'disconnected' ? (
              <div className="flex items-center gap-2 text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>OBD2: Μη Συνδεδεμένο</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">ΠΙΕΣΗ:</span>
                  <span className={`font-bold ${telemetry.boostBar !== null && telemetry.boostBar >= 1.0 ? 'text-red-400' : 'text-white'}`}>
                    {telemetry.boostBar !== null
                      ? `${telemetry.boostBar >= 0 ? `+${telemetry.boostBar.toFixed(2)}` : telemetry.boostBar.toFixed(2)} bar`
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">RPM:</span>
                  <span className="font-bold text-white">{telemetry.rpm !== null ? telemetry.rpm : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">MAF:</span>
                  <span className="font-bold text-blue-400">
                    {telemetry.mafGramsPerSec !== null ? `${telemetry.mafGramsPerSec.toFixed(1)} g/s` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">BHP:</span>
                  <span className="font-bold text-amber-400">
                    {telemetry.calculatedHp !== null ? `${telemetry.calculatedHp} HP` : 'N/A'}
                  </span>
                </div>
              </>
            )}
            {activeDTCs.length > 0 && (
              <button
                onClick={() => setActiveTab('dtc')}
                className="flex items-center gap-1 text-red-400 animate-pulse font-bold hover:underline cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>CHECK ({activeDTCs.length})</span>
              </button>
            )}
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2">
            {/* Debug Console Quick Button */}
            <button
              onClick={() => setActiveTab('debug')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                activeTab === 'debug'
                  ? 'bg-amber-600 text-white border-amber-400'
                  : 'bg-amber-950/60 hover:bg-amber-900/60 border-amber-500/50 text-amber-300'
              }`}
              title="Κονσόλα Debug OBD2 & Raw Hex Αισθητήρων"
            >
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Debug OBD2</span>
              <span className="sm:hidden">Debug</span>
            </button>

            {/* HUD Mode button for Night Driving reflection */}
            <button
              onClick={() => setIsHudOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold transition cursor-pointer"
              title="Λειτουργία HUD Παρμπρίζ για νυχτερινή οδήγηση"
            >
              <FlipHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">HUD Παρμπρίζ</span>
              <span className="sm:hidden">HUD</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title={isFullscreen ? 'Έξοδος από πλήρη οθόνη' : 'Πλήρης οθόνη (Car Mount)'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar text-xs">
          {/* Connection Tab (Always available, highlighted before lock) */}
          <button
            onClick={() => setActiveTab('connect')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
              activeTab === 'connect'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Σύνδεση OBD2 {isEcuLocked && '✓'}</span>
          </button>

          <button
            onClick={() => isEcuLocked && setActiveTab('cockpit')}
            disabled={!isEcuLocked}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition whitespace-nowrap ${
              !isEcuLocked
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : activeTab === 'cockpit'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30 cursor-pointer'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 cursor-pointer'
            }`}
            title={!isEcuLocked ? 'Απαιτείται επιβεβαιωμένη σύνδεση ECU (ECU LOCK)' : 'Ζωντανά Όργανα'}
          >
            {!isEcuLocked ? <Lock className="w-3.5 h-3.5" /> : <Gauge className="w-3.5 h-3.5" />}
            <span>Ζωντανά Όργανα</span>
          </button>

          <button
            onClick={() => isEcuLocked && setActiveTab('vagblocks')}
            disabled={!isEcuLocked}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition whitespace-nowrap ${
              !isEcuLocked
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : activeTab === 'vagblocks'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30 cursor-pointer'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 cursor-pointer'
            }`}
            title={!isEcuLocked ? 'Απαιτείται επιβεβαιωμένη σύνδεση ECU' : 'VAG Measuring Blocks'}
          >
            {!isEcuLocked ? <Lock className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5 text-blue-400" />}
            <span>VAG Groups (001-255)</span>
          </button>

          <button
            onClick={() => isEcuLocked && setActiveTab('logger')}
            disabled={!isEcuLocked}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition whitespace-nowrap ${
              !isEcuLocked
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : activeTab === 'logger'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30 cursor-pointer'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 cursor-pointer'
            }`}
            title={!isEcuLocked ? 'Απαιτείται επιβεβαιωμένη σύνδεση ECU' : 'Datalogger CSV'}
          >
            {!isEcuLocked ? <Lock className="w-3.5 h-3.5" /> : <Database className="w-3.5 h-3.5" />}
            <span>Datalogger CSV</span>
          </button>

          <button
            onClick={() => isEcuLocked && setActiveTab('dtc')}
            disabled={!isEcuLocked}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition whitespace-nowrap ${
              !isEcuLocked
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : activeTab === 'dtc'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30 cursor-pointer'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 cursor-pointer'
            }`}
            title={!isEcuLocked ? 'Απαιτείται επιβεβαιωμένη σύνδεση ECU' : 'Διαγνωστικό DTC'}
          >
            {!isEcuLocked ? <Lock className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
            <span>Διαγνωστικό DTC {activeDTCs.length > 0 && `(${activeDTCs.length})`}</span>
          </button>

          <button
            onClick={() => isEcuLocked && setActiveTab('timer')}
            disabled={!isEcuLocked}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition whitespace-nowrap ${
              !isEcuLocked
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : activeTab === 'timer'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30 cursor-pointer'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 cursor-pointer'
            }`}
            title={!isEcuLocked ? 'Απαιτείται επιβεβαιωμένη σύνδεση ECU' : 'Χρονόμετρο 0-100'}
          >
            {!isEcuLocked ? <Lock className="w-3.5 h-3.5" /> : <Timer className="w-3.5 h-3.5" />}
            <span>0-100 km/h</span>
          </button>

          {/* Debug Console tab (Always accessible before and after connection) */}
          <button
            onClick={() => setActiveTab('debug')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
              activeTab === 'debug'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-amber-400 hover:text-white hover:bg-amber-950/40 border border-amber-500/30'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Debug &amp; Τεστ Αισθητήρων</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-6 space-y-5">
        {/* Initial Connection Hub View (Shown on launch until ECU is locked) */}
        {(activeTab === 'connect' || (!isEcuLocked && activeTab !== 'debug')) && (
          <div className="space-y-6">
            <ThrottleSimulatorControl
              mode={connectionMode}
              onResetPeak={handleResetPeak}
              statusMessage={statusMessage}
              onOpenDebug={() => setActiveTab('debug')}
            />

            {!isEcuLocked && (
              <div className="bg-[#0b101c]/90 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 mx-auto rounded-full bg-blue-950/60 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
                  <Radio className="w-7 h-7 animate-pulse" />
                </div>
                <div className="max-w-xl mx-auto space-y-2">
                  <h2 className="text-lg sm:text-xl font-black font-mono tracking-wide text-white uppercase">
                    Εκκίνηση AudiBFB Live
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed font-sans">
                    Η εφαρμογή βρίσκεται σε <strong>κατάσταση ασφαλούς αναμονής σύνδεσης</strong>.
                    Δεν εκτελούνται παράλληλες εντολές ούτε εικονικά δεδομένα, ώστε ο αντάπτορας OBD2 (Vgate iCar / ELM327) να ξεκινήσει καθαρά.
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    Επιλέξτε <strong>WiFi OBD</strong> (192.168.0.10:35000) ή <strong>Bluetooth</strong> και πατήστε Σύνδεση.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('debug')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold transition cursor-pointer"
                  >
                    <Terminal className="w-4 h-4 text-amber-400" />
                    <span>Άνοιγμα Debug OBD2 &amp; Τερματικό</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 1: Cockpit / Telemetry (Active only once ECU is confirmed locked) */}
        {activeTab === 'cockpit' && isEcuLocked && (
          <div className="space-y-5">
            {/* OBD-II Connection Control Bar */}
            <ThrottleSimulatorControl
              mode={connectionMode}
              onResetPeak={handleResetPeak}
              statusMessage={statusMessage}
              onOpenDebug={() => setActiveTab('debug')}
            />

            {/* Twin Analog / Digital Gauges: Boost Gauge + RPM Rev Counter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gradient-to-b from-[#0b101c] to-[#070a12] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl items-center justify-items-center">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">
                    CALCULATED BOOST (ΕΚΤΙΜΗΣΗ)
                  </h3>
                </div>
                <AnalogBoostGauge
                  boostBar={telemetry.boostBar}
                  boostPsi={telemetry.boostPsi}
                  peakBoostBar={telemetry.peakBoostBar}
                  boostSpecifiedBar={telemetry.boostSpecifiedBar}
                  onResetPeak={handleResetPeak}
                />
              </div>

              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">
                    ΣΤΡΟΦΟΜΕΤΡΟ (TACHOMETER &amp; SPEED)
                  </h3>
                </div>
                <RpmRevCounter
                  rpm={telemetry.rpm}
                  speed={telemetry.speed}
                />
              </div>
            </div>

            {/* Telemetry Matrix Grid */}
            <TelemetryGrid telemetry={telemetry} />
          </div>
        )}

        {/* Tab 2: Live OBD-II Debug & Diagnostics Console */}
        {activeTab === 'debug' && (
          <div className="space-y-4">
            <ThrottleSimulatorControl
              mode={connectionMode}
              onResetPeak={handleResetPeak}
              statusMessage={statusMessage}
            />
            <ObdDebugPanel />
          </div>
        )}

        {/* Tab 5: VAG Measuring Blocks */}
        {activeTab === 'vagblocks' && (
          <VagMeasuringBlocks telemetry={telemetry} />
        )}

        {/* Tab 6: DTC Scanner */}
        {activeTab === 'dtc' && (
          <DtcScanner
            dtcs={activeDTCs}
            onRefresh={handleRefreshDTCs}
          />
        )}

        {/* Tab 7: Performance Timer */}
        {activeTab === 'timer' && (
          <PerformanceTimer currentSpeed={telemetry.speed} />
        )}

        {/* Tab 8: Datalogger */}
        {activeTab === 'logger' && (
          <DataLogger telemetry={telemetry} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-[#050810] border-t border-slate-800/80 px-4 py-3 text-[11px] text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>AudiBFB Live • Audi A4 B7 1.8T 20V (Bosch ME7.5)</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('vagblocks')}
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2 cursor-pointer font-sans"
            >
              VAG Groups (001-255)
            </button>
            <button
              onClick={() => setActiveTab('logger')}
              className="text-slate-300 hover:text-white underline underline-offset-2 cursor-pointer font-sans"
            >
              Datalogger
            </button>
            <button
              onClick={() => setActiveTab('debug')}
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2 cursor-pointer font-sans"
            >
              Debug OBD2
            </button>
            <button
              onClick={() => setIsHudOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 cursor-pointer font-sans"
            >
              HUD Παρμπρίζ
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
