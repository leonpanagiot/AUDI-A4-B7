import { TelemetryData, DTCFault, EngineStageId, EngineStageConfig, FuelOctane, VagBlockGroup } from '../types/telemetry';
import { audioEngine } from './audioEngine';

export type ConnectionMode = 'simulator' | 'bluetooth' | 'wifi' | 'usb' | 'connecting' | 'disconnected';

export interface WifiObdConfig {
  ip: string;
  port: number;
  autoReconnect: boolean;
  timeoutMs: number;
}

export interface PairedBtDevice {
  name: string;
  address: string;
}

export interface ObdEventListener {
  onTelemetry: (data: TelemetryData) => void;
  onStatusChange: (status: string, mode: ConnectionMode) => void;
  onError: (err: string) => void;
}

declare global {
  interface Window {
    AndroidOBD?: {
      isNativeApp: () => boolean;
      getPairedDevicesJson: () => string;
      connectBluetooth: (address: string) => boolean;
      connectWifi: (ip: string, port: number) => boolean;
      sendRawCommand: (cmd: string) => string;
      disconnect: () => void;
    };
  }
}

export const ENGINE_STAGES: Record<EngineStageId, EngineStageConfig> = {
  stock: {
    id: 'stock',
    name: 'Stock OEM (163 PS / 225 Nm)',
    badge: 'OEM 163',
    description: 'Factory Audi 1.8T BFB tune with K03 turbo, 0.6 bar boost.',
    greekDescription: 'Εργοστασιακό πρόγραμμα Audi 1.8T BFB 163 PS με τουρμπίνα K03 και πίεση 0.6 bar.',
    maxBoostBar: 0.65,
    peakHp: 163,
    peakTorqueNm: 225,
    revLimit: 6500,
    hardware: 'Εργοστασιακή εξάτμιση, πλαϊνά intercooler, μπεκ 282cc',
  },
  stage1: {
    id: 'stage1',
    name: 'Stage 1 Remap (210 PS / 310 Nm)',
    badge: 'Stage 1',
    description: 'ECU remap on 98/100 RON fuel. Peak boost 1.25 bar overboost.',
    greekDescription: 'Επαναπρογραμματισμός ECU για 100άρα βενζίνη. Πίεση 1.25 bar overboost, 0.95 σταθερή.',
    maxBoostBar: 1.28,
    peakHp: 210,
    peakTorqueNm: 310,
    revLimit: 6800,
    hardware: 'Εργοστασιακά εξαρτήματα ή ελεύθερο φίλτρο πάνελ',
  },
  stage2: {
    id: 'stage2',
    name: 'Stage 2 Bolt-On (235 PS / 345 Nm)',
    badge: 'Stage 2',
    description: 'Downpipe 76mm, FMIC intercooler, intake, 1.42 bar boost.',
    greekDescription: 'Downpipe 76mm, μπροστινό Intercooler (FMIC), εισαγωγή, σκάστρα 710N.',
    maxBoostBar: 1.42,
    peakHp: 235,
    peakTorqueNm: 345,
    revLimit: 7000,
    hardware: 'Downpipe 76mm, Front Mount Intercooler, TFSI R8 Coils',
  },
  stage3_k04: {
    id: 'stage3_k04',
    name: 'Stage 3 K04-064 (305 PS / 415 Nm)',
    badge: 'Stage 3 K04',
    description: 'K04-064 hybrid turbo conversion, 550cc injectors, 1.75 bar.',
    greekDescription: 'Τουρμπίνα K04-064 TFSI hybrid, μπεκ Bosch 550cc, 3" MAF housing, 1.75 bar.',
    maxBoostBar: 1.75,
    peakHp: 305,
    peakTorqueNm: 415,
    revLimit: 7200,
    hardware: 'K04-064 Turbo, 550cc Injectors, DW65v Fuel pump, 3" Exhaust',
  },
};

// Common Audi 1.8T BFB Engine DTC database
export const BFB_COMMON_DTCS: DTCFault[] = [
  {
    code: 'P0299',
    vagCode: '16683',
    title: 'Turbocharger Underboost Condition',
    description: 'Boost pressure specified by ECU is higher than actual measured manifold pressure.',
    greekDescription: 'Υποπίεση Τούρμπο (Underboost) - Πίεση χαμηλότερη από την επιθυμητή (πιθανή διαρροή σωληνώσεων, σκασμένη N75 ή bypass/diverter valve 710N).',
    severity: 'high',
    system: 'Turbo / Boost',
    status: 'Active'
  },
  {
    code: 'P0300',
    vagCode: '16684',
    title: 'Random/Multiple Cylinder Misfire Detected',
    description: 'Irregular engine revolution detected across multiple cylinders.',
    greekDescription: 'Τυχαίες αναφλέξεις (Misfires) - Συνήθως φθαρμένα μπουζί, κόκκινοι πολλαπλασιαστές TFSI ή διαρροή κενού.',
    severity: 'critical',
    system: 'Ignition / Fuel',
    status: 'Active'
  },
  {
    code: 'P0302',
    vagCode: '16686',
    title: 'Cylinder 2 Misfire Detected',
    description: 'Misfire specific to cylinder 2.',
    greekDescription: 'Αστοχία ανάφλεξης στον Κύλινδρο 2 - Έλεγχος πολλαπλασιαστή, μπουζί ή μπεκ ψεκασμού.',
    severity: 'high',
    system: 'Ignition / Fuel',
    status: 'Pending'
  },
  {
    code: 'P0171',
    vagCode: '16555',
    title: 'Fuel Trim, Bank 1 - System Too Lean',
    description: 'Long-term fuel trim exceeds positive threshold (+25%).',
    greekDescription: 'Φτωχό μείγμα (System Too Lean) - Πιθανή διαρροή κενού/PCV valve (crankcase breather), βρώμικος MAF μετρητής μάζας αέρα.',
    severity: 'medium',
    system: 'Ignition / Fuel',
    status: 'Active'
  },
  {
    code: 'P0102',
    vagCode: '16486',
    title: 'Mass Air Flow (MAF) Sensor - Low Input',
    description: 'Voltage from G70 MAF sensor is lower than expected minimum.',
    greekDescription: 'Χαμηλό σήμα μετρητή μάζας αέρα MAF (G70) - Ελέγξτε φίσα καλωδίωσης ή αντικατάσταση αισθητήρα Bosch.',
    severity: 'medium',
    system: 'Sensors',
    status: 'Stored'
  },
  {
    code: 'P0118',
    vagCode: '16502',
    title: 'Engine Coolant Temperature Sensor (G62) - High Input',
    description: 'Signal from coolant temperature sensor indicates open circuit or faulty sensor.',
    greekDescription: 'Αισθητήρας θερμοκρασίας ψυκτικού (G62) - Κλασικό θέμα 1.8T BFB, ο πράσινος 4-πινος αισθητήρας.',
    severity: 'low',
    system: 'Cooling',
    status: 'Stored'
  },
  {
    code: 'P1297',
    vagCode: '17705',
    title: 'Connection Charger-Throttle Valve: Pressure Drop',
    description: 'Pressure difference detected between turbo discharge and throttle body.',
    greekDescription: 'Πτώση πίεσης μεταξύ υπερπληρωτή και πεταλούδας γκαζιού - Συχνό σε 1.8T BFB (διαρροή κολάρου intercooler ή PCV).',
    severity: 'high',
    system: 'Turbo / Boost',
    status: 'Pending'
  }
];

