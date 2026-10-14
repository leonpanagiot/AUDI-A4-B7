import React, { useState, useEffect } from 'react';
import { Bluetooth, Wifi, Settings, Flame, X, CheckCircle, Info, Sparkles, RefreshCw, Usb, Radio } from 'lucide-react';
import { obdEngine, ConnectionMode, WifiObdConfig, PairedBtDevice } from '../services/obdService';

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
  const [pairedDevices, setPairedDevices] = useState<PairedBtDevice[]>([]);
  const [selectedBtAddress, setSelectedBtAddress] = useState<string>('');

  const initialWifi = obdEngine.getWifiConfig();
  const [wifiIp, setWifiIp] = useState(initialWifi.ip);
  const [wifiPort, setWifiPort] = useState(initialWifi.port.toString());

  const isNative = obdEngine.isNativeAndroid();

  useEffect(() => {
    if (isNative) {
      const devices = obdEngine.getPairedDevices();
      setPairedDevices(devices);
      if (devices.length > 0 && !selectedBtAddress) {
        const found = devices.find(d => /obd|elm|vgate|car/i.test(d.name)) || devices[0];
        setSelectedBtAddress(found.address);
      }
    }
  }, [isNative, showSettingsModal]);

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
      obdEngine.connectBluetooth(selectedBtAddress || undefined);
    }
  };

  const handleWifiToggle = () => {
    if (mode === 'wifi') {
      obdEngine.disconnectWifi();
    } else {
      obdEngine.connectWifi({ ip: wifiIp, port: Number(wifiPort) || 35000 });
    }
  };

  const handleUsbToggle = () => {
    if (mode === 'usb') {
      obdEngine.disconnectBluetooth();
    } else {
      obdEngine.connectSerial();
    }
  };

  const handleSaveWifiConfig = () => {
    obdEngine.setWifiConfig({ ip: wifiIp, port: Number(wifiPort) || 35000 });
    setShowSettingsModal(false);
    obdEngine.connectWifi({ ip: wifiIp, port: Number(wifiPort) || 35000 });
  };

  const isLiveConnected = mode === 'bluetooth' || mode === 'wifi' || mode === 'usb';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Connection status and WiFi / Bluetooth / USB buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Bluetooth OBD2 Button */}
          <button
            onClick={handleBluetoothToggle}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md ${
              mode === 'bluetooth'
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 ring-2 ring-blue-400'
                : mode === 'connecting'
                ? 'bg-amber-600 animate-pulse text-white'
                : 'bg-blue-700/80 hover:bg-blue-600 text-white shadow-blue-700/20'
            }`}
            title="Σύνδεση με Bluetooth OBD2 (ELM327)"
          >
            <Bluetooth className={`w-4 h-4 ${mode === 'connecting' ? 'animate-spin' : ''}`} />
            <span>{mode === 'bluetooth' ? 'Bluetooth Συνδεδεμένο' : 'Σύνδεση Bluetooth'}</span>
          </button>

          {/* WiFi OBD2 Button */}
          <button
            onClick={handleWifiToggle}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer ${
              mode === 'wifi'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title="Σύνδεση μέσω WiFi ELM327 (192.168.0.10:35000)"
          >
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>{mode === 'wifi' ? 'WiFi OK' : 'WiFi OBD'}</span>
          </button>

          {/* USB Cable Button */}
          <button
            onClick={handleUsbToggle}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer ${
              mode === 'usb'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title="Σύνδεση με καλώδιο USB OTG KKL / FTDI"
          >
            <Usb className="w-3.5 h-3.5 text-purple-400" />
            <span>{mode === 'usb' ? 'USB OK' : 'USB OTG'}</span>
          </button>

          {/* Connection Settings gear */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            title="Ρυθμίσεις Συσκευών OBD (Bluetooth & WiFi)"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Status badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono">
            <span className={`w-2 h-2 rounded-full ${
              isLiveConnected ? 'bg-emerald-400 shadow-md shadow-emerald-400' :
              mode === 'connecting' ? 'bg-amber-400 animate-pulse' :
              'bg-amber-500'
            }`} />
            <span className="text-slate-300">
              {mode === 'bluetooth' ? 'Ζωντανό Bluetooth OBD2' :
               mode === 'wifi' ? `WiFi: ${wifiIp}:${wifiPort}` :
               mode === 'usb' ? 'USB KKL Cable' :
               'Λειτουργία Εξομοίωσης (DEMO)'}
            </span>
          </div>
        </div>

        {/* Live connected status badge OR Demo Controls */}
        {isLiveConnected ? (
          <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-300 font-mono">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>LIVE ECU 01-ENGINE DATA (ME7.5)</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            {/* Preset Selector */}
            <div className="flex items-center flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 font-bold px-1.5 uppercase">Demo:</span>
              <button
                onClick={() => handlePresetChange('idle')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  activePreset === 'idle'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Ρελαντί
              </button>
              <button
                onClick={() => handlePresetChange('city')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  activePreset === 'city'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Πορεία
              </button>
              <button
                onClick={() => handlePresetChange('wot')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  activePreset === 'wot'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                WOT
              </button>
            </div>

            {/* Hold to rev pedal and manual slider */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 font-mono">{throttleVal}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={throttleVal}
                  onChange={handleSliderChange}
                  className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
              </div>

              <button
                onMouseDown={startPressingPedal}
                onMouseUp={stopPressingPedal}
                onMouseLeave={stopPressingPedal}
                onTouchStart={startPressingPedal}
                onTouchEnd={stopPressingPedal}
                className={`px-3 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-lg select-none ${
                  isPressingPedal
                    ? 'bg-red-500 text-white scale-95 shadow-red-500/50'
                    : 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-red-600/30'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Flame className={`w-3.5 h-3.5 ${isPressingPedal ? 'animate-bounce' : ''}`} />
                  {isPressingPedal ? 'WOT!' : 'Γκάζι'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {statusMessage && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span className="truncate">{statusMessage}</span>
          <span className="text-slate-400 shrink-0 ml-2">Audi ME7.5 ECU Engine Group 01</span>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0f1422] border border-slate-700 p-6 shadow-2xl relative text-left space-y-4">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Ρυθμίσεις Σύνδεσης Dongle OBD-II</h3>
                <p className="text-xs text-slate-400">ELM327 Bluetooth Classic / BLE / WiFi / USB</p>
              </div>
            </div>

            {/* Bluetooth Paired Devices List (Android Native) */}
            {pairedDevices.length > 0 && (
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                  Συζευγμένες Συσκευές Bluetooth (Από το κινητό σας)
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {pairedDevices.map((dev) => (
                    <button
                      key={dev.address}
                      onClick={() => {
                        setSelectedBtAddress(dev.address);
                        setShowSettingsModal(false);
                        obdEngine.connectBluetooth(dev.address);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg border transition flex items-center justify-between cursor-pointer ${
                        selectedBtAddress === dev.address
                          ? 'bg-blue-900/40 border-blue-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Bluetooth className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold">{dev.name}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{dev.address}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                Οδηγίες σύνδεσης με το Audi A4 B7:
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                <li>Κουμπώστε το ELM327 dongle στη φίσα OBD2 (κάτω αριστερά από το τιμόνι).</li>
                <li>Γυρίστε το κλειδί στη θέση **Ignition ON** (ανοιχτός διακόπτης).</li>
                <li>Για Bluetooth: Κάντε πρώτα **σύζευξη (Pairing)** στις ρυθμίσεις Bluetooth του κινητού σας (κωδικός συνήθως <code className="text-blue-400">1234</code> ή <code className="text-blue-400">0000</code>).</li>
                <li>Για WiFi: Συνδεθείτε στο WiFi δίκτυο <code className="text-emerald-400">WiFi_OBDII</code>.</li>
              </ul>
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
                Σύνδεση WiFi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
