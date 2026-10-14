import React, { useState } from 'react';
import { Bluetooth, Wifi, Settings, Flame, X, CheckCircle, Info, Sparkles, RefreshCw } from 'lucide-react';
import { obdEngine, ConnectionMode, WifiObdConfig } from '../services/obdService';

interface Props {
  mode: ConnectionMode;
  onResetPeak: () => void;
  statusMessage?: string;
}

export const ThrottleSimulatorControl: React.FC<Props> = ({ mode, onResetPeak, statusMessage }) => {
  const [activePreset, setActivePreset] = useState<'idle' | 'city' | 'wot' | 'dyno'>('idle');
  const [isPressingPedal, setIsPressingPedal] = useState(false);
  const [throttleVal, setThrottleVal] = useState(0);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const initialWifi = obdEngine.getWifiConfig();
  const [wifiIp, setWifiIp] = useState(initialWifi.ip);
  const [wifiPort, setWifiPort] = useState(initialWifi.port.toString());

  const handlePresetChange = (preset: 'idle' | 'city' | 'wot' | 'dyno') => {
    setActivePreset(preset);
    obdEngine.setSimPreset(preset);
  };

  const startPressingPedal = () => {
    setIsPressingPedal(true);
    setThrottleVal(100);
    obdEngine.setManualThrottle(100);
  };

  const stopPressingPedal = () => {
    setIsPressingPedal(false);
    setThrottleVal(0);
    obdEngine.setManualThrottle(0);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setThrottleVal(val);
    obdEngine.setManualThrottle(val);
  };

  const handleBluetoothToggle = () => {
    if (mode === 'bluetooth') {
      obdEngine.disconnectBluetooth();
    } else {
      obdEngine.connectBluetooth();
    }
  };

  const handleWifiToggle = () => {
    if (mode === 'wifi') {
      obdEngine.disconnectWifi();
    } else {
      obdEngine.connectWifi({ ip: wifiIp, port: Number(wifiPort) || 35000 });
    }
  };

  const handleSaveWifiConfig = () => {
    obdEngine.setWifiConfig({ ip: wifiIp, port: Number(wifiPort) || 35000 });
    setShowSettingsModal(false);
    obdEngine.connectWifi({ ip: wifiIp, port: Number(wifiPort) || 35000 });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Connection status and WiFi / Bluetooth buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* WiFi OBD2 Button (Primary for ELM327 WiFi) */}
          <button
            onClick={handleWifiToggle}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md ${
              mode === 'wifi'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-400'
                : mode === 'connecting'
                ? 'bg-amber-600 animate-pulse text-white'
                : 'bg-emerald-700/80 hover:bg-emerald-600 text-white shadow-emerald-700/20'
            }`}
          >
            <Wifi className={`w-4 h-4 ${mode === 'connecting' ? 'animate-spin' : ''}`} />
            <span>{mode === 'wifi' ? 'WiFi OBD Συνδεδεμένο' : 'Σύνδεση WiFi OBD'}</span>
          </button>

          {/* Bluetooth OBD2 Button */}
          <button
            onClick={handleBluetoothToggle}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer ${
              mode === 'bluetooth'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title="Σύνδεση μέσω Bluetooth ELM327"
          >
            <Bluetooth className="w-3.5 h-3.5 text-blue-400" />
            <span>{mode === 'bluetooth' ? 'Bluetooth OK' : 'Bluetooth'}</span>
          </button>

          {/* Connection Settings gear */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            title="Ρυθμίσεις WiFi OBD (IP & Port: 192.168.0.10:35000)"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Status badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono">
            <span className={`w-2 h-2 rounded-full ${
              mode === 'wifi' ? 'bg-emerald-400 shadow-md shadow-emerald-400' :
              mode === 'bluetooth' ? 'bg-blue-400' :
              'bg-amber-400 animate-pulse'
            }`} />
            <span className="text-slate-300">
              {mode === 'wifi' ? `WiFi: ${wifiIp}:${wifiPort}` :
               mode === 'bluetooth' ? 'Bluetooth OBD2' :
               'ECU Simulator (BFB)'}
            </span>
          </div>
        </div>

        {/* Preset Selector */}
        {mode === 'simulator' && (
          <div className="flex items-center flex-wrap gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] text-slate-400 font-bold px-2 uppercase">Προσομοιωση:</span>
            <button
              onClick={() => handlePresetChange('idle')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activePreset === 'idle'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Ρελαντί (820 RPM)
            </button>
            <button
              onClick={() => handlePresetChange('city')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activePreset === 'city'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Πορεία (Cruise)
            </button>
            <button
              onClick={() => handlePresetChange('wot')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activePreset === 'wot'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Πάτημα WOT
            </button>
            <button
              onClick={() => handlePresetChange('dyno')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                activePreset === 'dyno'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Dyno
            </button>
          </div>
        )}

        {/* Hold to rev pedal and manual slider */}
        {mode === 'simulator' && (
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-mono">Πεταλούδα: {throttleVal}%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={throttleVal}
                onChange={handleSliderChange}
                className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>

            <button
              onMouseDown={startPressingPedal}
              onMouseUp={stopPressingPedal}
              onMouseLeave={stopPressingPedal}
              onTouchStart={startPressingPedal}
              onTouchEnd={stopPressingPedal}
              className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-lg select-none ${
                isPressingPedal
                  ? 'bg-red-500 text-white scale-95 shadow-red-500/50'
                  : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-red-600/30'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Flame className={`w-4 h-4 ${isPressingPedal ? 'animate-bounce' : ''}`} />
                {isPressingPedal ? 'WOT ΓΚΑΖΙ!' : 'Πατηστε Γκαζι'}
              </span>
            </button>
          </div>
        )}
      </div>

      {statusMessage && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span className="truncate">{statusMessage}</span>
          <span className="text-slate-400 shrink-0 ml-2">Audi ME7.5 ECU Engine Group 01</span>
        </div>
      )}

      {/* WiFi & Bluetooth Connection Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0f1422] border border-slate-700 p-6 shadow-2xl relative text-left space-y-4">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400">
                <Wifi className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Ρυθμίσεις Σύνδεσης OBD-II (WiFi / Bluetooth)</h3>
                <p className="text-xs text-slate-400">Πρωτόκολλο επικοινωνίας ELM327 για Audi 1.8T BFB</p>
              </div>
            </div>

            {/* WiFi settings fields */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Ρυθμίσεις WiFi OBD2 (Standard ELM327)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                  TCP IP Socket
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 block">IP Διεύθυνση Dongle</label>
                  <input
                    type="text"
                    value={wifiIp}
                    onChange={(e) => setWifiIp(e.target.value)}
                    placeholder="192.168.0.10"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block">Προεπιλογή: 192.168.0.10</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 block">Θύρα (Port)</label>
                  <input
                    type="text"
                    value={wifiPort}
                    onChange={(e) => setWifiPort(e.target.value)}
                    placeholder="35000"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block">Προεπιλογή: 35000</span>
                </div>
              </div>
            </div>

            {/* Step by step connection guide */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-400" />
                Πώς συνδέεστε στο αυτοκίνητο μέσω WiFi OBD2:
              </span>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                <li>Κουμπώστε το **WiFi ELM327 dongle** στη θύρα OBD2 (κάτω αριστερά από το τιμόνι του Audi A4 B6/B7).</li>
                <li>Γυρίστε το κλειδί στη μίζα (θέση Ignition ON).</li>
                <li>Ανοίξτε το **WiFi του κινητού σας** και συνδεθείτε στο δίκτυο <code className="text-emerald-400 font-mono">WiFi_OBDII</code> (ή <code className="text-emerald-400 font-mono">OBDII-WiFi</code>).</li>
                <li>Αν το Android ρωτήσει «Το δίκτυο δεν έχει internet, διατήρηση;», επιλέξτε **«Ναι / Διατήρηση σύνδεσης»**.</li>
                <li>Πατήστε **«Αποθήκευση &amp; Σύνδεση WiFi»** παρακάτω!</li>
              </ol>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
              >
                Κλείσιμο
              </button>
              <button
                onClick={handleSaveWifiConfig}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                Αποθήκευση &amp; Σύνδεση WiFi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