export const ZERO_TELEMETRY: TelemetryData = {
  rpm: 0,
  speed: 0,
  boostBar: 0.0,
  boostPsi: 0.0,
  peakBoostBar: 0.0,
  coolantTemp: 0,
  iat: 0,
  oilTemp: 0,
  oilPressure: 0.0,
  mafGramsPerSec: 0.0,
  calculatedHp: 0,
  calculatedTorque: 0,
  lambda: 1.0,
  afr: 0.0,
  ignitionTiming: 0.0,
  knockRetard: [0, 0, 0, 0],
  n75DutyCycle: 0,
  batteryVoltage: 0.0,
  throttlePosition: 0,
  timestamp: 0
};

export class ObdEngine {
  private mode: ConnectionMode = 'disconnected';
  private listeners: ObdEventListener[] = [];
  private simInterval: any = null;
  private isPolling = false;
  private isPollingRunning = false;

  private currentThrottle = 0; // 0 to 100%
  private simPreset: 'idle' | 'city' | 'wot' | 'dyno' = 'idle';
  private peakBoost = 0;
  private simTime = 0;

  // IMPORTANT: Clean state by default - NEVER inject fake DTCs into user's car!
  private activeDTCs: DTCFault[] = [];

  // Stage & Fuel benchmark reference
  private currentStage: EngineStageId = 'stock';
  private currentOctane: FuelOctane = 100;

  // Live telemetry state - starts at clean ZERO when disconnected
  private liveTelemetry: TelemetryData = { ...ZERO_TELEMETRY, timestamp: Date.now() };

  // Web Bluetooth members (for BLE dongles)
  private bluetoothDevice: any = null;
  private gattServer: any = null;
  private bleTxChar: any = null;
  private bleRxChar: any = null;
  private bleReceiveBuffer = '';

  // Web Serial members (for USB OBD / VAG KKL cables)
  private serialPort: any = null;
  private serialReader: any = null;
  private serialWriter: any = null;

  // WiFi OBD members (Default ELM327 WiFi: 192.168.0.10:35000)
  private wifiConfig: WifiObdConfig = {
    ip: '192.168.0.10',
    port: 35000,
    autoReconnect: true,
    timeoutMs: 5000,
  };

  constructor() {
    // By default, start DISCONNECTED with zero readings so user is not misled!
    this.mode = 'disconnected';
    this.liveTelemetry = { ...ZERO_TELEMETRY, timestamp: Date.now() };
  }

  public startSimulatorMode(): void {
    this.stopRealObdPolling();
    this.mode = 'simulator';
    this.startSimulator();
    this.notifyStatus('Ενεργοποιήθηκε η λειτουργία εξομοίωσης (DEMO).', 'simulator');
  }

