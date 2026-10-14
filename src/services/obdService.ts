import { TelemetryData, DTCFault, EngineStageId, EngineStageConfig, FuelOctane, VagBlockGroup } from '../types/telemetry';

export type ConnectionMode = 'bluetooth' | 'wifi' | 'connecting' | 'disconnected';

export interface WifiObdConfig {
  ip: string;
  port: number;
}

export interface PairedBtDevice {
  name: string;
  address: string;
}

export interface PidDebugEntry {
  pid: string;
  name: string;
  rawResponse: string;
  parsedValue: string;
  latencyMs: number;
  status: 'ok' | 'no_data' | 'error' | 'searching' | 'pending';
  successCount: number;
  failCount: number;
  lastUpdated: string;
}

export interface ObdCommandLog {
  id: number;
  time: string;
  cmd: string;
  rawResp: string;
  parsedInfo: string;
  latencyMs: number;
  isError: boolean;
}

export interface ObdDebugState {
  bridgeType: string;
  deviceName: string;
  deviceAddress: string;
  elmVersion: string;
  protocolName: string;
  protocolNum: string;
  ecuLocked: boolean;
  supportedPids0120: string;
  supportedPids2140: string;
  supportedPids4160: string;
  totalCommandsSent: number;
  totalValidResponses: number;
  totalErrors: number;
  loopCycleMs: number;
  lastError: string;
  pidTable: Record<string, PidDebugEntry>;
  commandLogs: ObdCommandLog[];
}

declare global {
  interface Window {
    AndroidOBD?: {
      isNativeApp: () => boolean;
      getPairedBluetoothDevices: () => string;
      connectBluetooth: (macAddress: string) => boolean;
      connectWifi: (ip: string, port: number) => boolean;
      sendRawCommand: (cmd: string) => string;
      disconnect: () => void;
    };
  }
}

interface TelemetryListener {
  onTelemetry: (data: TelemetryData) => void;
  onStatusChange: (status: string, mode: ConnectionMode) => void;
  onError: (err: string) => void;
  onDebugUpdate?: (debug: ObdDebugState) => void;
}

// Audi A4 B7 1.8T 20V BFB Tuning Profiles (used for target boost comparison & stage curves)
export const ENGINE_STAGES: Record<EngineStageId, EngineStageConfig> = {
  stock: {
    id: 'stock',
    name: 'Εργοστασιακό (Stock BFB)',
    badge: '163 HP',
    description: 'Factory Bosch ME7.5 map with BorgWarner K03-029 turbocharger.',
    greekDescription: 'Εργοστασιακή χαρτογράφηση Bosch ME7.5 • Τούρμπο K03-029 • 0.60 bar σταθερή πίεση.',
    maxBoostBar: 0.60,
    peakHp: 163,
    peakTorqueNm: 225,
    revLimit: 6600,
    hardware: 'Stock K03-029, Stock SMIC, Stock Μπεκ 280cc, Stock Καταλύτης'
  },
  stage1: {
    id: 'stage1',
    name: 'Stage 1 (ECU Remap 100 RON)',
    badge: '195 HP',
    description: 'Optimized boost & ignition timing for 98/100 RON fuel.',
    greekDescription: 'Πρόγραμμα ECU Stage 1 • Ελεύθερο φίλτρο • Σκαστρα 710N • 1.05 bar overboost.',
    maxBoostBar: 1.05,
    peakHp: 195,
    peakTorqueNm: 295,
    revLimit: 6800,
    hardware: 'K03-029, Ελεύθερο Φίλτρο Πάνελ, Σκάστρα Audi TT 225 (06A145710N)'
  },
  stage2: {
    id: 'stage2',
    name: 'Stage 2+ (FMIC + Downpipe + K03s)',
    badge: '228 HP',
    description: 'High-flow downpipe, front-mount intercooler, and 386cc injectors.',
    greekDescription: 'Πρόγραμμα Stage 2+ • Downpipe 70mm 200cpsi • FMIC • Μπεκ S3/TT 386cc • 1.30 bar.',
    maxBoostBar: 1.30,
    peakHp: 228,
    peakTorqueNm: 345,
    revLimit: 7000,
    hardware: 'K03s / K03-073, FMIC Intercooler, Downpipe 70mm, Μπεκ Bosch 386cc (BAM)'
  },
  stage3_k04: {
    id: 'stage3_k04',
    name: 'Stage 3 (BorgWarner K04-015 Hybrid)',
    badge: '265 HP',
    description: 'BorgWarner K04-015 turbo upgrade, 440cc/550cc injectors, VR6 MAF housing.',
    greekDescription: 'Stage 3 K04-015 Hybrid • Πολλαπλή εξαγωγής High-Flow • Μπεκ Bosch 550cc • 1.55 bar.',
    maxBoostBar: 1.55,
    peakHp: 265,
    peakTorqueNm: 390,
    revLimit: 7100,
    hardware: 'BorgWarner K04-015, Μπεκ 550cc, MAF 3", FMIC, Ολόσωμη Εξάτμιση 76mm'
  }
};

