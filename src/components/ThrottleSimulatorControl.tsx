import React, { useState, useEffect } from 'react';
import { Bluetooth, Wifi, Settings, X, Info, Radio, Terminal, RefreshCw, AlertTriangle } from 'lucide-react';
import { obdEngine, ConnectionMode, PairedBtDevice, ObdDebugState } from '../services/obdService';

interface Props {
  mode: ConnectionMode;
  onResetPeak: () => void;
  statusMessage?: string;
  onOpenDebug?: () => void;
}

export const ThrottleSimulatorControl: React.FC<Props> = ({ mode, statusMessage, onOpenDebug }) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [pairedDevices, setPairedDevices] = useState<PairedBtDevice[]>([]);
  const [selectedBtAddress, setSelectedBtAddress] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<ObdDebugState>(obdEngine.getDebugState());
  const [reinitBusy, setReinitBusy] = useState(false);

  const initialWifi = obdEngine.getWifiConfig();
  const [wifiIp, setWifiIp] = useState(initialWifi.ip);
  const [wifiPort, setWifiPort] = useState(initialWifi.port.toString());

  const isNative = obdEngine.isNativeAndroid();

  useEffect(() => {
    const unsub = obdEngine.subscribe({
      onTelemetry: () => {},
      onStatusChange: () => {},
      onError: () => {},
      onDebugUpdate: (d) => setDebugInfo({ ...d })
    });
    return () => unsub();
  }, []);

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

  const handleDisconnect = () => {
    if (mode === 'wifi') {
      obdEngine.disconnectWifi();
    } else {
      obdEngine.disconnectBluetooth();
    }
  };

  const handleReinitEcu = async () => {
    setReinitBusy(true);
    try {
      await obdEngine.runFullSensorDiagnosticSweep();
    } finally {
      setReinitBusy(false);
    }
  };

  const handleForceProtocol = async (proto: string) => {
    setReinitBusy(true);
    try {
      await obdEngine.forceProtocol(proto);
    } finally {
      setReinitBusy(false);
    }
  };

  const handleSaveWifiConfig = () => {
    obdEngine.setWifiConfig({ ip: wifiIp, port: Number(wifiPort) || 35000 });
    setShowSettingsModal(false);
    obdEngine.connectWifi({ ip: wifiIp, port: Number(wifiPort) || 35000 });
  };

  const isLiveConnected = mode === 'bluetooth' || mode === 'wifi';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Connection status and Bluetooth / WiFi / Debug buttons */}
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

          {/* Connection Settings gear */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            title="Ρυθμίσεις Συσκευών OBD (Bluetooth & WiFi)"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Direct Debug Console Button */}
          {onOpenDebug && (
            <button
              onClick={onOpenDebug}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/70 border border-amber-500/50 text-amber-300 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              title="Άνοιγμα Κονσόλας Debug & Ελέγχου Αισθητήρων OBD-II"
            >
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>Debug OBD2</span>
            </button>
          )}

          {/* Status badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono">
            <span className={`w-2 h-2 rounded-full ${
              isLiveConnected ? 'bg-emerald-400 shadow-md shadow-emerald-400 animate-pulse' :
              mode === 'connecting' ? 'bg-amber-400 animate-pulse' :
              'bg-slate-500'
            }`} />
            <span className="text-slate-300">
              {mode === 'bluetooth' ? `BT: ${debugInfo.deviceName}` :
               mode === 'wifi' ? `WiFi: ${wifiIp}:${wifiPort}` :
               mode === 'connecting' ? 'Σύνδεση σε εξέλιξη...' :
               'Αποσυνδεδεμένο'}
            </span>
          </div>
        </div>

        {/* Live connected status badge & Re-Init button */}
        {isLiveConnected && (
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-300 font-mono">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>
                {debugInfo.ecuLocked
                  ? `ECU LOCKED (${debugInfo.protocolName})`
                  : 'DONGLE OK • ΑΝΑΜΟΝΗ ECU'}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-emerald-400">OK:{debugInfo.totalValidResponses}</span>
            </div>

            <button
              onClick={handleReinitEcu}
              disabled={reinitBusy}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/70 border border-blue-500/40 text-blue-300 text-xs font-semibold transition cursor-pointer"
              title="Επανασύνδεση πρωτοκόλλου ECU & σάρωση όλων των αισθητήρων"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reinitBusy ? 'animate-spin' : ''}`} />
              <span>Επανασύνδεση ECU</span>
            </button>

            <button
              onClick={handleDisconnect}
              className="px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-semibold transition cursor-pointer"
            >
              Αποσύνδεση
            </button>
          </div>
        )}
      </div>

      {/* ECU Waiting Warning & Quick Protocol Selector */}
      {isLiveConnected && !debugInfo.ecuLocked && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 text-xs text-amber-200 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-300">
                Το OBD2 Dongle είναι συνδεδεμένο, αλλά ο εγκέφαλος (Bosch ME7.5) είναι σε αναμονή (OK:0).
              </p>
              <p className="text-amber-200/90 text-[11px]">
                👉 <strong>Βήμα 1 - Διακόπτης Μίζας:</strong> Βεβαιωθείτε ότι ο διακόπτης του Audi είναι γυρισμένος στο <strong>ON (Θέση II - ταμπλό αναμμένο)</strong> ή ο κινητήρας σε λειτουργία. (Αν ο διακόπτης είναι κλειστός, ο εγκέφαλος δεν τροφοδοτείται με ρεύμα).
              </p>
              <p className="text-amber-200/90 text-[11px]">
                👉 <strong>Βήμα 2 - Άμεση δοκιμή πρωτοκόλλου K-Line:</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-2 pl-6">
            <button
              onClick={() => handleForceProtocol('ATSP3')}
              disabled={reinitBusy}
              className="px-2.5 py-1 rounded-lg bg-amber-900/70 hover:bg-amber-800 text-amber-200 text-xs font-mono font-bold border border-amber-500/40 transition cursor-pointer flex items-center gap-1"
            >
              <span>⚡ ATSP3 (ISO 9141-2)</span>
            </button>
            <button
              onClick={() => handleForceProtocol('ATSP4')}
              disabled={reinitBusy}
              className="px-2.5 py-1 rounded-lg bg-amber-900/70 hover:bg-amber-800 text-amber-200 text-xs font-mono font-bold border border-amber-500/40 transition cursor-pointer flex items-center gap-1"
            >
              <span>⚡ ATSP4 (KWP 5-baud)</span>
            </button>
            <button
              onClick={() => handleForceProtocol('ATSP5')}
              disabled={reinitBusy}
              className="px-2.5 py-1 rounded-lg bg-amber-900/70 hover:bg-amber-800 text-amber-200 text-xs font-mono font-bold border border-amber-500/40 transition cursor-pointer flex items-center gap-1"
            >
              <span>⚡ ATSP5 (KWP Fast)</span>
            </button>
            <button
              onClick={() => handleForceProtocol('ATSP0')}
              disabled={reinitBusy}
              className="px-2.5 py-1 rounded-lg bg-amber-900/70 hover:bg-amber-800 text-amber-200 text-xs font-mono font-bold border border-amber-500/40 transition cursor-pointer flex items-center gap-1"
            >
              <span>⚡ ATSP0 (Auto Search)</span>
            </button>
          </div>
        </div>
      )}

      {/* Disconnected notice */}
      {mode === 'disconnected' && (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-400 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              <strong>Μη συνδεδεμένο:</strong> Συνδέστε το Bluetooth ή WiFi OBD2 dongle σας με ανοιχτό διακόπτη (Ignition ON) για ζωντανή ανάγνωση αισθητήρων.
            </span>
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="mt-1 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between gap-2">
          <span className="truncate">{statusMessage}</span>
          <span className="text-slate-400 shrink-0">
            TX:{debugInfo.totalCommandsSent} | OK:{debugInfo.totalValidResponses} | ERR:{debugInfo.totalErrors}
          </span>
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
                <p className="text-xs text-slate-400">ELM327 Bluetooth Classic / BLE / WiFi</p>
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
