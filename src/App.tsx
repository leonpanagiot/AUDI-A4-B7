import React, { useState, useEffect } from 'react';
import { 
  Gauge, 
  Wrench, 
  Timer, 
  Database, 
  Smartphone, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Layers,
  FlipHorizontal,
  Cpu,
  Trophy,
  Sparkles,
  Zap
} from 'lucide-react';
import { obdEngine, ConnectionMode, ENGINE_STAGES, ZERO_TELEMETRY } from './services/obdService';
import { TelemetryData, DTCFault, EngineStageId, FuelOctane } from './types/telemetry';
import { AnalogBoostGauge } from './components/AnalogBoostGauge';
import { RpmRevCounter } from './components/RpmRevCounter';
import { TelemetryGrid } from './components/TelemetryGrid';
import { ThrottleSimulatorControl } from './components/ThrottleSimulatorControl';
import { EngineStageSelector } from './components/EngineStageSelector';
import { VagMeasuringBlocks } from './components/VagMeasuringBlocks';
import { DynoPowerGraph } from './components/DynoPowerGraph';
import { HudDisplay } from './components/HudDisplay';
import { DtcScanner } from './components/DtcScanner';
import { PerformanceTimer } from './components/PerformanceTimer';
import { DataLogger } from './components/DataLogger';
import { AndroidApkCenter } from './components/AndroidApkCenter';
import { PWAInstallButton } from './components/PWAInstallButton';
import { audioEngine } from './services/audioEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<'cockpit' | 'tuning' | 'dyno' | 'vagblocks' | 'dtc' | 'timer' | 'logger' | 'apk'>('cockpit');
  const [isHudOpen, setIsHudOpen] = useState(false);
  const [currentStage, setCurrentStage] = useState<EngineStageId>('stage1');
  const [currentOctane, setCurrentOctane] = useState<FuelOctane>(100);
  const [soundEnabled, setSoundEnabled] = useState(false);

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

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioEngine.setEnabled(next);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const stageConfig = ENGINE_STAGES[currentStage];

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

            <button
              onClick={() => setActiveTab('tuning')}
              className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
              title="Αλλαγή Stage Κινητήρα"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span>{stageConfig.badge}</span>
              <span className="text-slate-400">({currentOctane} RON)</span>
            </button>
          </div>

          {/* Quick HUD Metrics in Header */}
          <div className="hidden lg:flex items-center gap-5 font-mono text-xs text-slate-300">
            {connectionMode === 'disconnected' ? (
              <div className="flex items-center gap-2 text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>OBD2: Μη Συνδεδεμένο</span>
              </div>
            ) : connectionMode === 'simulator' ? (
              <div className="flex items-center gap-2 text-amber-300 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-500/40 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>ΕΞΟΜΟΙΩΣΗ (DEMO)</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">ΠΙΕΣΗ:</span>
                  <span className={`font-bold ${telemetry.boostBar >= 1.0 ? 'text-red-400' : 'text-white'}`}>
                    {telemetry.boostBar >= 0 ? `+${telemetry.boostBar.toFixed(2)}` : telemetry.boostBar.toFixed(2)} bar
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">RPM:</span>
                  <span className="font-bold text-white">{telemetry.rpm}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">MAF:</span>
                  <span className="font-bold text-blue-400">{telemetry.mafGramsPerSec.toFixed(1)} g/s</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">BHP:</span>
                  <span className="font-bold text-amber-400">~{telemetry.calculatedHp}</span>
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

            {/* Sound toggle */}
            <button
              onClick={toggleSound}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                soundEnabled
                  ? 'bg-red-600 text-white shadow-sm shadow-red-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
              }`}
              title={soundEnabled ? 'Απενεργοποίηση ήχου κινητήρα/σκάστρας' : 'Ενεργοποίηση ήχου κινητήρα & σκάστρας'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* APK Center Button */}
            <button
              onClick={() => setActiveTab('apk')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-500/50 text-red-300 text-xs font-bold transition cursor-pointer"
              title="Λήψη αρχείων APK & Project"
            >
              <Smartphone className="w-3.5 h-3.5 text-red-400" />
              <span>APK</span>
            </button>

            <PWAInstallButton
              variant="compact"
              onNavigateToApkTab={() => setActiveTab('apk')}
            />

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title={isFullscreen ? 'Έξοδος από πλήρη οθόνη' : 'Πλήρης οθόνη (Car Mount)'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar with All Options */}
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setActiveTab('cockpit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
              activeTab === 'cockpit'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Ζωντανά Όργανα</span>
          </button>

          <button
            onClick={() => setActiveTab('tuning')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
              activeTab === 'tuning'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-red-400" />
            <span>Στάδια Tuning ({stageConfig.badge})</span>
          </button>

          <button
            onClick={() => setActiveTab('dyno')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
              activeTab === 'dyno'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Δυναμομέτρηση Dyno</span>
          </button>

          <button
            onClick={() => setActiveTab('vagblocks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
              activeTab === 'vagblocks'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>VAG Groups 001-120</span>
          </button>

          <button
            onClick={() => setActiveTab('dtc')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
              activeTab === 'dtc'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Διαγνωστικό DTC {activeDTCs.length > 0 && `(${activeDTCs.length})`}</span>
          </button>

          <button
            onClick={() => setActiveTab('timer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
              activeTab === 'timer'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>0-100 km/h</span>
          </button>

          <button
            onClick={() => setActiveTab('logger')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
              activeTab === 'logger'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Datalogger CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
              activeTab === 'apk'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-red-400 hover:text-white hover:bg-red-950/40 border border-red-500/30'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-red-400" />
            <span>Android APK &amp; Project</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-6 space-y-5">
        {/* Full PWA Install Banner when on Cockpit */}
        {activeTab === 'cockpit' && (
          <PWAInstallButton
            variant="full"
            onNavigateToApkTab={() => setActiveTab('apk')}
          />
        )}

        {/* Tab 1: Cockpit / Telemetry */}
        {activeTab === 'cockpit' && (
          <div className="space-y-5">
            {/* Throttle & Simulator control bar */}
            <ThrottleSimulatorControl
              mode={connectionMode}
              onResetPeak={handleResetPeak}
              statusMessage={statusMessage}
            />

            {/* Twin Analog / Digital Gauges: Boost Gauge + RPM Rev Counter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gradient-to-b from-[#0b101c] to-[#070a12] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl items-center justify-items-center">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">
                    ΜΠΑΡΟΜΕΤΡΟ (TURBO BOOST)
                  </h3>
                </div>
                <AnalogBoostGauge
                  boostBar={telemetry.boostBar}
                  boostPsi={telemetry.boostPsi}
                  peakBoostBar={telemetry.peakBoostBar}
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

        {/* Tab 2: Tuning & Engine Stages */}
        {activeTab === 'tuning' && (
          <EngineStageSelector
            currentStage={currentStage}
            currentOctane={currentOctane}
            onStageChange={setCurrentStage}
            onOctaneChange={setCurrentOctane}
          />
        )}

        {/* Tab 3: Dyno Power Curve */}
        {activeTab === 'dyno' && (
          <DynoPowerGraph
            telemetry={telemetry}
            currentStage={currentStage}
          />
        )}

        {/* Tab 4: VAG Measuring Blocks */}
        {activeTab === 'vagblocks' && (
          <VagMeasuringBlocks telemetry={telemetry} />
        )}

        {/* Tab 5: DTC Scanner */}
        {activeTab === 'dtc' && (
          <DtcScanner
            dtcs={activeDTCs}
            onRefresh={handleRefreshDTCs}
          />
        )}

        {/* Tab 6: Performance Timer */}
        {activeTab === 'timer' && (
          <PerformanceTimer currentSpeed={telemetry.speed} />
        )}

        {/* Tab 7: Datalogger */}
        {activeTab === 'logger' && (
          <DataLogger telemetry={telemetry} />
        )}

        {/* Tab 8: Android APK & Project */}
        {activeTab === 'apk' && (
          <AndroidApkCenter />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-[#050810] border-t border-slate-800/80 px-4 py-3 text-[11px] text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>AudiBFB Live • Package: <code className="text-slate-300">gr.audi.bfblive</code> • {stageConfig.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsHudOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 cursor-pointer font-sans"
            >
              HUD Παρμπρίζ
            </button>
            <button
              onClick={() => setActiveTab('apk')}
              className="text-red-400 hover:text-red-300 underline underline-offset-2 cursor-pointer font-sans font-medium"
            >
              Λήψη APK Project (.ZIP)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