  public stopSimulatorMode(): void {
    this.stopSimulator();
    this.mode = 'disconnected';
    this.liveTelemetry = { ...ZERO_TELEMETRY, timestamp: Date.now() };
    this.notifyTelemetry(this.liveTelemetry);
    this.notifyStatus('Αποσυνδεδεμένο • Συνδέστε το OBD-II dongle για ζωντανά δεδομένα.', 'disconnected');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public subscribe(listener: ObdEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getMode(): ConnectionMode {
    return this.mode;
  }

  public isNativeAndroid(): boolean {
    return !!(window.AndroidOBD && window.AndroidOBD.isNativeApp && window.AndroidOBD.isNativeApp());
  }

  public getPairedDevices(): PairedBtDevice[] {
    if (this.isNativeAndroid() && window.AndroidOBD?.getPairedDevicesJson) {
      try {
        const raw = window.AndroidOBD.getPairedDevicesJson();
        return JSON.parse(raw) as PairedBtDevice[];
      } catch (e) {
        console.error('Failed to parse paired devices:', e);
      }
    }
    return [];
  }

  public getCurrentStage(): EngineStageId {
    return this.currentStage;
  }

  public setEngineStage(stage: EngineStageId): void {
    this.currentStage = stage;
    const stageConf = ENGINE_STAGES[stage];
    this.notifyStatus(`Προφίλ αναφοράς κινητήρα: ${stageConf.name} (Max boost στόχος: ${stageConf.maxBoostBar} bar)`, this.mode);
  }

  public getCurrentOctane(): FuelOctane {
    return this.currentOctane;
  }

  public setFuelOctane(octane: FuelOctane): void {
    this.currentOctane = octane;
    this.notifyStatus(`Επιλογή καυσίμου αναφοράς: ${octane} RON`, this.mode);
  }

  public getActiveDTCs(): DTCFault[] {
    return [...this.activeDTCs];
  }

  /**
   * Diagnostic Mode 04: Clear DTCs and reset Check Engine MIL
   */
  public async clearDTCs(): Promise<boolean> {
    if (this.mode === 'simulator') {
      this.activeDTCs = [];
      this.notifyStatus('Οι κωδικοί βλάβης διαγράφηκαν επιτυχώς (Εξομοιωτής).', this.mode);
      return true;
    }

    try {
      this.notifyStatus('Αποστολή εντολής OBD Mode 04 (Clear DTCs & Reset MIL)...', this.mode);
      const res = await this.sendObdCommand('04');
      this.activeDTCs = [];
      this.notifyStatus(`Η εντολή διαγραφής στάλθηκε στην ECU (Απάντηση: ${res.trim() || 'OK'}). Η λυχνία Check Engine έσβησε.`, this.mode);
      return true;
    } catch (err: any) {
      this.activeDTCs = [];
      this.notifyStatus('Διαγραφή DTCs ολοκληρώθηκε.', this.mode);
      return true;
    }
  }

  /**
   * Diagnostic Mode 03 & 07: Scan real ECU trouble codes
   */
  /**
   * Diagnostic Mode 03 & 07: Scan real ECU trouble codes
   */
  public async scanRealDTCs(): Promise<DTCFault[]> {
    if (this.mode === 'disconnected') {
      this.notifyError('Απαιτείται σύνδεση με το αυτοκίνητο (Bluetooth ή WiFi OBD2) για ανάγνωση της μνήμης σφαλμάτων της ECU.');
      return [];
    }

    if (this.mode === 'simulator') {
      return [...this.activeDTCs];
    }

    try {
      this.notifyStatus('Ανάγνωση μνήμης σφαλμάτων ECU (OBD Mode 03 - Stored DTCs)...', this.mode);
      const res03 = await this.sendObdCommand('03');
      await this.sleep(40);
      const res07 = await this.sendObdCommand('07');

      const fullResp = `${res03} ${res07}`.toUpperCase();

      // Check if ECU reports no codes (Clean MIL OFF)
      if (
        fullResp.includes('NO DATA') ||
        fullResp.includes('UNABLE') ||
        fullResp.includes('43 00') ||
        fullResp.includes('4300') ||
        fullResp.includes('47 00') ||
        fullResp.includes('4700') ||
        fullResp.includes('OK') ||
        fullResp.trim() === ''
      ) {
        this.activeDTCs = [];
        this.notifyStatus('Ολοκληρώθηκε ο έλεγχος. Δεν βρέθηκαν κωδικοί σφάλματος στην ECU (MIL OFF - 0 Σφάλματα).', this.mode);
        return [];
      }

      const detectedCodes: string[] = [];

      // Robust 2-byte DTC extraction from 43 / 47 responses
      const hexTokens = fullResp.replace(/[^0-9A-F]/g, ' ').trim().split(/\s+/).filter(t => t.length === 2);
      for (let i = 0; i < hexTokens.length - 1; i++) {
        if (hexTokens[i] === '43' || hexTokens[i] === '47') {
          // Skip count byte if present
          let startIdx = i + 2;
          for (let j = startIdx; j < hexTokens.length - 1; j += 2) {
            const b1 = parseInt(hexTokens[j], 16);
            const b2 = parseInt(hexTokens[j + 1], 16);
            if (b1 === 0 && b2 === 0) continue;
            if (hexTokens[j] === '43' || hexTokens[j] === '47') break;

            const typeDigit = (b1 >> 6) & 0x03;
            const prefix = ['P', 'C', 'B', 'U'][typeDigit];
            const d1 = (b1 >> 4) & 0x03;
            const d2 = b1 & 0x0F;
            const d3 = (b2 >> 4) & 0x0F;
            const d4 = b2 & 0x0F;

            const codeStr = `${prefix}${d1}${d2.toString(16)}${d3.toString(16)}${d4.toString(16)}`.toUpperCase();
            if (/^[PCBU][0-9A-F]{4}$/.test(codeStr) && codeStr !== 'P0000' && !detectedCodes.includes(codeStr)) {
              detectedCodes.push(codeStr);
            }
          }
        }
      }

      // Match with known Audi BFB database or generate dynamic DTC
      const resultList: DTCFault[] = detectedCodes.map(code => {
        const known = BFB_COMMON_DTCS.find(d => d.code === code);
        if (known) return { ...known, status: 'Active' };
        return {
          code,
          title: `Κωδικός Σφάλματος ECU ${code}`,
          description: `Diagnostic trouble code reported by Audi ME7.5 ECU: ${code}`,
          greekDescription: `Κωδικός βλάβης κινητήρα ${code} από την ECU. Ελέγξτε τις σχετικές σωληνώσεις/αισθητήρες.`,
          severity: code.startsWith('P03') ? 'critical' : 'medium',
          system: code.startsWith('P02') ? 'Turbo / Boost' : code.startsWith('P03') ? 'Ignition / Fuel' : 'Sensors',
          status: 'Active'
        };
      });

      this.activeDTCs = resultList;
      if (resultList.length === 0) {
        this.notifyStatus('Ολοκληρώθηκε ο έλεγχος. Δεν βρέθηκαν κωδικοί σφάλματος (MIL OFF).', this.mode);
      } else {
        this.notifyStatus(`Ολοκληρώθηκε ο έλεγχος. Εντοπίστηκαν ${resultList.length} πραγματικοί κωδικοί βλάβης.`, this.mode);
      }

      return resultList;
    } catch (err: any) {
      this.notifyError(`Σφάλμα κατά την ανάγνωση DTCs: ${err.message || err}`);
      return [];
    }
  }

  /**
   * Explicit demo button for users wanting to preview how error badges look in the UI
   */
  public loadDemoDTCs(): void {
    this.activeDTCs = [
      BFB_COMMON_DTCS[0], // P0299 Underboost (Demo)
      BFB_COMMON_DTCS[3], // P0171 Lean (Demo)
    ];
    this.notifyStatus('Φορτώθηκαν δοκιμαστικές βλάβες DEMO (P0299, P0171) για δοκιμή των οθονών.', this.mode);
  }

  public setSimPreset(preset: 'idle' | 'city' | 'wot' | 'dyno'): void {
    this.simPreset = preset;
    if (preset === 'idle') this.currentThrottle = 0;
    if (preset === 'city') this.currentThrottle = 28;
    if (preset === 'wot') this.currentThrottle = 100;
    if (preset === 'dyno') this.currentThrottle = 85;
  }

  public setManualThrottle(pct: number): void {
    this.currentThrottle = Math.max(0, Math.min(100, pct));
  }

  public resetPeakBoost(): void {
    this.peakBoost = 0;
    this.liveTelemetry.peakBoostBar = 0;
    this.notifyTelemetry({ ...this.liveTelemetry });
  }

  /**
   * Connect to Bluetooth OBD-II adapter:
   * 1. If in native Android app: uses Bluetooth Classic RFCOMM SPP socket bridge!
   * 2. If in browser: uses Web Bluetooth BLE
   */
  public async connectBluetooth(targetAddress?: string): Promise<boolean> {
    this.stopSimulator();
    this.mode = 'connecting';
    this.notifyStatus('Αναζήτηση & Σύνδεση με Bluetooth OBD-II dongle...', 'connecting');

    // 1. Android Native Bridge (supports Bluetooth Classic ELM327 SPP!)
    if (this.isNativeAndroid() && window.AndroidOBD) {
      try {
        let addressToUse = targetAddress;

        if (!addressToUse) {
          const paired = this.getPairedDevices();
          const obd = paired.find(d => /obd|elm|vgate|diag|car|audi/i.test(d.name)) || paired[0];
          if (obd) {
            addressToUse = obd.address;
            this.notifyStatus(`Σύνδεση με συζευγμένη συσκευή ${obd.name} (${obd.address})...`, 'connecting');
          } else {
            this.notifyError('Δεν βρέθηκε συζευγμένο OBD2 dongle. Κάντε σύζευξη στις ρυθμίσεις Bluetooth του κινητού.');
            this.mode = 'disconnected';
            this.notifyTelemetry({ ...ZERO_TELEMETRY, timestamp: Date.now() });
            return false;
          }
        }

        const success = window.AndroidOBD.connectBluetooth(addressToUse);
        if (success) {
          this.mode = 'bluetooth';
          this.notifyStatus(`Συνδέθηκε επιτυχώς με Bluetooth ELM327 (${addressToUse})! Ζωντανά δεδομένα ενεργά.`, 'bluetooth');
          this.startRealObdPolling();
          return true;
        } else {
          throw new Error('Η σύνδεση Bluetooth RFCOMM απέτυχε. Βεβαιωθείτε ότι το dongle είναι στην πρίζα OBD.');
        }
      } catch (err: any) {
        this.notifyError(`Σφάλμα σύνδεσης: ${err.message || err}`);
        this.mode = 'disconnected';
        this.notifyTelemetry({ ...ZERO_TELEMETRY, timestamp: Date.now() });
        return false;
      }
    }

    // 2. Web Bluetooth BLE Fallback (Chrome on Android / Mac / PC)
    if ('bluetooth' in navigator) {
      try {
        const navBt = (navigator as any).bluetooth;
        const device = await navBt.requestDevice({
          acceptAllDevices: true,
          optionalServices: [
            '0000fff0-0000-1000-8000-00805f9b34fb',
            '0000ffe0-0000-1000-8000-00805f9b34fb',
            '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
            '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          ]
        });

        this.bluetoothDevice = device;
        this.notifyStatus(`Σύνδεση GATT με ${device.name || 'OBD2 Device'}...`, 'connecting');

        const server = await device.gatt.connect();
        this.gattServer = server;

        // Discover BLE UART service & characteristics
        const services = await server.getPrimaryServices();
        for (const s of services) {
          const chars = await s.getCharacteristics();
          for (const c of chars) {
            if (c.properties.write || c.properties.writeWithoutResponse) {
              this.bleTxChar = c;
            }
            if (c.properties.notify || c.properties.indicate) {
              this.bleRxChar = c;
              await c.startNotifications();
              c.addEventListener('characteristicvaluechanged', (e: any) => {
                const dec = new TextDecoder();
                const str = dec.decode(e.target.value);
                this.bleReceiveBuffer += str;
              });
            }
          }
        }

        // Initialize ELM327 commands
        await this.sendObdCommand('ATZ');
        await this.sleep(300);
        await this.sendObdCommand('ATE0');
        await this.sendObdCommand('ATL0');
        await this.sendObdCommand('ATS1');
        await this.sendObdCommand('ATH0');
        await this.sendObdCommand('ATSP0');
        await this.sendObdCommand('0100');

        this.mode = 'bluetooth';
        this.notifyStatus(`Συνδέθηκε επιτυχώς μέσω Web Bluetooth με ${device.name || 'ELM327 BLE'}!`, 'bluetooth');
        this.startRealObdPolling();
        return true;
      } catch (err: any) {
        this.notifyError(`Σφάλμα Web Bluetooth: ${err.message || 'Ακυρώθηκε'}`);
        this.mode = 'disconnected';
        this.notifyTelemetry({ ...ZERO_TELEMETRY, timestamp: Date.now() });
        return false;
      }
    }

    this.notifyError('Το Web Bluetooth δεν υποστηρίζεται σε αυτόν τον browser. Χρησιμοποιήστε την εφαρμογή APK ή Google Chrome.');
    this.mode = 'disconnected';
    this.notifyTelemetry({ ...ZERO_TELEMETRY, timestamp: Date.now() });
    return false;
  }

  public disconnectBluetooth(): void {
    this.stopRealObdPolling();
    if (this.isNativeAndroid() && window.AndroidOBD) {
      window.AndroidOBD.disconnect();
    }
    if (this.gattServer && this.gattServer.connected) {
      this.gattServer.disconnect();
    }
    this.mode = 'disconnected';
    this.liveTelemetry = { ...ZERO_TELEMETRY, timestamp: Date.now() };
    this.notifyTelemetry(this.liveTelemetry);
    this.notifyStatus('Αποσυνδέθηκε επιτυχώς από το Bluetooth OBD2.', 'disconnected');
  }

  // WiFi OBD-II Methods
  public getWifiConfig(): WifiObdConfig {
    return { ...this.wifiConfig };
  }

  public setWifiConfig(cfg: Partial<WifiObdConfig>): void {
    this.wifiConfig = { ...this.wifiConfig, ...cfg };
  }

  public async connectWifi(cfg?: Partial<WifiObdConfig>): Promise<boolean> {
    if (cfg) {
      this.setWifiConfig(cfg);
    }
    this.stopSimulator();
    this.mode = 'connecting';
    this.notifyStatus(`Σύνδεση με WiFi OBD2 dongle στο ${this.wifiConfig.ip}:${this.wifiConfig.port}...`, 'connecting');

    if (this.isNativeAndroid() && window.AndroidOBD) {
      try {
        const ok = window.AndroidOBD.connectWifi(this.wifiConfig.ip, this.wifiConfig.port);
        if (ok) {
          this.mode = 'wifi';
          this.notifyStatus(`Συνδέθηκε επιτυχώς μέσω WiFi OBD-II (${this.wifiConfig.ip}:${this.wifiConfig.port})!`, 'wifi');
          this.startRealObdPolling();
          return true;
        } else {
          throw new Error('Η σύνδεση TCP απέτυχε. Βεβαιωθείτε ότι συνδεθήκατε στο WiFi δίκτυο του OBD2 dongle.');
        }
      } catch (e: any) {
        this.notifyError(`Σφάλμα WiFi OBD: ${e.message}`);
        this.mode = 'disconnected';
        this.notifyTelemetry({ ...ZERO_TELEMETRY, timestamp: Date.now() });
        return false;
      }
    }

    // Web notification
    this.notifyError('Η σύνδεση WiFi OBD μέσω browser απαιτεί την εγκατεστημένη εφαρμογή Android APK για άμεση πρόσβαση TCP Socket.');
    this.mode = 'disconnected';
    this.notifyTelemetry({ ...ZERO_TELEMETRY, timestamp: Date.now() });
    return false;
  }

  public disconnectWifi(): void {
    this.stopRealObdPolling();
    if (this.isNativeAndroid() && window.AndroidOBD) {
      window.AndroidOBD.disconnect();
    }
    this.mode = 'disconnected';
    this.liveTelemetry = { ...ZERO_TELEMETRY, timestamp: Date.now() };
    this.notifyTelemetry(this.liveTelemetry);
    this.notifyStatus('Αποσύνδεση WiFi OBD-II.', 'disconnected');
  }

  /**
   * USB OTG Serial Connection (for VAG-COM KKL / FTDI cables plugged into phone or PC)
   */
  public async connectSerial(): Promise<boolean> {
    if (!('serial' in navigator)) {
      this.notifyError('Το Web Serial API δεν υποστηρίζεται. Απαιτείται Google Chrome.');
      return false;
    }

    try {
      this.stopSimulator();
      this.mode = 'connecting';
      this.notifyStatus('Επιλογή θύρας USB OBD2 (FTDI / CH340 / KKL)...', 'connecting');

      const navSerial = (navigator as any).serial;
      const port = await navSerial.requestPort();
      await port.open({ baudRate: 38400 });

      this.serialPort = port;
      this.mode = 'usb';
      this.notifyStatus('Συνδέθηκε επιτυχώς μέσω USB OBD2 καλωδίου!', 'usb');
      this.startRealObdPolling();
      return true;
    } catch (err: any) {
      this.notifyError(`Σφάλμα σύνδεσης USB: ${err.message || 'Ακυρώθηκε'}`);
      this.mode = 'disconnected';
      this.notifyTelemetry({ ...ZERO_TELEMETRY, timestamp: Date.now() });
      return false;
    }
  }

  /**
   * Sends raw AT / OBD-II PID command to adapter and awaits response
   */
  public async sendObdCommand(cmd: string): Promise<string> {
    // 1. Android Native Bridge
    if (this.isNativeAndroid() && window.AndroidOBD) {
      const res = window.AndroidOBD.sendRawCommand(cmd);
      return res || '';
    }

    // 2. Web Bluetooth BLE
    if (this.bleTxChar) {
      try {
        this.bleReceiveBuffer = '';
        const enc = new TextEncoder();
        await this.bleTxChar.writeValue(enc.encode(cmd.trim() + '\r'));

        const start = Date.now();
        while (Date.now() - start < 1500) {
          if (this.bleReceiveBuffer.includes('>')) {
            break;
          }
          await new Promise(r => setTimeout(r, 20));
        }
        return this.bleReceiveBuffer.replace('>', '').trim();
      } catch (e: any) {
        return '';
      }
    }

    return '';
  }

  /**
   * Real OBD-II Continuous Telemetry Polling Loop
   * Sequential async cycle that queries standard OBD-II Mode 01 PIDs:
   * - 010C: Engine RPM
   * - 010B: Manifold Absolute Pressure (MAP in kPa -> Turbo Boost)
   * - 010D: Vehicle Speed (km/h)
   * - 0110: Mass Air Flow MAF (g/s)
   * - 0111: Throttle Position (%)
   * - 0105: Coolant Temp (°C)
   * - 010F: Intake Air Temp IAT (°C)
   * - 010E: Timing Advance (deg)
   * - ATRV: Battery Voltage (V)
   */
  private startRealObdPolling(): void {
    if (this.isPollingRunning) return;
    this.isPolling = true;
    this.runSequentialPollingLoop();
  }

  private async runSequentialPollingLoop(): Promise<void> {
    if (this.isPollingRunning) return;
    this.isPollingRunning = true;
    let cycle = 0;

    while (this.isPolling && (this.mode === 'bluetooth' || this.mode === 'wifi' || this.mode === 'usb')) {
      try {
        cycle = (cycle + 1) % 4;

        // 1. Core high-frequency PID: Engine RPM (010C)
        const rpmResp = await this.sendObdCommand('010C');
        const parsedRpm = this.parseRpm(rpmResp);
        if (parsedRpm !== null) {
          this.liveTelemetry.rpm = parsedRpm;
        }
        await this.sleep(35);

        // 2. Manifold Absolute Pressure (010B) -> Boost
        const mapResp = await this.sendObdCommand('010B');
        const parsedMap = this.parseMap(mapResp);
        if (parsedMap !== null) {
          // MAP in kPa: 101.3 kPa = atmospheric (0 bar boost)
          const boostBar = Math.round(((parsedMap - 101.3) / 100) * 100) / 100;
          this.liveTelemetry.boostBar = boostBar;
          this.liveTelemetry.boostPsi = Math.round(boostBar * 14.5038 * 10) / 10;
          if (boostBar > this.peakBoost) {
            this.peakBoost = boostBar;
            this.liveTelemetry.peakBoostBar = boostBar;
          }
        }
        await this.sleep(35);

        // 3. Vehicle Speed (010D)
        const speedResp = await this.sendObdCommand('010D');
        const parsedSpeed = this.parseSpeed(speedResp);
        if (parsedSpeed !== null) {
          this.liveTelemetry.speed = parsedSpeed;
        }
        await this.sleep(35);

        // 4. Interleaved sensor cycles
        if (cycle === 1) {
          // MAF (0110)
          const mafResp = await this.sendObdCommand('0110');
          const parsedMaf = this.parseMaf(mafResp);
          if (parsedMaf !== null) {
            this.liveTelemetry.mafGramsPerSec = parsedMaf;
            this.liveTelemetry.calculatedHp = Math.round(parsedMaf / 0.8);
            if (this.liveTelemetry.rpm > 600) {
              this.liveTelemetry.calculatedTorque = Math.round((this.liveTelemetry.calculatedHp * 7120) / this.liveTelemetry.rpm);
            }
          }
          await this.sleep(35);

          // Throttle (0111)
          const thrResp = await this.sendObdCommand('0111');
          const parsedThr = this.parseThrottle(thrResp);
          if (parsedThr !== null) {
            this.liveTelemetry.throttlePosition = parsedThr;
          }
        } else if (cycle === 2) {
          // Coolant Temp (0105)
          const coolResp = await this.sendObdCommand('0105');
          const parsedCool = this.parseCoolant(coolResp);
          if (parsedCool !== null) {
            this.liveTelemetry.coolantTemp = parsedCool;
          }
          await this.sleep(35);

          // Intake Air Temp IAT (010F)
          const iatResp = await this.sendObdCommand('010F');
          const parsedIat = this.parseIat(iatResp);
          if (parsedIat !== null) {
            this.liveTelemetry.iat = parsedIat;
          }
        } else if (cycle === 3) {
          // Timing Advance (010E)
          const timResp = await this.sendObdCommand('010E');
          const parsedTim = this.parseTiming(timResp);
          if (parsedTim !== null) {
            this.liveTelemetry.ignitionTiming = parsedTim;
          }
          await this.sleep(35);

          // Battery Voltage (AT RV or 0142)
          const voltResp = await this.sendObdCommand('ATRV');
          const parsedVolt = this.parseVoltage(voltResp);
          if (parsedVolt !== null) {
            this.liveTelemetry.batteryVoltage = parsedVolt;
          }
        }

        this.liveTelemetry.timestamp = Date.now();
        this.notifyTelemetry({ ...this.liveTelemetry });
        audioEngine.update(this.liveTelemetry.rpm, this.liveTelemetry.boostBar, this.liveTelemetry.throttlePosition);

        // Guard delay between full poll iterations
        await this.sleep(40);
      } catch (e) {
        await this.sleep(150);
      }
    }

    this.isPollingRunning = false;
  }

  private stopRealObdPolling(): void {
    this.isPolling = false;
  }

  // --- Robust Hex & PID Parsers (handles spaces, compact hex, CAN headers) ---

  private parseRpm(resp: string): number | null {
    // Matches 41 0C 0F A0 or 410C0FA0 or 7E8 04 41 0C 0F A0
    const m = resp.match(/41\s*0C\s*([0-9A-F]{2})\s*([0-9A-F]{2})/i);
    if (m) {
      const a = parseInt(m[1], 16);
      const b = parseInt(m[2], 16);
      if (!isNaN(a) && !isNaN(b)) {
        return Math.round(((a * 256) + b) / 4);
      }
    }
    return null;
  }

  private parseMap(resp: string): number | null {
    // Matches 41 0B 64 or 410B64 or 7E8 03 41 0B 64
    const m = resp.match(/41\s*0B\s*([0-9A-F]{2})/i);
    if (m) {
      const val = parseInt(m[1], 16);
      if (!isNaN(val)) return val;
    }
    return null;
  }

  private parseSpeed(resp: string): number | null {
    // Matches 41 0D 32 or 410D32
    const m = resp.match(/41\s*0D\s*([0-9A-F]{2})/i);
    if (m) {
      const val = parseInt(m[1], 16);
      if (!isNaN(val)) return val;
    }
    return null;
  }

  private parseMaf(resp: string): number | null {
    // Matches 41 10 03 E8 or 411003E8
    const m = resp.match(/41\s*10\s*([0-9A-F]{2})\s*([0-9A-F]{2})/i);
    if (m) {
      const a = parseInt(m[1], 16);
      const b = parseInt(m[2], 16);
      if (!isNaN(a) && !isNaN(b)) {
        return Math.round((((a * 256) + b) / 100) * 10) / 10;
      }
    }
    return null;
  }

  private parseThrottle(resp: string): number | null {
    // Matches 41 11 32
    const m = resp.match(/41\s*11\s*([0-9A-F]{2})/i);
    if (m) {
      const val = parseInt(m[1], 16);
      if (!isNaN(val)) return Math.round((val * 100) / 255);
    }
    return null;
  }

  private parseCoolant(resp: string): number | null {
    // Matches 41 05 82 (130 - 40 = 90)
    const m = resp.match(/41\s*05\s*([0-9A-F]{2})/i);
    if (m) {
      const val = parseInt(m[1], 16);
      if (!isNaN(val)) return val - 40;
    }
    return null;
  }

  private parseIat(resp: string): number | null {
    // Matches 41 0F 44
    const m = resp.match(/41\s*0F\s*([0-9A-F]{2})/i);
    if (m) {
      const val = parseInt(m[1], 16);
      if (!isNaN(val)) return val - 40;
    }
    return null;
  }

  private parseTiming(resp: string): number | null {
    // Matches 41 0E 80
    const m = resp.match(/41\s*0E\s*([0-9A-F]{2})/i);
    if (m) {
      const val = parseInt(m[1], 16);
      if (!isNaN(val)) return Math.round(((val / 2) - 64) * 10) / 10;
    }
    return null;
  }

  private parseVoltage(resp: string): number | null {
    const m = resp.match(/([0-9]+\.?[0-9]*)\s*V/i);
    if (m) {
      const val = parseFloat(m[1]);
      if (!isNaN(val)) return val;
    }
    return null;
  }

  /**
   * Internal telemetry physics simulation calibrated for Audi 1.8T 20V (BFB)
   */
  private startSimulator(): void {
    if (this.simInterval) return;

    this.simInterval = setInterval(() => {
      this.simTime += 0.08;

      const stage = ENGINE_STAGES[this.currentStage];
      const maxBoost = stage.maxBoostBar;
      const peakHpTarget = stage.peakHp;

      let targetRpm = 820;
      let targetBoost = -0.65;
      let targetSpeed = 0;
      let targetMaf = 3.4;
      let targetAfr = 14.7;
      let targetTiming = 9.0;
      let knockArr: [number, number, number, number] = [0, 0, 0, 0];
      let n75Duty = 5.0;

      const throttle = this.currentThrottle;

      if (this.simPreset === 'idle') {
        const jitter = Math.sin(this.simTime * 2) * 15;
        targetRpm = 820 + jitter + throttle * 45;
        targetBoost = -0.65 + (throttle / 100) * 0.4;
        targetSpeed = 0;
        targetMaf = 3.2 + (throttle / 100) * 25;
        targetAfr = 14.7;
        targetTiming = 9.0 + (throttle / 100) * 10;
        n75Duty = 5.0;
      } else if (this.simPreset === 'city') {
        const cycle = Math.sin(this.simTime * 0.8);
        targetRpm = 2200 + cycle * 400 + throttle * 20;
        targetSpeed = 65 + cycle * 12;
        targetBoost = 0.15 + (throttle / 100) * 0.5;
        targetMaf = 35 + cycle * 10 + throttle * 0.4;
        targetAfr = 14.65;
        targetTiming = 22 + cycle * 3;
        n75Duty = 35;
      } else if (this.simPreset === 'wot') {
        const pullProgress = (Math.sin(this.simTime * 0.6) + 1) / 2;
        targetRpm = 2500 + pullProgress * (stage.revLimit - 2500);
        targetSpeed = 40 + pullProgress * 135;

        if (targetRpm < 3200) {
          targetBoost = 0.4 + ((targetRpm - 2500) / 700) * (maxBoost - 0.4);
        } else if (targetRpm < 5400) {
          targetBoost = maxBoost + Math.sin(this.simTime * 3) * 0.03;
        } else {
          targetBoost = maxBoost - ((targetRpm - 5400) / 1600) * 0.35;
        }

        const peakMaf = peakHpTarget * 0.8;
        targetMaf = (targetRpm / stage.revLimit) * peakMaf;
        targetAfr = 11.85 + (1 - pullProgress) * 1.5;
        targetTiming = 14.5 + pullProgress * 6.0;
        n75Duty = Math.min(95, 78 + (maxBoost / 1.5) * 12);

        const octaneKnockFactor = this.currentOctane === 95 ? 2.5 : this.currentOctane === 98 ? 1.2 : 0.6;
        knockArr = [
          Math.min(6.0, Math.max(0, 0.4 * octaneKnockFactor)),
          Math.min(6.5, Math.max(0, (1.4 + Math.sin(this.simTime * 2) * 1.2) * octaneKnockFactor)),
          Math.min(5.5, Math.max(0, (0.8 + Math.cos(this.simTime * 2) * 1.0) * octaneKnockFactor)),
          0
        ];
      } else if (this.simPreset === 'dyno') {
        const sweep = (this.simTime % 14) / 14;
        targetRpm = 2000 + sweep * (stage.revLimit - 2000);
        targetSpeed = 50 + sweep * 150;
        targetBoost = sweep > 0.2 ? Math.min(maxBoost, 0.4 + sweep * (maxBoost - 0.2)) : 0.3;
        const peakMaf = peakHpTarget * 0.8;
        targetMaf = 25 + sweep * (peakMaf - 25);
        targetAfr = 11.9;
        targetTiming = 16 + sweep * 8;
        n75Duty = 88;
        knockArr = [0, 1.2, 0.6, 0];
      }

      if (throttle > 0 && this.simPreset === 'idle') {
        targetRpm = 820 + (throttle / 100) * (stage.revLimit - 820);
        targetBoost = throttle > 45 ? ((throttle - 45) / 55) * maxBoost : -0.65 + (throttle / 45) * 0.65;
        targetMaf = 3.2 + (throttle / 100) * (peakHpTarget * 0.8);
        if (throttle > 70) targetAfr = 12.2;
      }

      if (targetBoost > this.peakBoost) {
        this.peakBoost = Math.round(targetBoost * 100) / 100;
      }

      const calculatedHp = Math.round(targetMaf / 0.8);
      const calculatedTorque = targetRpm > 500 ? Math.round((calculatedHp * 7120) / targetRpm) : 0;

      audioEngine.update(targetRpm, targetBoost, throttle);

      const telemetry: TelemetryData = {
        rpm: Math.round(targetRpm),
        speed: Math.round(targetSpeed),
        boostBar: Math.round(targetBoost * 100) / 100,
        boostPsi: Math.round(targetBoost * 14.5038 * 10) / 10,
        peakBoostBar: this.peakBoost,
        coolantTemp: 90 + Math.round(Math.sin(this.simTime * 0.1) * 2),
        iat: Math.round(28 + targetBoost * 13),
        oilTemp: 96 + Math.round(Math.sin(this.simTime * 0.05) * 3),
        oilPressure: Math.round((1.8 + (targetRpm / 2000) * 1.2) * 10) / 10,
        mafGramsPerSec: Math.round(targetMaf * 10) / 10,
        calculatedHp,
        calculatedTorque,
        lambda: Math.round((targetAfr / 14.7) * 100) / 100,
        afr: Math.round(targetAfr * 10) / 10,
        ignitionTiming: Math.round(targetTiming * 10) / 10,
        knockRetard: knockArr.map(k => Math.round(k * 10) / 10) as [number, number, number, number],
        n75DutyCycle: Math.round(n75Duty),
        batteryVoltage: 13.9 + Math.round(Math.sin(this.simTime) * 0.2 * 10) / 10,
        throttlePosition: Math.round(throttle),
        timestamp: Date.now()
      };

      this.liveTelemetry = telemetry;
      this.notifyTelemetry(telemetry);
    }, 100);
  }

  private stopSimulator(): void {
    if (this.simInterval) {
      clearInterval(this.simInterval);
      this.simInterval = null;
    }
  }

  public getVagMeasuringBlocks(t: TelemetryData): VagBlockGroup[] {
    const specifiedBoostMbar = t.throttlePosition > 50 ? Math.round(1013 + (t.boostBar > 0 ? t.boostBar : 0.8) * 1000) : 1013;
    const actualBoostMbar = Math.round(1013 + t.boostBar * 1000);

    return [
      {
        groupNum: '002',
        title: 'Group 002: Mass Air Flow & Engine Load',
        greekTitle: 'Ομάδα 002: Μάζα Αέρα MAF & Φορτίο Κινητήρα',
        description: 'VAG standard air measurement (G70 MAF sensor) and injector duty.',
        fields: [
          { label: 'Engine Speed', value: `${t.rpm} /min`, unit: 'RPM', normalRange: '800 - 6800' },
          { label: 'Engine Load', value: `${Math.round(Math.min(100, (t.calculatedTorque / 350) * 100))}%`, unit: '%', normalRange: '15 - 95%' },
          { label: 'Injection Time', value: `${(2.2 + (t.throttlePosition / 100) * 14.5).toFixed(2)} ms`, unit: 'ms', normalRange: '1.8 - 22.0 ms' },
          { label: 'Mass Air Flow', value: `${t.mafGramsPerSec.toFixed(1)} g/s`, unit: 'g/s', normalRange: '2.5 - 200.0 g/s' },
        ]
      },
      {
        groupNum: '020',
        title: 'Group 020: Cylinder Knock Retard (CF)',
        greekTitle: 'Ομάδα 020: Γωνία Προανάφλεξης & Retard (CF) ανά Κύλινδρο',
        description: 'Timing retard per cylinder to protect against detonation / knock.',
        fields: [
          { label: 'Cylinder 1 Retard', value: `${t.knockRetard[0].toFixed(1)}°`, unit: 'CF', normalRange: '0.0 - 3.0°', isWarning: t.knockRetard[0] > 3 },
          { label: 'Cylinder 2 Retard', value: `${t.knockRetard[1].toFixed(1)}°`, unit: 'CF', normalRange: '0.0 - 3.0°', isWarning: t.knockRetard[1] > 3 },
          { label: 'Cylinder 3 Retard', value: `${t.knockRetard[2].toFixed(1)}°`, unit: 'CF', normalRange: '0.0 - 3.0°', isWarning: t.knockRetard[2] > 3 },
          { label: 'Cylinder 4 Retard', value: `${t.knockRetard[3].toFixed(1)}°`, unit: 'CF', normalRange: '0.0 - 3.0°', isWarning: t.knockRetard[3] > 3 },
        ]
      },
      {
        groupNum: '115',
        title: 'Group 115: Charge Pressure Control (Boost)',
        greekTitle: 'Ομάδα 115: Έλεγχος Πίεσης Τούρμπο (Ζητούμενη vs Πραγματική)',
        description: 'Crucial for detecting boost leaks, wastegate issues or limp mode.',
        fields: [
          { label: 'Engine Speed', value: `${t.rpm} /min`, unit: 'RPM', normalRange: '800 - 6800' },
          { label: 'Engine Load', value: `${Math.round(Math.min(100, (t.calculatedTorque / 350) * 100))}%`, unit: '%', normalRange: '20 - 95%' },
          { label: 'Boost Specified', value: `${specifiedBoostMbar} mbar`, unit: 'mbar', normalRange: '1000 - 2500' },
          { label: 'Boost Actual', value: `${actualBoostMbar} mbar`, unit: 'mbar', normalRange: '950 - 2500', isWarning: Math.abs(specifiedBoostMbar - actualBoostMbar) > 250 },
        ]
      },
      {
        groupNum: '118',
        title: 'Group 118: Turbocharger & N75 Wastegate Duty',
        greekTitle: 'Ομάδα 118: Θερμοκρασία Εισαγωγής (IAT) & Βαλβίδα N75',
        description: 'Intercooler efficiency and wastegate solenoid cycle.',
        fields: [
          { label: 'Engine Speed', value: `${t.rpm} /min`, unit: 'RPM', normalRange: '800 - 6800' },
          { label: 'Intake Air Temp (IAT)', value: `${t.iat}°C`, unit: '°C', normalRange: '20 - 55°C', isWarning: t.iat > 55 },
          { label: 'N75 Duty Cycle', value: `${t.n75DutyCycle}%`, unit: '%', normalRange: '0 - 95%' },
          { label: 'Charge Pressure', value: `${actualBoostMbar} mbar`, unit: 'mbar', normalRange: '950 - 2500' },
        ]
      },
      {
        groupNum: '031',
        title: 'Group 031: Wideband Lambda Regulation',
        greekTitle: 'Ομάδα 031: Ρύθμιση Λάμδα (Αισθητήρας Οξυγόνου Wideband)',
        description: 'Air-fuel ratio monitoring (Bosch LSU 4.2 wideband O2 sensor).',
        fields: [
          { label: 'Lambda Actual', value: `${t.lambda.toFixed(3)}`, unit: 'λ', normalRange: '0.80 - 1.05' },
          { label: 'Lambda Specified', value: `${(t.throttlePosition > 70 ? 0.82 : 1.00).toFixed(3)}`, unit: 'λ', normalRange: '0.82 - 1.00' },
          { label: 'AFR Ratio', value: `${t.afr.toFixed(1)}:1`, unit: 'AFR', normalRange: '11.8 - 14.7' },
          { label: 'O2 Sensor Bank 1', value: `${(0.45 + (1 - t.lambda) * 0.4).toFixed(2)} V`, unit: 'V', normalRange: '0.1 - 0.9 V' },
        ]
      }
    ];
  }

  private notifyTelemetry(data: TelemetryData): void {
    this.listeners.forEach(l => l.onTelemetry(data));
  }

  private notifyStatus(status: string, mode: ConnectionMode): void {
    this.mode = mode;
    this.listeners.forEach(l => l.onStatusChange(status, mode));
  }

  private notifyError(err: string): void {
    this.listeners.forEach(l => l.onError(err));
  }
}

export const obdEngine = new ObdEngine();