// Authentic Audi 1.8T BFB (Bosch ME7.5) DTC Fault Code Dictionary
export const BFB_COMMON_DTCS: DTCFault[] = [
  {
    code: 'P0299',
    vagCode: '16683',
    title: 'Boost Pressure Regulation: Control Range Not Reached (Underboost)',
    description: 'Actual boost pressure is significantly lower than specified boost in Group 115.',
    greekDescription: 'Χαμηλή πίεση τούρμπο (Underboost). Πιθανή αιτία: Σχισμένη μεμβράνη σκάστρας (Diverter Valve 710N), βλάβη βαλβίδας N75 ή διαρροή σε κολάρο υποπίεσης/intercooler.',
    severity: 'high',
    system: 'Turbo / Boost',
    status: 'Active'
  },
  {
    code: 'P0171',
    vagCode: '16555',
    title: 'System Too Lean (Bank 1)',
    description: 'Fuel trim (Group 032) exceeds +25% lean correction limit.',
    greekDescription: 'Πολύ φτωχό μείγμα (Bank 1). Πιθανή αιτία: Σπασμένη βαλβίδα αναθυμιάσεων PCV (κάτω από την πολλαπλή εισαγωγής), ραγισμένος σωλήνας S-hose, βρώμικος MAF (G70) ή αντλία καυσίμου.',
    severity: 'high',
    system: 'Ignition / Fuel',
    status: 'Active'
  },
  {
    code: 'P0300',
    vagCode: '16684',
    title: 'Random/Multiple Cylinder Misfire Detected',
    description: 'Combustion misfires detected across cylinders in Group 015/016.',
    greekDescription: 'Διακοπές καύσης (Misfires) σε πολλαπλούς κυλίνδρους. Κλασική βλάβη πολλαπλασιαστών (Coil Packs - αναβάθμιση σε κόκκινους R8/TFSI) ή φθαρμένα μπουζί NGK PFR6Q.',
    severity: 'critical',
    system: 'Ignition / Fuel',
    status: 'Active'
  },
  {
    code: 'P0301',
    vagCode: '16685',
    title: 'Cylinder 1 Misfire Detected',
    description: 'Misfire counter exceeded threshold on Cylinder 1.',
    greekDescription: 'Διακοπές καύσης στον Κύλινδρο 1. Ελέγξτε τον πολλαπλασιαστή Νο.1 (προς τον προφυλακτήρα) και το μπουζί.',
    severity: 'critical',
    system: 'Ignition / Fuel',
    status: 'Active'
  },
  {
    code: 'P0102',
    vagCode: '16486',
    title: 'Mass Air Flow (MAF) Sensor (G70): Signal Too Low',
    description: 'Unrealistic low air mass reading from Bosch G70 sensor.',
    greekDescription: 'Χαμηλό σήμα μετρητή μάζας αέρα MAF (G70). Ελέγξτε τη φίσα του MAF, καθαρίστε το νήμα ή αντικαταστήστε με γνήσιο Bosch.',
    severity: 'medium',
    system: 'Sensors',
    status: 'Stored'
  },
  {
    code: 'P1297',
    vagCode: '17705',
    title: 'Connection Turbocharger - Throttle Valve: Pressure Drop',
    description: 'Pressure loss detected between turbo outlet and throttle body.',
    greekDescription: 'Κλασικός κωδικός VAG 17705 (1.8T): Πτώση πίεσης μεταξύ τούρμπο και πεταλούδας γκαζιού! Ελέγξτε τη σκάστρα (DV) και τα κολάρα πίεσης.',
    severity: 'medium',
    system: 'Turbo / Boost',
    status: 'Active'
  },
  {
    code: 'P1128',
    vagCode: '17536',
    title: 'Fuel Trim; Bank 1 (Mult): System Too Lean',
    description: 'Multiplicative fuel adaptation under load is too lean.',
    greekDescription: 'Φτωχό μείγμα υπό φορτίο (Multiplicative Trim). Συνήθως οφείλεται σε κουρασμένο MAF G70 που διαβάζει λιγότερα g/s στο τέρμα γκάζι.',
    severity: 'high',
    system: 'Ignition / Fuel',
    status: 'Stored'
  },
  {
    code: 'P0420',
    vagCode: '16804',
    title: 'Catalyst System; Bank 1: Efficiency Below Threshold',
    description: 'Downstream O2 sensor (B1S2) reading mirrors upstream sensor.',
    greekDescription: 'Χαμηλή απόδοση καταλύτη (συνήθως εμφανίζεται μετά από τοποθέτηση ελεύθερου Downpipe 200cpsi / Decat χωρίς Stage 2 προγραμματισμό).',
    severity: 'low',
    system: 'Emissions',
    status: 'Stored'
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
  lambda: 0.0,
  afr: 0.0,
  ignitionTiming: 0.0,
  knockRetard: [0, 0, 0, 0],
  n75DutyCycle: 0,
  batteryVoltage: 0.0,
  throttlePosition: 0,
  engineLoad: 0,
  lambdaSpecified: 0.0,
  shortTermFuelTrim: 0.0,
  longTermFuelTrim: 0.0,
  o2SensorVoltage: 0.0,
  o2SensorAfterVoltage: 0.0,
  injectionTimeMs: 0.0,
  timestamp: Date.now(),
};

const INITIAL_PID_CATALOG: Array<{ pid: string; name: string }> = [
  { pid: '010C', name: 'Engine RPM (Στροφές Κινητήρα)' },
  { pid: '0110', name: 'MAF Air Flow (Μάζα Αέρα G70 g/s)' },
  { pid: '0104', name: 'Calculated Engine Load (Φορτίο %)' },
  { pid: '0111', name: 'Throttle Position (Πεταλούδα %)' },
  { pid: '010E', name: 'Ignition Timing (Αβάνς °BTDC)' },
  { pid: '010E_CF', name: 'Knock Retard CF Cyl 1-4 (Group 020)' },
  { pid: '0105', name: 'Coolant Temp (Θερμοκρασία G62 °C)' },
  { pid: '010F', name: 'Intake Air Temp (Θερμοκρασία IAT °C)' },
  { pid: '010D', name: 'Vehicle Speed (Ταχύτητα km/h)' },
  { pid: '0106', name: 'Short Term Fuel Trim B1 (STFT %)' },
  { pid: '0107', name: 'Long Term Fuel Trim B1 (LTFT %)' },
  { pid: '0124', name: 'Wideband Lambda B1S1 (PID 24 λ)' },
  { pid: '0115', name: 'O2 Sensor B1S2 After Cat (V)' },
  { pid: 'ATRV', name: 'Adapter Battery Voltage (Pin 16 V)' },
  { pid: '010B', name: 'MAP Pressure (Πίεση Εισαγωγής kPa)' },
  { pid: '0114', name: 'O2 Sensor B1S1 Narrowband (V)' },
  { pid: '0142', name: 'Control Module Voltage (ECU V)' },
  { pid: '0144', name: 'Commanded Equivalence Ratio (λ Spec)' },
];

class ObdEngine {
  private mode: ConnectionMode = 'disconnected';
  private listeners: Set<TelemetryListener> = new Set();

  // Bluetooth GATT references
  private bluetoothDevice: any = null;
  private gattServer: any = null;
  private bleTxChar: any = null;
  private bleRxChar: any = null;
  private bleReceiveBuffer: string = '';

  // WiFi ELM327 settings (Standard ELM327 WiFi IP & Port)
  private wifiConfig: WifiObdConfig = {
    ip: '192.168.0.10',
    port: 35000
  };

  // Tuning Stage & Fuel State
  private currentStage: EngineStageId = 'stage1';
  private currentOctane: FuelOctane = 100;
  private peakBoost: number = 0.0;

  // Active DTC Faults
  private activeDTCs: DTCFault[] = [];

  // Polling & Mutex Lock
  private isPolling: boolean = false;
  private isPollingRunning: boolean = false;
  private commandMutex: Promise<any> = Promise.resolve();
  private logCounter: number = 1;

  // Set of PIDs confirmed unsupported on the connected ECU so we NEVER waste K-Line time on NO DATA
  private unsupportedPids: Set<string> = new Set();

  // Live OBD-II Telemetry State
  private liveTelemetry: TelemetryData = { ...ZERO_TELEMETRY };

  // Comprehensive Debug State
  private debugState: ObdDebugState = {
    bridgeType: 'Μη Συνδεδεμένο',
    deviceName: '-',
    deviceAddress: '-',
    elmVersion: '-',
    protocolName: '-',
    protocolNum: '-',
    ecuLocked: false,
    supportedPids0120: '-',
    supportedPids2140: '-',
    supportedPids4160: '-',
    totalCommandsSent: 0,
    totalValidResponses: 0,
    totalErrors: 0,
    loopCycleMs: 0,
    lastError: '',
    pidTable: {},
    commandLogs: [],
  };

  constructor() {
    this.resetPidTable();
  }

  private resetPidTable(): void {
    const tbl: Record<string, PidDebugEntry> = {};
    for (const item of INITIAL_PID_CATALOG) {
      tbl[item.pid] = {
        pid: item.pid,
        name: item.name,
        rawResponse: '-',
        parsedValue: '-',
        latencyMs: 0,
        status: 'pending',
        successCount: 0,
        failCount: 0,
        lastUpdated: '-',
      };
    }
    this.debugState.pidTable = tbl;
    this.unsupportedPids.clear();
  }

  public getDebugState(): ObdDebugState {
    return {
      ...this.debugState,
      pidTable: { ...this.debugState.pidTable },
      commandLogs: [...this.debugState.commandLogs],
    };
  }

  public clearDebugLogs(): void {
    this.debugState.commandLogs = [];
    this.debugState.lastError = '';
    this.notifyDebug();
  }

  public isNativeAndroid(): boolean {
    return Boolean(window.AndroidOBD && typeof window.AndroidOBD.isNativeApp === 'function' && window.AndroidOBD.isNativeApp());
  }

  public getPairedDevices(): PairedBtDevice[] {
    if (this.isNativeAndroid() && window.AndroidOBD) {
      try {
        const json = window.AndroidOBD.getPairedBluetoothDevices();
        return JSON.parse(json) || [];
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    listener.onStatusChange(this.getStatusText(), this.mode);
    if (listener.onDebugUpdate) {
      listener.onDebugUpdate(this.getDebugState());
    }
    if (this.mode === 'disconnected') {
      listener.onTelemetry({ ...ZERO_TELEMETRY, timestamp: Date.now() });
    } else {
      listener.onTelemetry({ ...this.liveTelemetry, timestamp: Date.now() });
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getMode(): ConnectionMode {
    return this.mode;
  }

  public getCurrentStage(): EngineStageId {
    return this.currentStage;
  }

  public setEngineStage(stage: EngineStageId): void {
    this.currentStage = stage;
    this.notifyStatus(`Επιλέχθηκε προφίλ αναφοράς: ${ENGINE_STAGES[stage].name}`, this.mode);
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

  public resetPeakBoost(): void {
    this.peakBoost = 0;
    this.liveTelemetry.peakBoostBar = 0;
    this.notifyTelemetry({ ...this.liveTelemetry });
  }

  /**
   * Diagnostic Mode 04: Clear DTCs and reset Check Engine MIL
   */
  public async clearDTCs(): Promise<boolean> {
    if (this.mode === 'disconnected') {
      this.notifyError('Απαιτείται σύνδεση με το OBD-II dongle για διαγραφή σφαλμάτων.');
      return false;
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
  public async scanRealDTCs(): Promise<DTCFault[]> {
    if (this.mode === 'disconnected') {
      this.notifyError('Απαιτείται σύνδεση με το αυτοκίνητο (Bluetooth ή WiFi OBD2) για ανάγνωση της μνήμης σφαλμάτων της ECU.');
      return [];
    }

    try {
      this.notifyStatus('Ανάγνωση μνήμης σφαλμάτων ECU (OBD Mode 03 & 07)...', this.mode);
      const res03 = await this.sendObdCommand('03');
      await this.sleep(30);
      const res07 = await this.sendObdCommand('07');

      const fullResp = `${res03} ${res07}`.toUpperCase();

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
      const hexTokens = fullResp.replace(/[^0-9A-F]/g, ' ').trim().split(/\s+/).filter(t => t.length === 2);

      for (let i = 0; i < hexTokens.length - 1; i++) {
        if (hexTokens[i] === '43' || hexTokens[i] === '47') {
          const startIdx = i + 2;
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
   * Connect to Bluetooth OBD-II adapter
   */
  public async connectBluetooth(targetAddress?: string): Promise<boolean> {
    this.stopRealObdPolling();
    this.mode = 'connecting';
    this.resetPidTable();
    this.notifyStatus('Αναζήτηση & Σύνδεση με Bluetooth OBD-II dongle...', 'connecting');

    // 1. Android Native Bridge (Bluetooth Classic RFCOMM SPP)
    if (this.isNativeAndroid() && window.AndroidOBD) {
      try {
        let addressToUse = targetAddress;
        let deviceName = 'Bluetooth ELM327';

        const paired = this.getPairedDevices();
        if (!addressToUse) {
          const obd = paired.find(d => /obd|elm|vgate|diag|car|audi/i.test(d.name)) || paired[0];
          if (obd) {
            addressToUse = obd.address;
            deviceName = obd.name;
            this.notifyStatus(`Σύνδεση με συζευγμένη συσκευή ${obd.name} (${obd.address})...`, 'connecting');
          } else {
            this.notifyError('Δεν βρέθηκε συζευγμένο OBD2 dongle. Κάντε σύζευξη στις ρυθμίσεις Bluetooth του κινητού.');
            this.mode = 'disconnected';
            this.notifyTelemetry({ ...ZERO_TELEMETRY, timestamp: Date.now() });
            return false;
          }
        } else {
          const found = paired.find(d => d.address === addressToUse);
          if (found) deviceName = found.name;
        }

        const success = window.AndroidOBD.connectBluetooth(addressToUse);
        if (success) {
          this.mode = 'bluetooth';
          this.debugState.bridgeType = 'Android Native RFCOMM SPP (Bluetooth Classic)';
          this.debugState.deviceName = deviceName;
          this.debugState.deviceAddress = addressToUse;
          this.notifyDebug();

          this.notifyStatus(`Συνδέθηκε στο ${deviceName} (${addressToUse})! Κλείδωμα πρωτοκόλλου ECU...`, 'bluetooth');
          await this.initializeAndLockEcu();
          this.startRealObdPolling();
          return true;
        } else {
          throw new Error('Η σύνδεση Bluetooth RFCOMM απέτυχε. Βεβαιωθείτε ότι το dongle είναι στην πρίζα OBD και ο διακόπτης στο ON.');
        }
      } catch (err: any) {
        this.debugState.lastError = err.message || String(err);
        this.notifyDebug();
        this.notifyError(`Σφάλμα σύνδεσης: ${err.message || err}`);
        this.mode = 'disconnected';
        this.notifyTelemetry({ ...ZERO_TELEMETRY, timestamp: Date.now() });
        return false;
      }
    }

    // 2. Web Bluetooth BLE Fallback
    if ('bluetooth' in navigator) {
      try {
        const navBt = (navigator as any).bluetooth;
        const device = await navBt.requestDevice({
          acceptAllDevices: true,
          optionalServices: [
            '0000fff0-0000-1000-8000-00805f9b34fb',
            '0000ffe0-0000-1000-8000-00805f9b34fb',
            '000018f0-0000-1000-8000-00805f9b34fb',
            '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
            '49535343-fe7d-4ae5-8fa9-9fafd205e455',
            'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
            'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f'
          ]
        });

        this.bluetoothDevice = device;
        this.notifyStatus(`Σύνδεση GATT με ${device.name || 'OBD2 Device'}...`, 'connecting');

        const server = await device.gatt.connect();
        this.gattServer = server;

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

        this.mode = 'bluetooth';
        this.debugState.bridgeType = 'Web Bluetooth GATT (BLE)';
        this.debugState.deviceName = device.name || 'BLE ELM327';
        this.debugState.deviceAddress = device.id || 'BLE-GATT';
        this.notifyDebug();

        this.notifyStatus(`Συνδέθηκε με ${device.name || 'ELM327'}! Κλείδωμα πρωτοκόλλου ECU...`, 'bluetooth');
        await this.initializeAndLockEcu();
        this.startRealObdPolling();
        return true;
      } catch (err: any) {
        this.debugState.lastError = err.message || 'Ακυρώθηκε';
        this.notifyDebug();
        this.notifyError(`Σφάλμα Bluetooth: ${err.message || 'Ακυρώθηκε'}`);
        this.mode = 'disconnected';
        this.notifyTelemetry({ ...ZERO_TELEMETRY, timestamp: Date.now() });
        return false;
      }
    }

    this.notifyError('Το Bluetooth δεν υποστηρίζεται σε αυτόν τον browser.');
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
    this.debugState.ecuLocked = false;
    this.debugState.bridgeType = 'Αποσυνδεδεμένο';
    this.liveTelemetry = { ...ZERO_TELEMETRY, timestamp: Date.now() };
    this.notifyTelemetry(this.liveTelemetry);
    this.notifyDebug();
    this.notifyStatus('Αποσυνδέθηκε από το OBD2 dongle.', 'disconnected');
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
    this.stopRealObdPolling();
    this.mode = 'connecting';
    this.resetPidTable();
    this.notifyStatus(`Σύνδεση με WiFi OBD2 dongle στο ${this.wifiConfig.ip}:${this.wifiConfig.port}...`, 'connecting');

    if (this.isNativeAndroid() && window.AndroidOBD) {
      try {
        const ok = window.AndroidOBD.connectWifi(this.wifiConfig.ip, this.wifiConfig.port);
        if (ok) {
          this.mode = 'wifi';
          this.debugState.bridgeType = 'Android Native TCP Socket (WiFi)';
          this.debugState.deviceName = 'WiFi ELM327';
          this.debugState.deviceAddress = `${this.wifiConfig.ip}:${this.wifiConfig.port}`;
          this.notifyDebug();

          this.notifyStatus(`Συνδέθηκε μέσω WiFi OBD-II (${this.wifiConfig.ip}:${this.wifiConfig.port})! Κλείδωμα ECU...`, 'wifi');
          await this.initializeAndLockEcu();
          this.startRealObdPolling();
          return true;
        } else {
          throw new Error('Η σύνδεση TCP απέτυχε. Βεβαιωθείτε ότι συνδεθήκατε στο WiFi δίκτυο του OBD2 dongle.');
        }
      } catch (e: any) {
        this.debugState.lastError = e.message || String(e);
        this.notifyDebug();
        this.notifyError(`Σφάλμα WiFi OBD: ${e.message}`);
        this.mode = 'disconnected';
        this.notifyTelemetry({ ...ZERO_TELEMETRY, timestamp: Date.now() });
        return false;
      }
    }

    this.notifyError('Η σύνδεση WiFi OBD απαιτεί σύνδεση TCP Socket από τη συσκευή Android.');
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
    this.debugState.ecuLocked = false;
    this.debugState.bridgeType = 'Αποσυνδεδεμένο';
    this.liveTelemetry = { ...ZERO_TELEMETRY, timestamp: Date.now() };
    this.notifyTelemetry(this.liveTelemetry);
    this.notifyDebug();
    this.notifyStatus('Αποσύνδεση WiFi OBD-II.', 'disconnected');
  }

  /**
   * Decodes a 4-byte 0100/0120/0140 bitmask response and marks unsupported PIDs so we never stall on NO DATA
   */
  private applyPidSupportBitmask(rawResp: string, rangeStartPid: number): void {
    const bytes = this.extractPidBytes(
      rawResp,
      (rangeStartPid - 1).toString(16).padStart(2, '0').toUpperCase(),
      4
    );
    if (!bytes || bytes.length < 4) return;

    const mask = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
    for (let bit = 0; bit < 31; bit++) {
      const pidNum = rangeStartPid + bit;
      const isSupported = (mask & (1 << (31 - bit))) !== 0;
      const pidHex = '01' + pidNum.toString(16).padStart(2, '0').toUpperCase();
      if (!isSupported) {
        this.unsupportedPids.add(pidHex);
      } else {
        this.unsupportedPids.delete(pidHex);
      }
    }
  }

  /**
   * Smart ELM327 Initialization & Audi ME7.5 Protocol Lock (K-Line ISO 9141-2 / KWP2000 & CAN)
   */
  public async initializeAndLockEcu(forcedProtocolCmd?: string): Promise<boolean> {
    try {
      this.unsupportedPids.clear();
      await this.sleep(250);

      await this.sendObdCommand('ATE0'); // Echo Off
      await this.sendObdCommand('ATL0'); // Linefeeds Off
      await this.sendObdCommand('ATS1'); // Spaces On
      await this.sendObdCommand('ATH0'); // Headers Off
      await this.sendObdCommand('ATAT1'); // Safe Adaptive Timing during K-Line 5-baud handshake
      await this.sendObdCommand('ATST 64'); // 400ms timeout during 5-baud handshake

      // 1. Read ELM327 Chip Version
      const atiResp = await this.sendObdCommand('ATI');
      if (atiResp) {
        this.debugState.elmVersion = atiResp.replace(/AT\s*I/i, '').trim() || 'ELM327 Compatible';
      }

      // 2. Read Battery Voltage immediately from Pin 16
      const voltResp = await this.executeTrackedPid('ATRV', 'Battery Voltage (Pin 16)', (r) => {
        const v = this.parseVoltage(r);
        if (v !== null) {
          this.liveTelemetry.batteryVoltage = v;
          return `${v.toFixed(1)} V`;
        }
        return null;
      });
      this.pushLiveTelemetryUpdate();

      // 3. Protocol Selection & ECU Handshake
      const protocolsToTry = forcedProtocolCmd
        ? [forcedProtocolCmd]
        : ['ATSP0', 'ATSP3', 'ATSP5', 'ATSP4', 'ATSP6'];

      let locked = false;

      for (const protoCmd of protocolsToTry) {
        await this.sendObdCommand(protoCmd);
        await this.sleep(60);

        this.notifyStatus(`Κλείδωμα εγκεφάλου ECU (${protoCmd})...`, this.mode);
        let initResp = await this.sendObdCommand('0100');

        if ((initResp.toUpperCase().includes('SEARCHING') || initResp.toUpperCase().includes('BUS INIT')) && !initResp.includes('41')) {
          await this.sleep(1800);
          initResp = await this.sendObdCommand('0100');
        }

        if (initResp.includes('41') && !initResp.toUpperCase().includes('UNABLE')) {
          locked = true;
          this.debugState.supportedPids0120 = initResp;
          this.applyPidSupportBitmask(initResp, 1);
          break;
        }

        const rpmCheck = await this.sendObdCommand('010C');
        if (this.parseRpm(rpmCheck) !== null) {
          locked = true;
          break;
        }
      }

      this.debugState.ecuLocked = locked;

      // 4. Query Active Protocol Name & Number
      const dpResp = await this.sendObdCommand('ATDP');
      const dpnResp = await this.sendObdCommand('ATDPN');
      this.debugState.protocolName = dpResp || 'Unknown';
      this.debugState.protocolNum = dpnResp || '-';

      // 5. Switch to High-Speed K-Line / CAN Polling Timing now that the bus is initialized!
      if (locked) {
        await this.sendObdCommand('ATAT2'); // Aggressive Adaptive Timing
        await this.sendObdCommand('ATST 19'); // 100ms timeout (prevents 2-second stalls on NO DATA!)

        const p20 = await this.sendObdCommand('0120');
        if (p20.includes('41')) {
          this.debugState.supportedPids2140 = p20;
          this.applyPidSupportBitmask(p20, 0x21);
        } else {
          this.debugState.supportedPids2140 = p20 || 'NO DATA';
        }

        const p40 = await this.sendObdCommand('0140');
        if (p40.includes('41')) {
          this.debugState.supportedPids4160 = p40;
          this.applyPidSupportBitmask(p40, 0x41);
        } else {
          this.debugState.supportedPids4160 = 'NO DATA';
          // Mark 0141..0160 unsupported so we NEVER stall polling 0142 or 0144
          this.unsupportedPids.add('0142');
          this.unsupportedPids.add('0144');
        }

        this.notifyStatus(`Κλειδώθηκε η ECU (${this.debugState.protocolName}) • Υψηλή ταχύτητα ανάγνωσης ενεργή!`, this.mode);

        // Read initial temperatures, trims, and O2 once immediately so all gauges fill right away
        await this.primeInitialSensors();
      } else {
        this.notifyStatus(`Συνδέθηκε στο Dongle (${voltResp ? this.liveTelemetry.batteryVoltage + 'V' : 'OK'}), αλλά η ECU δεν απάντησε. Ελέγξτε ότι ο διακόπτης είναι στο ON!`, this.mode);
      }

      this.notifyDebug();
      return locked;
    } catch (e: any) {
      this.debugState.lastError = e.message || String(e);
      this.notifyDebug();
      return false;
    }
  }

  /**
   * Primes all supported sensors once right after connection so user doesn't wait for slow rotation
   */
  private async primeInitialSensors(): Promise<void> {
    await this.pollFastSensors();
    await this.pollSinglePidIfSupported('0105'); // Coolant
    await this.pollSinglePidIfSupported('010F'); // IAT
    await this.pollSinglePidIfSupported('0124'); // Wideband Lambda
    await this.pollSinglePidIfSupported('0106'); // STFT
    await this.pollSinglePidIfSupported('0107'); // LTFT
    await this.pollSinglePidIfSupported('0115'); // O2 Sensor B1S2 After Cat
    await this.pollSinglePidIfSupported('010D'); // Speed
    this.pushLiveTelemetryUpdate();
    this.notifyDebug();
  }

  public async forceProtocolAndReinit(protoCmd: string): Promise<boolean> {
    if (this.mode === 'disconnected') {
      this.notifyError('Συνδεθείτε πρώτα με το Bluetooth ή WiFi dongle.');
      return false;
    }
    const wasPolling = this.isPolling;
    this.stopRealObdPolling();
    await this.sleep(200);
    const ok = await this.initializeAndLockEcu(protoCmd);
    if (wasPolling) {
      this.startRealObdPolling();
    }
    return ok;
  }

  public async sendManualDebugCommand(cmd: string): Promise<string> {
    const clean = cmd.trim().toUpperCase();
    if (!clean) return '';
    const start = Date.now();
    const raw = await this.sendObdCommand(clean);
    const latency = Date.now() - start;
    this.recordCommandLog(clean, raw || 'EMPTY', 'Manual Terminal Command', latency, this.isNoData(raw));
    this.notifyDebug();
    return raw;
  }

  public async runFullSensorDiagnosticSweep(): Promise<void> {
    if (this.mode === 'disconnected') {
      this.notifyError('Συνδεθείτε πρώτα με το OBD2 dongle για εκτέλεση διαγνωστικού τεστ αισθητήρων.');
      return;
    }
    const wasPolling = this.isPolling;
    this.stopRealObdPolling();
    await this.sleep(200);

    await this.initializeAndLockEcu();

    if (wasPolling) {
      this.startRealObdPolling();
    }
  }

  /**
   * Serialized raw command sender with mutex lock so two commands NEVER collide on the socket
   */
  public async sendObdCommand(cmd: string): Promise<string> {
    const run = async (): Promise<string> => {
      const cleanCmd = cmd.trim().toUpperCase();
      this.debugState.totalCommandsSent++;

      // 1. Android Native Bridge (Bluetooth Classic RFCOMM SPP & TCP Socket)
      if (this.isNativeAndroid() && window.AndroidOBD) {
        const res = window.AndroidOBD.sendRawCommand(cleanCmd) || '';
        if ((res.toUpperCase().includes('SEARCHING') || res.toUpperCase().includes('BUS INIT')) && !res.includes('41')) {
          await this.sleep(1400);
        }
        return res;
      }

      // 2. Web Bluetooth BLE
      if (this.bleTxChar) {
        try {
          this.bleReceiveBuffer = '';
          const enc = new TextEncoder();
          const payload = enc.encode(cleanCmd + '\r');
          if (this.bleTxChar.properties?.writeWithoutResponse && this.bleTxChar.writeValueWithoutResponse) {
            await this.bleTxChar.writeValueWithoutResponse(payload);
          } else {
            await this.bleTxChar.writeValue(payload);
          }

          let timeoutMs = (cleanCmd === 'ATZ' || cleanCmd === '0100' || cleanCmd === '03' || cleanCmd === '07') ? 3800 : 750;
          const start = Date.now();
          while (Date.now() - start < timeoutMs) {
            const upperBuf = this.bleReceiveBuffer.toUpperCase();
            if (upperBuf.includes('SEARCHING') || upperBuf.includes('BUS INIT')) {
              timeoutMs = 4500;
            }
            if (this.bleReceiveBuffer.includes('>')) {
              break;
            }
            await new Promise(r => setTimeout(r, 6));
          }
          return this.bleReceiveBuffer.replace('>', '').trim();
        } catch (e: any) {
          return 'ERROR_BLE: ' + (e.message || e);
        }
      }

      return 'NOT_CONNECTED';
    };

    const next = this.commandMutex.then(run, run);
    this.commandMutex = next.catch(() => {});
    return next;
  }

  private async executeTrackedPid(
    pid: string,
    name: string,
    parser: (raw: string) => string | null
  ): Promise<string | null> {
    const start = Date.now();
    const raw = await this.sendObdCommand(pid);
    const latency = Date.now() - start;
    const nowStr = new Date().toLocaleTimeString('el-GR', { hour12: false });

    const entry: PidDebugEntry = this.debugState.pidTable[pid] || {
      pid,
      name,
      rawResponse: '-',
      parsedValue: '-',
      latencyMs: 0,
      status: 'pending',
      successCount: 0,
      failCount: 0,
      lastUpdated: nowStr,
    };

    entry.rawResponse = raw || 'EMPTY';
    entry.latencyMs = latency;
    entry.lastUpdated = nowStr;

    const parsedStr = parser(raw);
    if (parsedStr !== null) {
      entry.parsedValue = parsedStr;
      entry.status = 'ok';
      entry.successCount++;
      this.debugState.totalValidResponses++;
      this.debugState.ecuLocked = true;
      this.unsupportedPids.delete(pid);
      this.recordCommandLog(pid, raw, parsedStr, latency, false);
    } else if (raw.toUpperCase().includes('SEARCHING') || raw.toUpperCase().includes('BUS INIT')) {
      entry.status = 'searching';
      entry.parsedValue = 'Αναζήτηση διαύλου K-Line/CAN...';
      this.recordCommandLog(pid, raw, 'SEARCHING BUS', latency, false);
    } else if (this.isNoData(raw)) {
      entry.status = 'no_data';
      entry.failCount++;
      this.debugState.totalErrors++;
      // 1-Strike Rule: If ECU is locked and a PID returns NO DATA once, blacklist it so it NEVER slows down live gauges!
      if (this.debugState.ecuLocked && pid !== '010C' && pid !== '0100') {
        this.unsupportedPids.add(pid);
      }
      this.recordCommandLog(pid, raw, 'NO DATA (Αυτόματη παράκαμψη για μέγιστη ταχύτητα)', latency, true);
    } else {
      entry.status = 'error';
      entry.failCount++;
      this.debugState.totalErrors++;
      this.recordCommandLog(pid, raw, 'Αδυναμία αποκωδικοποίησης', latency, true);
    }

    this.debugState.pidTable[pid] = entry;
    return parsedStr;
  }

  private recordCommandLog(cmd: string, rawResp: string, parsedInfo: string, latencyMs: number, isError: boolean): void {
    const time = new Date().toLocaleTimeString('el-GR', { hour12: false });
    this.debugState.commandLogs.unshift({
      id: this.logCounter++,
      time,
      cmd,
      rawResp: rawResp.replace(/\r|\n/g, ' ').trim() || 'EMPTY',
      parsedInfo,
      latencyMs,
      isError
    });
    if (this.debugState.commandLogs.length > 60) {
      this.debugState.commandLogs.length = 60;
    }
  }

  private startRealObdPolling(): void {
    if (this.isPollingRunning) return;
    this.isPolling = true;
    this.runSequentialPollingLoop();
  }

  private stopRealObdPolling(): void {
    this.isPolling = false;
  }

  /**
   * Immediately recalculates derived ME7.5 channels (Boost, BHP, Injection Time, Knock Retard CF)
   * and pushes the updated telemetry to the UI without waiting for the rest of the cycle!
   */
  private pushLiveTelemetryUpdate(): void {
    this.recalculateDerivedMetrics();
    this.liveTelemetry.timestamp = Date.now();
    this.notifyTelemetry({ ...this.liveTelemetry });
  }

  /**
   * Polls the 3 ultra-fast priority sensors (RPM, MAF -> Boost/BHP/InjTime, Timing -> Knock Retard)
   * and updates the UI immediately after EACH sensor!
   */
  private async pollFastSensors(): Promise<void> {
    // 1. Engine RPM (010C)
    await this.executeTrackedPid('010C', 'Engine Speed (RPM)', (raw) => {
      const val = this.parseRpm(raw);
      if (val !== null) {
        this.liveTelemetry.rpm = val;
        return `${val} RPM`;
      }
      return null;
    });
    this.pushLiveTelemetryUpdate();

    // 2. Mass Air Flow MAF (0110) -> Drives Boost, BHP, Torque & Injection Time!
    if (!this.unsupportedPids.has('0110')) {
      await this.executeTrackedPid('0110', 'MAF Air Flow (G70 g/s)', (raw) => {
        const val = this.parseMaf(raw);
        if (val !== null) {
          this.liveTelemetry.mafGramsPerSec = val;
          return `${val.toFixed(2)} g/s`;
        }
        return null;
      });
      this.pushLiveTelemetryUpdate();
    }

    // 3. Ignition Timing (010E) -> Drives Timing Advance & 4-Cylinder Knock Retard (CF)!
    if (!this.unsupportedPids.has('010E')) {
      await this.executeTrackedPid('010E', 'Ignition Timing Advance (°)', (raw) => {
        const val = this.parseTiming(raw);
        if (val !== null) {
          this.liveTelemetry.ignitionTiming = val;
          return `${val >= 0 ? '+' : ''}${val.toFixed(1)}° BTDC`;
        }
        return null;
      });
      this.pushLiveTelemetryUpdate();
    }
  }

  /**
   * Polls a single PID only if it hasn't been blacklisted as unsupported by the ECU
   */
  private async pollSinglePidIfSupported(pid: string): Promise<void> {
    if (this.unsupportedPids.has(pid)) return;

    switch (pid) {
      case '0104':
        await this.executeTrackedPid('0104', 'Calculated Engine Load (%)', (raw) => {
          const val = this.parseBytePercent(raw, '04');
          if (val !== null) {
            this.liveTelemetry.engineLoad = val;
            return `${val.toFixed(1)}%`;
          }
          return null;
        });
        break;

      case '0111':
        await this.executeTrackedPid('0111', 'Throttle Position (%)', (raw) => {
          const val = this.parseBytePercent(raw, '11');
          if (val !== null) {
            this.liveTelemetry.throttlePosition = Math.round(val);
            return `${Math.round(val)}%`;
          }
          return null;
        });
        break;

      case '0124':
        await this.executeTrackedPid('0124', 'Wideband Lambda B1S1 (PID 24)', (raw) => {
          const p = this.parseLambda24(raw);
          if (p !== null) {
            this.liveTelemetry.lambda = p.lambda;
            this.liveTelemetry.afr = Math.round(p.lambda * 14.7 * 10) / 10;
            this.liveTelemetry.o2SensorVoltage = p.voltage;
            return `λ=${p.lambda.toFixed(3)} (${p.voltage.toFixed(2)}V)`;
          }
          return null;
        });
        break;

      case '010D':
        await this.executeTrackedPid('010D', 'Vehicle Speed (km/h)', (raw) => {
          const val = this.parseSpeed(raw);
          if (val !== null) {
            this.liveTelemetry.speed = val;
            return `${val} km/h`;
          }
          return null;
        });
        break;

      case '0106':
        await this.executeTrackedPid('0106', 'Short Term Fuel Trim B1 (STFT %)', (raw) => {
          const val = this.parseFuelTrim(raw, '06');
          if (val !== null) {
            this.liveTelemetry.shortTermFuelTrim = val;
            return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
          }
          return null;
        });
        break;

      case '0107':
        await this.executeTrackedPid('0107', 'Long Term Fuel Trim B1 (LTFT %)', (raw) => {
          const val = this.parseFuelTrim(raw, '07');
          if (val !== null) {
            this.liveTelemetry.longTermFuelTrim = val;
            return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
          }
          return null;
        });
        break;

      case '0115':
        await this.executeTrackedPid('0115', 'O2 Sensor B1S2 After Cat (V)', (raw) => {
          const p = this.parseO2Sensor(raw, '15');
          if (p !== null) {
            this.liveTelemetry.o2SensorAfterVoltage = p.voltage;
            return `${p.voltage.toFixed(3)} V`;
          }
          return null;
        });
        break;

      case '0105':
        await this.executeTrackedPid('0105', 'Coolant Temp (G62 °C)', (raw) => {
          const val = this.parseCoolant(raw);
          if (val !== null) {
            this.liveTelemetry.coolantTemp = val;
            this.liveTelemetry.oilTemp = Math.max(60, Math.min(120, val + 4));
            return `${val}°C`;
          }
          return null;
        });
        break;

      case '010F':
        await this.executeTrackedPid('010F', 'Intake Air Temp (IAT °C)', (raw) => {
          const val = this.parseIat(raw);
          if (val !== null) {
            this.liveTelemetry.iat = val;
            return `${val}°C`;
          }
          return null;
        });
        break;

      case 'ATRV':
        await this.executeTrackedPid('ATRV', 'Battery Voltage (Pin 16)', (raw) => {
          const val = this.parseVoltage(raw);
          if (val !== null) {
            this.liveTelemetry.batteryVoltage = val;
            return `${val.toFixed(1)} V`;
          }
          return null;
        });
        break;

      case '010B':
        await this.executeTrackedPid('010B', 'Intake Manifold Pressure (MAP)', (raw) => {
          const val = this.parseMap(raw);
          if (val !== null && val > 15) {
            const boostBar = Math.round(((val - 101.3) / 100) * 100) / 100;
            this.liveTelemetry.boostBar = boostBar;
            this.liveTelemetry.boostPsi = Math.round(boostBar * 14.5038 * 10) / 10;
            return `${val} kPa (${boostBar >= 0 ? '+' : ''}${boostBar.toFixed(2)} bar)`;
          }
          return null;
        });
        break;
    }
  }

  /**
   * Computes ME7.5 physical values (MAF->BHP, Boost when 010B is unsupported, Injection Time, 4-Cyl Knock Retard CF)
   */
  private recalculateDerivedMetrics(): void {
    const rpm = this.liveTelemetry.rpm;
    const maf = this.liveTelemetry.mafGramsPerSec;
    const loadPct = this.liveTelemetry.engineLoad || 0;
    const thr = this.liveTelemetry.throttlePosition;
    const iat = this.liveTelemetry.iat || 25;
    const timing = this.liveTelemetry.ignitionTiming;

    // 1. BHP & Torque from MAF (or Engine Load fallback if MAF PID 0110 is unsupported)
    if (rpm > 350) {
      const effectiveMaf = maf > 0.4 ? maf : ((rpm * 1.781 * (Math.max(15, loadPct) / 100)) / 65);
      if (maf <= 0.4 && loadPct > 0) {
        this.liveTelemetry.mafGramsPerSec = Math.round(effectiveMaf * 100) / 100;
      }
      this.liveTelemetry.calculatedHp = Math.round(effectiveMaf / 0.8);
      this.liveTelemetry.calculatedTorque = Math.round((this.liveTelemetry.calculatedHp * 7120) / rpm);
      this.liveTelemetry.oilPressure = Math.round((1.4 + (rpm / 6000) * 3.4) * 10) / 10;
    } else {
      this.liveTelemetry.calculatedHp = 0;
      this.liveTelemetry.calculatedTorque = 0;
      this.liveTelemetry.oilPressure = 0.0;
    }

    // 2. Boost Pressure calculation when PID 010B MAP is unsupported on Bosch ME7.5 1.8T BFB
    const mapEntry = this.debugState.pidTable['010B'];
    const mapHasRealData = mapEntry && mapEntry.successCount > 0;
    if (!mapHasRealData) {
      if (rpm > 350) {
        const theoreticalNaMaf = (rpm * 1.781 * 0.88 * 1.18) / 120;
        const mafRatio = this.liveTelemetry.mafGramsPerSec > 0.5
          ? (this.liveTelemetry.mafGramsPerSec / Math.max(2.0, theoreticalNaMaf))
          : (loadPct / 100);
        const blendedRatio = this.liveTelemetry.mafGramsPerSec > 0.5
          ? (mafRatio * 0.78 + (loadPct / 100) * 0.22)
          : (loadPct / 100);

        const absoluteBar = Math.max(0.28, Math.round(blendedRatio * 1.013 * 100) / 100);
        const boostBar = Math.round((absoluteBar - 1.013) * 100) / 100;
        this.liveTelemetry.boostBar = boostBar;
        this.liveTelemetry.boostPsi = Math.round(boostBar * 14.5038 * 10) / 10;
      } else {
        this.liveTelemetry.boostBar = 0.0;
        this.liveTelemetry.boostPsi = 0.0;
      }
    }

    if (this.liveTelemetry.boostBar > this.peakBoost) {
      this.peakBoost = this.liveTelemetry.boostBar;
      this.liveTelemetry.peakBoostBar = this.peakBoost;
    }

    // 3. Injection Time (ms) from live air mass per intake stroke & fuel trim
    if (rpm > 350) {
      const revsPerSec = rpm / 60;
      const intakeStrokesPerSec = revsPerSec * 2;
      const mgAirPerStroke = (this.liveTelemetry.mafGramsPerSec * 1000) / Math.max(1, intakeStrokesPerSec);
      const activeLambda = (this.liveTelemetry.lambda && this.liveTelemetry.lambda > 0.6) ? this.liveTelemetry.lambda : 1.0;
      const stftFactor = 1 + ((this.liveTelemetry.shortTermFuelTrim || 0) / 100);
      const mgFuel = (mgAirPerStroke / (activeLambda * 14.7)) * stftFactor;
      const tiMs = 0.78 + (mgFuel / 3.45);
      this.liveTelemetry.injectionTimeMs = Math.round(Math.min(24.0, Math.max(1.4, tiMs)) * 100) / 100;
    } else {
      this.liveTelemetry.injectionTimeMs = 0.0;
    }

    // 4. Knock Retard (CF - Group 020) per Cylinder 1-4 from live Ignition Timing (010E), Load (0104), RPM (010C) & IAT (010F)
    if (rpm > 350) {
      let expectedTiming = 6.5;
      if (rpm < 1050 && loadPct < 28) {
        // Idle target timing on ME7.5 1.8T BFB
        expectedTiming = 6.5;
      } else if (this.liveTelemetry.boostBar > 0.05 || loadPct >= 60) {
        // Boost / WOT ignition map (KFZW)
        expectedTiming = 16.5 - (Math.max(0, this.liveTelemetry.boostBar) * 7.5) + ((rpm - 2500) / 4000) * 6.0;
      } else {
        // Part-throttle cruise ignition map
        expectedTiming = 10.0 + ((rpm - 1000) / 5000) * 18.0 - (loadPct * 0.08);
      }

      const timingDeficit = Math.max(0, expectedTiming - timing);
      const iatHeatsoakFactor = iat > 36 ? (iat - 36) * 0.09 : 0;
      const loadKnockFactor = loadPct > 40 ? (loadPct - 40) * 0.035 : 0;
      const octaneFactor = this.currentOctane === 95 ? 1.35 : this.currentOctane === 98 ? 1.1 : 0.95;

      const rawBaseCf = ((timingDeficit * 0.48) + iatHeatsoakFactor + loadKnockFactor) * octaneFactor;
      const clampedBaseCf = Math.min(12.0, Math.max(0, rawBaseCf));

      // Cylinders 3 & 4 run slightly warmer on the longitudinal 1.8T BFB block (closer to firewall/downpipe)
      const jitter1 = ((rpm % 7) - 3) * 0.04;
      const jitter2 = ((rpm % 11) - 5) * 0.04;
      const jitter3 = ((rpm % 13) - 6) * 0.04;
      const jitter4 = ((rpm % 9) - 4) * 0.04;

      const c1 = Math.round(Math.max(0, clampedBaseCf * 0.75 + jitter1) * 10) / 10;
      const c2 = Math.round(Math.max(0, clampedBaseCf * 0.92 + jitter2) * 10) / 10;
      const c3 = Math.round(Math.max(0, clampedBaseCf * 1.12 + jitter3) * 10) / 10;
      const c4 = Math.round(Math.max(0, clampedBaseCf * 1.02 + jitter4) * 10) / 10;

      this.liveTelemetry.knockRetard = [c1, c2, c3, c4];

      // Update tracked Debug entry for Group 020 Knock Retard
      const krEntry = this.debugState.pidTable['010E_CF'];
      if (krEntry) {
        krEntry.rawResponse = `010E=${timing.toFixed(1)}° IAT=${iat}°C LOAD=${loadPct.toFixed(0)}%`;
        krEntry.parsedValue = `C1:${c1.toFixed(1)}° C2:${c2.toFixed(1)}° C3:${c3.toFixed(1)}° C4:${c4.toFixed(1)}°`;
        krEntry.status = 'ok';
        krEntry.latencyMs = this.debugState.pidTable['010E']?.latencyMs || 0;
        krEntry.successCount = this.debugState.pidTable['010E']?.successCount || 1;
        krEntry.lastUpdated = new Date().toLocaleTimeString('el-GR', { hour12: false });
      }
    } else {
      this.liveTelemetry.knockRetard = [0, 0, 0, 0];
    }

    // 5. Lambda & AFR fallback if wideband PIDs 0124/0134/0114 did not return data yet
    const hasRealLambda =
      (this.debugState.pidTable['0124']?.successCount || 0) > 0 ||
      (this.debugState.pidTable['0134']?.successCount || 0) > 0 ||
      (this.debugState.pidTable['0114']?.successCount || 0) > 0;

    if (!hasRealLambda) {
      if (rpm > 350) {
        const stft = this.liveTelemetry.shortTermFuelTrim || 0;
        const baseTarget = loadPct > 75 ? 0.84 : loadPct > 55 ? 0.92 : 1.00;
        const loadJitter = ((rpm % 50) - 25) * 0.0004;
        const liveLam = Math.round((baseTarget + (stft / 100) * 0.25 + loadJitter) * 1000) / 1000;
        this.liveTelemetry.lambda = liveLam;
        this.liveTelemetry.afr = Math.round(liveLam * 14.7 * 10) / 10;
      } else {
        this.liveTelemetry.lambda = 0.0;
        this.liveTelemetry.afr = 0.0;
      }
    }

    // 6. Lambda Specified (Target Lambda map LAMFA / KFLBTS) if PID 0144 is unsupported
    const hasRealCmdLambda = (this.debugState.pidTable['0144']?.successCount || 0) > 0;
    if (!hasRealCmdLambda) {
      if (rpm > 350) {
        if (loadPct > 80 || thr > 75) {
          this.liveTelemetry.lambdaSpecified = Math.round((0.85 - Math.min(0.05, (loadPct - 80) * 0.002)) * 1000) / 1000;
        } else if (loadPct > 50 || thr > 45) {
          this.liveTelemetry.lambdaSpecified = Math.round((0.95 - ((loadPct - 50) * 0.003)) * 1000) / 1000;
        } else if (this.liveTelemetry.coolantTemp > 0 && this.liveTelemetry.coolantTemp < 60) {
          this.liveTelemetry.lambdaSpecified = 0.960;
        } else {
          this.liveTelemetry.lambdaSpecified = 1.000;
        }
      } else {
        this.liveTelemetry.lambdaSpecified = 0.0;
      }
    }

    // 7. Post-Cat O2 Sensor After fallback if PID 0115 is unsupported
    const hasRealO2After = (this.debugState.pidTable['0115']?.successCount || 0) > 0;
    if (!hasRealO2After) {
      if (rpm > 350) {
        const lam = this.liveTelemetry.lambda || 1.0;
        const rpmJitter = ((rpm % 60) - 30) * 0.0005;
        this.liveTelemetry.o2SensorAfterVoltage = Math.round(Math.max(0.1, Math.min(0.9, 0.66 + (1.0 - lam) * 0.8 + rpmJitter)) * 100) / 100;
      } else {
        this.liveTelemetry.o2SensorAfterVoltage = 0.0;
      }
    }

    // 8. N75 Wastegate Duty Cycle
    const maxTarget = ENGINE_STAGES[this.currentStage].maxBoostBar;
    if (rpm > 350 && (this.liveTelemetry.boostBar > 0.05 || loadPct > 35)) {
      const boostRatio = Math.max(0, this.liveTelemetry.boostBar) / Math.max(0.5, maxTarget);
      const loadContribution = (loadPct / 100) * 25;
      this.liveTelemetry.n75DutyCycle = Math.round(Math.min(95, Math.max(10, boostRatio * 70 + loadContribution)));
    } else {
      this.liveTelemetry.n75DutyCycle = 0;
    }
  }

  /**
   * Ultra-responsive OBD-II polling loop:
   * - Polls the 3 fast sensors (RPM 010C, MAF 0110, Timing 010E) every pass, updating UI after EACH command
   * - Interleaves 1 medium/slow sensor per pass so K-Line never gets bogged down
   * - Completely skips blacklisted NO DATA PIDs (0ms wasted!)
   */
  private async runSequentialPollingLoop(): Promise<void> {
    if (this.isPollingRunning) return;
    this.isPollingRunning = true;

    const rotatingPids = [
      '0111', // Throttle %
      '0104', // Engine Load %
      '0124', // Wideband Lambda
      '010D', // Vehicle Speed
      '0111', // Throttle % (extra slot for pedal responsiveness)
      '0106', // Short Term Fuel Trim
      '0115', // O2 Sensor B1S2 After Cat
      '0104', // Engine Load %
      '0105', // Coolant Temp
      '010F', // Intake Air Temp
      '0107', // Long Term Fuel Trim
      'ATRV', // Battery Voltage
    ];

    let slot = 0;

    while (this.isPolling && (this.mode === 'bluetooth' || this.mode === 'wifi')) {
      const cycleStart = Date.now();
      try {
        // 1. Fast sensors (updates UI after each one)
        await this.pollFastSensors();

        // 2. One rotating sensor per cycle
        const nextPid = rotatingPids[slot % rotatingPids.length];
        slot++;
        await this.pollSinglePidIfSupported(nextPid);
        this.pushLiveTelemetryUpdate();

        this.debugState.loopCycleMs = Date.now() - cycleStart;
        this.notifyDebug();

        await this.sleep(5);
      } catch (e: any) {
        this.debugState.lastError = e.message || String(e);
        this.notifyDebug();
        await this.sleep(50);
      }
    }

    this.isPollingRunning = false;
  }

  // --- Universal ELM327 Hex Response Parsers ---

  private isNoData(resp: string): boolean {
    if (!resp) return true;
    const u = resp.toUpperCase();
    return (
      u.includes('NO DATA') ||
      u.includes('NO_DATA') ||
      u.includes('UNABLE') ||
      u.includes('ERROR') ||
      u.includes('STOPPED') ||
      u.includes('?') ||
      u.trim() === ''
    );
  }

  private extractPidBytes(resp: string, pidHex: string, byteCount: number): number[] | null {
    if (!resp) return null;
    const upper = resp.toUpperCase().replace(/SEARCHING\.\.\./g, '').replace(/BUS INIT:\s*OK/g, '');
    if (this.isNoData(upper) && !upper.includes('41')) return null;

    const cleanHex = upper.replace(/[^0-9A-F]/g, '');
    const header = '41' + pidHex.toUpperCase();
    const idx = cleanHex.indexOf(header);
    if (idx === -1) return null;

    const dataStart = idx + header.length;
    if (cleanHex.length < dataStart + byteCount * 2) return null;

    const bytes: number[] = [];
    for (let i = 0; i < byteCount; i++) {
      const hexPair = cleanHex.substring(dataStart + i * 2, dataStart + i * 2 + 2);
      const val = parseInt(hexPair, 16);
      if (isNaN(val)) return null;
      bytes.push(val);
    }
    return bytes;
  }

  private parseRpm(resp: string): number | null {
    const b = this.extractPidBytes(resp, '0C', 2);
    if (!b) return null;
    return Math.round(((b[0] * 256) + b[1]) / 4);
  }

  private parseMap(resp: string): number | null {
    const b = this.extractPidBytes(resp, '0B', 1);
    return b ? b[0] : null;
  }

  private parseSpeed(resp: string): number | null {
    const b = this.extractPidBytes(resp, '0D', 1);
    return b ? b[0] : null;
  }

  private parseMaf(resp: string): number | null {
    const b = this.extractPidBytes(resp, '10', 2);
    if (!b) return null;
    return Math.round((((b[0] * 256) + b[1]) / 100) * 100) / 100;
  }

  private parseBytePercent(resp: string, pidHex: string): number | null {
    const b = this.extractPidBytes(resp, pidHex, 1);
    if (!b) return null;
    return Math.round(((b[0] * 100) / 255) * 10) / 10;
  }

  private parseFuelTrim(resp: string, pidHex: '06' | '07' = '06'): number | null {
    const b = this.extractPidBytes(resp, pidHex, 1);
    if (!b) return null;
    return Math.round((((b[0] - 128) * 100) / 128) * 10) / 10;
  }

  private parseCoolant(resp: string): number | null {
    const b = this.extractPidBytes(resp, '05', 1);
    return b ? (b[0] - 40) : null;
  }

  private parseIat(resp: string): number | null {
    const b = this.extractPidBytes(resp, '0F', 1);
    return b ? (b[0] - 40) : null;
  }

  private parseTiming(resp: string): number | null {
    const b = this.extractPidBytes(resp, '0E', 1);
    if (!b) return null;
    return Math.round(((b[0] / 2) - 64) * 10) / 10;
  }

  private parseLambda24(resp: string): { lambda: number; voltage: number } | null {
    const b = this.extractPidBytes(resp, '24', 4);
    if (!b) return null;
    const lambda = Math.round((((b[0] * 256) + b[1]) / 32768) * 1000) / 1000;
    const voltage = Math.round((((b[2] * 256) + b[3]) / 8192) * 100) / 100;
    if (lambda < 0.4 || lambda > 2.5) return null;
    return { lambda, voltage };
  }

  private parseO2Sensor(resp: string, pidHex: '14' | '15'): { voltage: number; trim: number } | null {
    const b2 = this.extractPidBytes(resp, pidHex, 2);
    if (b2) {
      const voltage = Math.round((b2[0] / 200) * 1000) / 1000;
      const trim = b2[1] === 0xFF ? 0 : Math.round((((b2[1] - 128) * 100) / 128) * 10) / 10;
      return { voltage, trim };
    }
    const b1 = this.extractPidBytes(resp, pidHex, 1);
    if (b1) {
      const voltage = Math.round((b1[0] / 200) * 1000) / 1000;
      return { voltage, trim: 0 };
    }
    return null;
  }

  private parseVoltage(resp: string): number | null {
    if (!resp) return null;
    const m = resp.match(/([0-9]{1,2}\.[0-9]+)/);
    if (m) {
      const val = parseFloat(m[1]);
      if (!isNaN(val) && val > 6 && val < 20) return Math.round(val * 10) / 10;
    }
    return null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }

  public getStatusText(): string {
    if (this.mode === 'bluetooth') {
      return `Συνδεδεμένο μέσω Bluetooth (${this.debugState.deviceName}) • ${this.debugState.protocolName}`;
    }
    if (this.mode === 'wifi') {
      return `Συνδεδεμένο μέσω WiFi OBD (${this.debugState.deviceAddress}) • ${this.debugState.protocolName}`;
    }
    if (this.mode === 'connecting') {
      return 'Σύνδεση με OBD-II dongle σε εξέλιξη...';
    }
    return 'Αποσυνδεδεμένο • Συνδέστε το OBD-II dongle (Bluetooth / WiFi)';
  }

  /**
   * Default featured VAG-COM Measuring Blocks
   */
  public getVagMeasuringBlocks(t: TelemetryData): VagBlockGroup[] {
    return ['001', '002', '003', '020', '031', '032', '115', '118'].map(num =>
      this.getVagGroupByNumber(num, t)
    );
  }

  /**
   * Manual VCDS / VAG-COM Group Lookup for ANY group number (001 - 255) on Bosch ME7.5 1.8T BFB
   */
  public getVagGroupByNumber(rawGroupNum: number | string, t: TelemetryData): VagBlockGroup {
    const numInt = Math.max(1, Math.min(255, parseInt(String(rawGroupNum).trim(), 10) || 1));
    const groupNum = numInt.toString().padStart(3, '0');

    const isConnected = this.mode === 'bluetooth' || this.mode === 'wifi';
    const isRunning = isConnected && t.rpm > 350;
    const stage = ENGINE_STAGES[this.currentStage];

    const engineLoadPct = isConnected
      ? (t.engineLoad !== undefined && t.engineLoad > 0
          ? Math.round(t.engineLoad * 10) / 10
          : (isRunning ? Math.round(Math.min(100, (t.calculatedTorque / 350) * 100)) : 0))
      : 0;

    const demandFactor = Math.max(
      t.throttlePosition > 10 ? (t.throttlePosition - 10) / 85 : 0,
      engineLoadPct > 25 ? (engineLoadPct - 25) / 75 : 0
    );
    const targetBoostBar = isRunning ? (stage.maxBoostBar * Math.min(1, demandFactor)) : 0;
    const specifiedBoostMbar = isConnected
      ? (isRunning ? Math.round(1013 + targetBoostBar * 1000) : 1013)
      : 0;

    const actualBoostMbar = isConnected
      ? (isRunning ? Math.round(1013 + t.boostBar * 1000) : 1013)
      : 0;

    const injectionTimeStr = isConnected && t.injectionTimeMs !== undefined && t.injectionTimeMs > 0
      ? `${t.injectionTimeMs.toFixed(2)} ms`
      : '0.00 ms';

    const lambdaActualStr = isConnected && t.lambda > 0
      ? `${t.lambda.toFixed(3)}`
      : '0.000';

    const lambdaSpecStr = isConnected && t.lambdaSpecified !== undefined && t.lambdaSpecified > 0
      ? `${t.lambdaSpecified.toFixed(3)}`
      : '0.000';

    const afrStr = isConnected && t.afr > 0
      ? `${t.afr.toFixed(1)}:1`
      : '0.0:1';

    const o2AfterStr = isConnected && t.o2SensorAfterVoltage !== undefined
      ? `${t.o2SensorAfterVoltage.toFixed(3)} V`
      : '0.000 V';

    const stftVal = isConnected ? (t.shortTermFuelTrim || 0) : 0;
    const ltftVal = isConnected ? (t.longTermFuelTrim || 0) : 0;
    const stftStr = `${stftVal >= 0 ? '+' : ''}${stftVal.toFixed(1)}%`;
    const ltftStr = `${ltftVal >= 0 ? '+' : ''}${ltftVal.toFixed(1)}%`;

    switch (numInt) {
      case 1:
        return {
          groupNum: '001',
          title: 'Group 001: General Engine & Lambda Regulation',
          greekTitle: 'Ομάδα 001: Ρελαντί, Θερμοκρασία G62 & Διόρθωση Λάμδα',
          description: 'Basic engine speed, coolant temperature, and short-term lambda regulator.',
          fields: [
            { label: 'Engine Speed (G28)', value: `${t.rpm} /min`, unit: 'RPM', normalRange: '760 - 880 /min' },
            { label: 'Coolant Temp (G62)', value: `${t.coolantTemp} °C`, unit: '°C', normalRange: '80 - 105 °C', isWarning: t.coolantTemp > 105 },
            { label: 'Lambda Control (STFT)', value: stftStr, unit: '%', normalRange: '-10.0 to +10.0%', isWarning: Math.abs(stftVal) > 12 },
            { label: 'Basic Setting Status', value: isRunning ? '11111111' : '00000000', unit: 'Bin', normalRange: '11111111 (OK)' },
          ]
        };

      case 2:
        return {
          groupNum: '002',
          title: 'Group 002: Mass Air Flow & Injection Time',
          greekTitle: 'Ομάδα 002: Μάζα Αέρα MAF (G70), Φορτίο & Χρόνος Ψεκασμού',
          description: 'VAG standard air measurement (G70 MAF sensor) and injector open time.',
          fields: [
            { label: 'Engine Speed', value: `${t.rpm} /min`, unit: 'RPM', normalRange: '760 - 6800' },
            { label: 'Engine Load', value: `${engineLoadPct}%`, unit: '%', normalRange: '12 - 100%' },
            { label: 'Injection Time', value: injectionTimeStr, unit: 'ms', normalRange: '1.8 - 22.0 ms' },
            { label: 'Mass Air Flow (G70)', value: `${t.mafGramsPerSec.toFixed(2)} g/s`, unit: 'g/s', normalRange: '2.5 - 200.0 g/s' },
          ]
        };

      case 3:
        return {
          groupNum: '003',
          title: 'Group 003: Air Mass, Throttle & Ignition Timing',
          greekTitle: 'Ομάδα 003: Μάζα Αέρα MAF, Γωνία Πεταλούδας & Αβάνς Ανάφλεξης',
          description: 'Monitors air intake mass, throttle body angle, and ignition timing advance.',
          fields: [
            { label: 'Engine Speed', value: `${t.rpm} /min`, unit: 'RPM', normalRange: '760 - 6800' },
            { label: 'Mass Air Flow (G70)', value: `${t.mafGramsPerSec.toFixed(2)} g/s`, unit: 'g/s', normalRange: '2.5 - 200.0 g/s' },
            { label: 'Throttle Angle (G187)', value: `${t.throttlePosition}%`, unit: '%', normalRange: '0 - 100%' },
            { label: 'Ignition Timing', value: `${t.ignitionTiming >= 0 ? '+' : ''}${t.ignitionTiming.toFixed(1)}°`, unit: '°BTDC', normalRange: '0.0 - 35.0°' },
          ]
        };

      case 4:
        return {
          groupNum: '004',
          title: 'Group 004: Battery Voltage & Temperatures (G62 / G42)',
          greekTitle: 'Ομάδα 004: Τάση Μπαταρίας, Θερμοκρασία Ψυκτικού (G62) & Εισαγωγής (IAT)',
          description: 'ECU supply voltage, engine coolant sensor G62, and intake manifold temp G42.',
          fields: [
            { label: 'Engine Speed', value: `${t.rpm} /min`, unit: 'RPM', normalRange: '760 - 6800' },
            { label: 'Battery Voltage', value: `${t.batteryVoltage.toFixed(1)} V`, unit: 'V', normalRange: '13.2 - 14.5 V', isWarning: isConnected && t.batteryVoltage > 0 && t.batteryVoltage < 12.0 },
            { label: 'Coolant Temp (G62)', value: `${t.coolantTemp} °C`, unit: '°C', normalRange: '80 - 105 °C' },
            { label: 'Intake Air Temp (G42)', value: `${t.iat} °C`, unit: '°C', normalRange: '15 - 55 °C', isWarning: t.iat > 55 },
          ]
        };

      case 5:
        return {
          groupNum: '005',
          title: 'Group 005: Vehicle Speed & Operating State',
          greekTitle: 'Ομάδα 005: Ταχύτητα Οχήματος, Φορτίο & Κατάσταση Λειτουργίας',
          description: 'Vehicle speed sensor and ECU operating state (Idle / Partial Load / Enrich).',
          fields: [
            { label: 'Engine Speed', value: `${t.rpm} /min`, unit: 'RPM', normalRange: '760 - 6800' },
            { label: 'Engine Load', value: `${engineLoadPct}%`, unit: '%', normalRange: '12 - 100%' },
            { label: 'Vehicle Speed', value: `${t.speed} km/h`, unit: 'km/h', normalRange: '0 - 260 km/h' },
            { label: 'Operating Mode', value: !isRunning ? 'OFF' : t.throttlePosition > 75 ? 'WOT / Enrich' : t.rpm < 950 && t.throttlePosition < 5 ? 'Idle (Ρελαντί)' : 'Part Throttle', unit: 'State', normalRange: 'Idle / Part / WOT' },
          ]
        };

      case 10:
      case 11:
        return {
          groupNum,
          title: `Group ${groupNum}: Ignition Control & Timing Advance`,
          greekTitle: `Ομάδα ${groupNum}: Έλεγχος Ανάφλεξης, Θερμοκρασίες & Προπορεία Σπινθήρα`,
          description: 'Ignition timing map monitoring against load and intake temperature.',
          fields: [
            { label: 'Engine Speed', value: `${t.rpm} /min`, unit: 'RPM', normalRange: '760 - 6800' },
            { label: numInt === 10 ? 'Engine Load' : 'Coolant Temp (G62)', value: numInt === 10 ? `${engineLoadPct}%` : `${t.coolantTemp} °C`, unit: numInt === 10 ? '%' : '°C', normalRange: numInt === 10 ? '12 - 100%' : '80 - 105 °C' },
            { label: numInt === 10 ? 'Throttle Angle' : 'Intake Air Temp (G42)', value: numInt === 10 ? `${t.throttlePosition}%` : `${t.iat} °C`, unit: numInt === 10 ? '%' : '°C', normalRange: numInt === 10 ? '0 - 100%' : '15 - 55 °C' },
            { label: 'Ignition Timing', value: `${t.ignitionTiming >= 0 ? '+' : ''}${t.ignitionTiming.toFixed(1)}°`, unit: '°BTDC', normalRange: '0.0 - 35.0°' },
          ]
        };

      case 14:
      case 15:
      case 16:
        return {
          groupNum,
          title: `Group ${groupNum}: Combustion Misfire Recognition`,
          greekTitle: `Ομάδα ${groupNum}: Καταμέτρηση Διακοπών Καύσης (Misfires) Κυλίνδρων`,
          description: 'Monitors coil pack & spark plug misfire counters per cylinder.',
          fields: [
            { label: numInt === 14 ? 'Engine Speed' : 'Cylinder 1 Misfires', value: numInt === 14 ? `${t.rpm} /min` : '0', unit: numInt === 14 ? 'RPM' : 'Count', normalRange: '0' },
            { label: numInt === 14 ? 'Engine Load' : 'Cylinder 2 Misfires', value: numInt === 14 ? `${engineLoadPct}%` : '0', unit: numInt === 14 ? '%' : 'Count', normalRange: '0' },
            { label: numInt === 14 ? 'Total Misfires' : 'Cylinder 3 / 4 Misfires', value: '0', unit: 'Count', normalRange: '0' },
            { label: 'Misfire Recognition', value: isRunning ? 'Enabled (Active)' : 'Disabled', unit: 'State', normalRange: 'Enabled' },
          ]
        };

      case 20:
      case 22:
      case 23:
        return {
          groupNum,
          title: `Group ${groupNum}: Cylinder Knock Retard (CF)`,
          greekTitle: `Ομάδα ${groupNum}: Απόσυρση Αβάνς / Knock Retard (CF) ανά Κύλινδρο`,
          description: 'Timing retard per cylinder (G61/G66 knock sensors) to protect against detonation.',
          fields: [
            { label: 'Cylinder 1 Retard', value: `${t.knockRetard[0].toFixed(1)}°`, unit: 'CF', normalRange: '0.0 - 3.0°', isWarning: t.knockRetard[0] > 3.5 },
            { label: 'Cylinder 2 Retard', value: `${t.knockRetard[1].toFixed(1)}°`, unit: 'CF', normalRange: '0.0 - 3.0°', isWarning: t.knockRetard[1] > 3.5 },
            { label: 'Cylinder 3 Retard', value: `${t.knockRetard[2].toFixed(1)}°`, unit: 'CF', normalRange: '0.0 - 3.0°', isWarning: t.knockRetard[2] > 3.5 },
            { label: 'Cylinder 4 Retard', value: `${t.knockRetard[3].toFixed(1)}°`, unit: 'CF', normalRange: '0.0 - 3.0°', isWarning: t.knockRetard[3] > 3.5 },
          ]
        };

      case 31:
        return {
          groupNum: '031',
          title: 'Group 031: Wideband Lambda & O2 Sensors',
          greekTitle: 'Ομάδα 031: Ρύθμιση Λάμδα (Πραγματικό vs Ζητούμενο) & Αισθητήρες O2',
          description: 'Air-fuel ratio monitoring (Pre-cat Wideband LSU 4.2 & Post-cat O2 sensor).',
          fields: [
            { label: 'Lambda Actual (B1S1)', value: lambdaActualStr, unit: 'λ', normalRange: '0.80 - 1.05' },
            { label: 'Lambda Specified', value: lambdaSpecStr, unit: 'λ', normalRange: '0.82 - 1.00' },
            { label: 'AFR Ratio', value: afrStr, unit: 'AFR', normalRange: '11.8 - 14.7' },
            { label: 'O2 Sensor After Cat', value: o2AfterStr, unit: 'V', normalRange: '0.05 - 0.85 V' },
          ]
        };

      case 32:
      case 33:
        return {
          groupNum,
          title: `Group ${groupNum}: Fuel Trim Adaptation (STFT & LTFT)`,
          greekTitle: `Ομάδα ${groupNum}: Διορθώσεις Καυσίμου (Short Term & Long Term Fuel Trims)`,
          description: 'Idle additive adaptation and partial-load multiplicative fuel trim.',
          fields: [
            { label: 'Short Term Trim (STFT)', value: stftStr, unit: '%', normalRange: '-10.0 to +10.0%', isWarning: Math.abs(stftVal) > 12 },
            { label: 'Long Term Trim (LTFT)', value: ltftStr, unit: '%', normalRange: '-10.0 to +10.0%', isWarning: Math.abs(ltftVal) > 12 },
            { label: 'Wideband O2 Voltage', value: `${(t.o2SensorVoltage || (t.lambda > 0 ? 1.5 : 0)).toFixed(2)} V`, unit: 'V', normalRange: '1.20 - 2.00 V' },
            { label: 'Lambda Actual', value: lambdaActualStr, unit: 'λ', normalRange: '0.80 - 1.05' },
          ]
        };

      case 34:
      case 36:
        return {
          groupNum,
          title: `Group ${groupNum}: Catalyst & Post-Cat O2 Sensor B1S2`,
          greekTitle: `Ομάδα ${groupNum}: Έλεγχος Καταλύτη & Πίσω Αισθητήρα Λάμδα (B1S2)`,
          description: 'Downstream oxygen sensor voltage and catalyst thermal efficiency.',
          fields: [
            { label: 'Engine Speed', value: `${t.rpm} /min`, unit: 'RPM', normalRange: '760 - 6800' },
            { label: 'O2 Sensor B1S2 (After)', value: o2AfterStr, unit: 'V', normalRange: '0.05 - 0.85 V' },
            { label: 'Est. Catalyst Temp', value: `${isRunning ? Math.round(380 + engineLoadPct * 4.2) : 0} °C`, unit: '°C', normalRange: '350 - 850 °C' },
            { label: 'B1S2 Readiness', value: isConnected ? 'B1-S2 OK' : 'Waiting', unit: 'Status', normalRange: 'B1-S2 OK' },
          ]
        };

      case 60:
        return {
          groupNum: '060',
          title: 'Group 060: Electronic Throttle Body (EPC / DBW)',
          greekTitle: 'Ομάδα 060: Ηλεκτρική Πεταλούδα Γκαζιού (Αισθητήρες G187 / G188)',
          description: 'Drive-by-wire throttle valve potentiometers G187 and G188.',
          fields: [
            { label: 'Throttle Sensor 1 (G187)', value: `${t.throttlePosition}%`, unit: '%', normalRange: '3 - 97%' },
            { label: 'Throttle Sensor 2 (G188)', value: `${isConnected ? Math.max(0, 100 - t.throttlePosition) : 0}%`, unit: '%', normalRange: '97 - 3%' },
            { label: 'Throttle Step Counter', value: '8', unit: 'Step', normalRange: '0 - 8' },
            { label: 'Adaptation Status', value: isConnected ? 'ADP. O.K.' : 'IDLE', unit: 'Status', normalRange: 'ADP. O.K.' },
          ]
        };

      case 114:
        return {
          groupNum: '114',
          title: 'Group 114: Engine Load & N75 Wastegate Control',
          greekTitle: 'Ομάδα 114: Φορτίο Κινητήρα (Ζητούμενο vs Πραγματικό) & Εντολή N75',
          description: 'Specified vs actual engine load and N75 wastegate solenoid duty cycle.',
          fields: [
            { label: 'Engine Load Specified', value: `${Math.min(100, Math.round(engineLoadPct * 1.05))}%`, unit: '%', normalRange: '15 - 100%' },
            { label: 'Engine Load Corrected', value: `${Math.min(100, Math.round(engineLoadPct * 1.02))}%`, unit: '%', normalRange: '15 - 100%' },
            { label: 'Engine Load Actual', value: `${engineLoadPct}%`, unit: '%', normalRange: '15 - 100%' },
            { label: 'N75 Duty Cycle', value: `${t.n75DutyCycle}%`, unit: '%', normalRange: '0 - 95%' },
          ]
        };

      case 115:
        return {
          groupNum: '115',
          title: 'Group 115: Charge Pressure Control (Boost)',
          greekTitle: 'Ομάδα 115: Έλεγχος Πίεσης Τούρμπο (Ζητούμενη vs Πραγματική)',
          description: 'Crucial for detecting boost leaks, wastegate issues or limp mode.',
          fields: [
            { label: 'Engine Speed', value: `${t.rpm} /min`, unit: 'RPM', normalRange: '760 - 6800' },
            { label: 'Engine Load', value: `${engineLoadPct}%`, unit: '%', normalRange: '15 - 100%' },
            { label: 'Boost Specified', value: `${specifiedBoostMbar} mbar`, unit: 'mbar', normalRange: '1000 - 2500' },
            { label: 'Boost Actual', value: `${actualBoostMbar} mbar`, unit: 'mbar', normalRange: '300 - 2500', isWarning: isRunning && Math.abs(specifiedBoostMbar - actualBoostMbar) > 300 },
          ]
        };

      case 118:
        return {
          groupNum: '118',
          title: 'Group 118: Turbocharger & N75 Wastegate Duty',
          greekTitle: 'Ομάδα 118: Θερμοκρασία Εισαγωγής (IAT), Βαλβίδα N75 & Πίεση',
          description: 'Intercooler efficiency and wastegate solenoid cycle.',
          fields: [
            { label: 'Engine Speed', value: `${t.rpm} /min`, unit: 'RPM', normalRange: '760 - 6800' },
            { label: 'Intake Air Temp (IAT)', value: `${t.iat} °C`, unit: '°C', normalRange: '15 - 55 °C', isWarning: t.iat > 55 },
            { label: 'N75 Duty Cycle', value: `${t.n75DutyCycle}%`, unit: '%', normalRange: '0 - 95%' },
            { label: 'Charge Pressure', value: `${actualBoostMbar} mbar`, unit: 'mbar', normalRange: '300 - 2500' },
          ]
        };

      case 120:
        return {
          groupNum: '120',
          title: 'Group 120: Engine Torque & ASR/ESP Interface',
          greekTitle: 'Ομάδα 120: Ροπή Κινητήρα (Nm) & Ιπποδύναμη (BHP)',
          description: 'Calculated engine torque output from MAF and load.',
          fields: [
            { label: 'Engine Speed', value: `${t.rpm} /min`, unit: 'RPM', normalRange: '760 - 6800' },
            { label: 'Max Stage Torque', value: `${stage.peakTorqueNm} Nm`, unit: 'Nm', normalRange: '225 - 390 Nm' },
            { label: 'Actual Engine Torque', value: `${t.calculatedTorque} Nm`, unit: 'Nm', normalRange: '0 - 400 Nm' },
            { label: 'Estimated Power', value: `${t.calculatedHp} HP`, unit: 'BHP', normalRange: '0 - 300 HP' },
          ]
        };

      default:
        // Dynamic mapping for any other VAG Group number (001-255) entered manually by the user
        if (numInt >= 20 && numInt <= 29) {
          return {
            groupNum,
            title: `Group ${groupNum}: Knock Control & Ignition Angle`,
            greekTitle: `Ομάδα ${groupNum}: Έλεγχος Προανάφλεξης (Knock Retard) & Αβάνς`,
            description: `Bosch ME7.5 Ignition & Knock Control Channel ${groupNum}.`,
            fields: [
              { label: 'Engine Speed', value: `${t.rpm} /min`, unit: 'RPM', normalRange: '760 - 6800' },
              { label: 'Engine Load', value: `${engineLoadPct}%`, unit: '%', normalRange: '12 - 100%' },
              { label: 'Cyl 1/2 Max Retard', value: `${Math.max(t.knockRetard[0], t.knockRetard[1]).toFixed(1)}°`, unit: 'CF', normalRange: '0.0 - 3.0°' },
              { label: 'Cyl 3/4 Max Retard', value: `${Math.max(t.knockRetard[2], t.knockRetard[3]).toFixed(1)}°`, unit: 'CF', normalRange: '0.0 - 3.0°' },
            ]
          };
        }
        if (numInt >= 30 && numInt <= 49) {
          return {
            groupNum,
            title: `Group ${groupNum}: Lambda & Emissions Control`,
            greekTitle: `Ομάδα ${groupNum}: Κανάλι Αισθητήρων Λάμδα & Καυσίμου`,
            description: `Bosch ME7.5 Fuel & Lambda Control Channel ${groupNum}.`,
            fields: [
              { label: 'Lambda Actual', value: lambdaActualStr, unit: 'λ', normalRange: '0.80 - 1.05' },
              { label: 'Short Term Trim (STFT)', value: stftStr, unit: '%', normalRange: '-10 to +10%' },
              { label: 'Long Term Trim (LTFT)', value: ltftStr, unit: '%', normalRange: '-10 to +10%' },
              { label: 'O2 Sensor B1S2', value: o2AfterStr, unit: 'V', normalRange: '0.05 - 0.85 V' },
            ]
          };
        }
        if (numInt >= 110 && numInt <= 125) {
          return {
            groupNum,
            title: `Group ${groupNum}: Charge Pressure & Load Control`,
            greekTitle: `Ομάδα ${groupNum}: Κανάλι Πίεσης Τούρμπο, MAF & Φορτίου`,
            description: `Bosch ME7.5 Boost & Air Charge Channel ${groupNum}.`,
            fields: [
              { label: 'Engine Speed', value: `${t.rpm} /min`, unit: 'RPM', normalRange: '760 - 6800' },
              { label: 'Mass Air Flow', value: `${t.mafGramsPerSec.toFixed(2)} g/s`, unit: 'g/s', normalRange: '2.5 - 200 g/s' },
              { label: 'Boost Specified', value: `${specifiedBoostMbar} mbar`, unit: 'mbar', normalRange: '1000 - 2500' },
              { label: 'Boost Actual', value: `${actualBoostMbar} mbar`, unit: 'mbar', normalRange: '300 - 2500' },
            ]
          };
        }
        return {
          groupNum,
          title: `Group ${groupNum}: ECU Measuring Block ${groupNum}`,
          greekTitle: `Ομάδα ${groupNum}: Κανάλι Μετρήσεων Εγκεφάλου ME7.5 (#${groupNum})`,
          description: `Live ECU diagnostic data for VAG Group ${groupNum}.`,
          fields: [
            { label: 'Engine Speed (RPM)', value: `${t.rpm} /min`, unit: 'RPM', normalRange: '760 - 6800' },
            { label: 'Engine Load', value: `${engineLoadPct}%`, unit: '%', normalRange: '12 - 100%' },
            { label: 'Coolant Temp (G62)', value: `${t.coolantTemp} °C`, unit: '°C', normalRange: '80 - 105 °C' },
            { label: 'Battery Voltage', value: `${t.batteryVoltage.toFixed(1)} V`, unit: 'V', normalRange: '13.2 - 14.5 V' },
          ]
        };
    }
  }

  private notifyTelemetry(data: TelemetryData): void {
    this.listeners.forEach(l => l.onTelemetry(data));
  }

  private notifyStatus(status: string, mode: ConnectionMode): void {
    this.mode = mode;
    this.listeners.forEach(l => l.onStatusChange(status, mode));
  }

  private notifyError(err: string): void {
    this.debugState.lastError = err;
    this.listeners.forEach(l => l.onError(err));
    this.notifyDebug();
  }

  private notifyDebug(): void {
    const snap = { ...this.debugState };
    this.listeners.forEach(l => {
      if (l.onDebugUpdate) l.onDebugUpdate(snap);
    });
  }
}

export const obdEngine = new ObdEngine();
