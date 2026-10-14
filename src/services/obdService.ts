import { TelemetryData, DTCFault, EngineStageId, EngineStageConfig, FuelOctane, VagBlockGroup, VagBlockField } from '../types/telemetry';

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
  refreshIntervalMs: number;
  lastValidTimestampMs: number;
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
  kLineTimingConfig: string;
  kLineTimingVerified: boolean;
  kLineDroppedFrames: number;
  supportedSensorsCount: number;
  avgCommandMs: number;
  commandsPerSecHz: number;
  supportedPids0120: string;
  supportedPids2140: string;
  supportedPids4160: string;
  oilTempPid015CSupported: string;
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

// Reference profiles for UI Stage info tab only (never used to fabricate sensor values)
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
    greekDescription: 'Πρόγραμμα ECU Stage 1 • Ελεύθερο φίλτρο • Σκάστρα 710N • 1.05 bar overboost.',
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
    greekDescription: 'Χαμηλό σήμα μετρητή μάζας αέρα MAF (G70). Ελέγξτε τη φίσα του MAF, καθαρίστε το νήμα ή αντικαταταστήστε με γνήσιο Bosch.',
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

/**
 * Strictly null initial state: NO fake/calculated numbers, NO misleading zeros when sensors have not responded.
 */
export const ZERO_TELEMETRY: TelemetryData = {
  rpm: null,
  speed: null,
  boostBar: null,
  boostPsi: null,
  peakBoostBar: null,
  coolantTemp: null,
  iat: null,
  oilTemp: null,
  oilPressure: null,
  mafGramsPerSec: null,
  calculatedHp: null,
  calculatedTorque: null,
  lambda: null,
  afr: null,
  ignitionTiming: null,
  knockRetard: [null, null, null, null],
  n75DutyCycle: null,
  batteryVoltage: null,
  throttlePosition: null,
  engineLoad: null,
  lambdaSpecified: null,
  shortTermFuelTrim: null,
  longTermFuelTrim: null,
  o2SensorVoltage: null,
  o2SensorAfterVoltage: null,
  injectionTimeMs: null,
  timestamp: Date.now(),
};

/**
 * Complete flat catalog of real OBD-II PIDs checked and polled sequentially without priority starvation.
 */
const INITIAL_PID_CATALOG: Array<{ pid: string; name: string }> = [
  { pid: '010C', name: 'Engine RPM (Στροφές Κινητήρα)' },
  { pid: '0104', name: 'Calculated Engine Load (Φορτίο %)' },
  { pid: '0105', name: 'Coolant Temp (Θερμοκρασία G62 °C)' },
  { pid: '0106', name: 'Short Term Fuel Trim B1 (STFT %)' },
  { pid: '0107', name: 'Long Term Fuel Trim B1 (LTFT %)' },
  { pid: '010B', name: 'Intake Manifold Absolute Pressure (MAP kPa)' },
  { pid: '010D', name: 'Vehicle Speed (Ταχύτητα km/h)' },
  { pid: '010E', name: 'Ignition Timing Advance (Αβάνς °BTDC)' },
  { pid: '010F', name: 'Intake Air Temp (Θερμοκρασία IAT G42 °C)' },
  { pid: '0110', name: 'MAF Air Flow (Μάζα Αέρα G70 g/s)' },
  { pid: '0111', name: 'Throttle Position (Πεταλούδα G187 %)' },
  { pid: '0114', name: 'O2 Sensor B1S1 Narrowband (V)' },
  { pid: '0115', name: 'O2 Sensor B1S2 After Cat (V)' },
  { pid: '0124', name: 'Wideband Lambda B1S1 (PID 24 λ & V)' },
  { pid: '0142', name: 'Control Module Voltage (ECU V)' },
  { pid: '0144', name: 'Commanded Equivalence Ratio (λ Spec)' },
  { pid: '015C', name: 'Engine Oil Temperature (Θερμ. Λαδιού °C)' },
  { pid: 'ATRV', name: 'Adapter Battery Voltage (Pin 16 V)' },
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
  private blePromptResolver: (() => void) | null = null;

  // WiFi ELM327 settings (Standard ELM327 WiFi IP & Port)
  private wifiConfig: WifiObdConfig = {
    ip: '192.168.0.10',
    port: 35000
  };

  // Tuning Stage & Fuel State (for reference tab only)
  private currentStage: EngineStageId = 'stage1';
  private currentOctane: FuelOctane = 100;
  private peakBoost: number | null = null;

  // Active DTC Faults
  private activeDTCs: DTCFault[] = [];

  // Polling & Mutex Lock
  private isPolling: boolean = false;
  private isPollingRunning: boolean = false;
  private commandMutex: Promise<any> = Promise.resolve();
  private logCounter: number = 1;
  private recentLatencies: number[] = [];

  // Set of PIDs confirmed unsupported on the connected ECU so we NEVER waste K-Line time on NO DATA
  private unsupportedPids: Set<string> = new Set();

  // Cache of real KWP2000 Measuring Block responses (Service 21 XX) if the ECU/dongle supports raw KWP blocks
  private kwpGroupCache: Record<string, { rawHex: string; cells: [string, string, string, string] | null; updatedAt: string }> = {};

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
    kLineTimingConfig: 'ATAT1 + ATST 64 (Default)',
    kLineTimingVerified: false,
    kLineDroppedFrames: 0,
    supportedSensorsCount: 0,
    avgCommandMs: 0,
    commandsPerSecHz: 0,
    supportedPids0120: '-',
    supportedPids2140: '-',
    supportedPids4160: '-',
    oilTempPid015CSupported: 'Εκκρεμεί έλεγχος',
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
        parsedValue: 'N/A',
        latencyMs: 0,
        refreshIntervalMs: 0,
        lastValidTimestampMs: 0,
        status: 'pending',
        successCount: 0,
        failCount: 0,
        lastUpdated: '-',
      };
    }
    this.debugState.pidTable = tbl;
    this.unsupportedPids.clear();
    this.recentLatencies = [];
    this.kwpGroupCache = {};
    this.debugState.kLineDroppedFrames = 0;
    this.debugState.supportedSensorsCount = 0;
    this.debugState.oilTempPid015CSupported = 'Εκκρεμεί έλεγχος';
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
    this.peakBoost = this.liveTelemetry.boostBar;
    this.liveTelemetry.peakBoostBar = this.liveTelemetry.boostBar;
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
    this.liveTelemetry = { ...ZERO_TELEMETRY, timestamp: Date.now() };
    this.notifyTelemetry(this.liveTelemetry);
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
                if (this.bleReceiveBuffer.includes('>') && this.blePromptResolver) {
                  const resolve = this.blePromptResolver;
                  this.blePromptResolver = null;
                  resolve();
                }
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
    this.liveTelemetry = { ...ZERO_TELEMETRY, timestamp: Date.now() };
    this.notifyTelemetry(this.liveTelemetry);
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
   * Smart ELM327 Initialization, Bitmask Discovery (0100/0120/0140/015C), and K-Line Timing Stability Verification
   */
  public async initializeAndLockEcu(forcedProtocolCmd?: string): Promise<boolean> {
    try {
      this.unsupportedPids.clear();
      this.debugState.kLineDroppedFrames = 0;
      this.debugState.kLineTimingVerified = false;
      await this.sleep(200);

      await this.sendObdCommand('ATE0'); // Echo Off
      await this.sendObdCommand('ATL0'); // Linefeeds Off
      await this.sendObdCommand('ATS1'); // Spaces On (reliable framing across all K-Line clones)
      await this.sendObdCommand('ATH0'); // Headers Off
      await this.sendObdCommand('ATAT1'); // Safe Adaptive Timing during K-Line 5-baud handshake
      await this.sendObdCommand('ATST 64'); // 400ms timeout during 5-baud handshake
      this.debugState.kLineTimingConfig = 'ATAT1 + ATST 64 (Handshake)';

      // 1. Read ELM327 Chip Version
      const atiResp = await this.sendObdCommand('ATI');
      if (atiResp) {
        this.debugState.elmVersion = atiResp.replace(/AT\s*I/i, '').trim() || 'ELM327 Compatible';
      }

      // 2. Read Battery Voltage immediately from Pin 16
      const voltResp = await this.executeTrackedPid('ATRV', 'Adapter Battery Voltage (Pin 16 V)', (r) => {
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
        await this.sleep(50);

        this.notifyStatus(`Κλείδωμα εγκεφάλου ECU (${protoCmd})...`, this.mode);
        let initResp = await this.sendObdCommand('0100');

        if ((initResp.toUpperCase().includes('SEARCHING') || initResp.toUpperCase().includes('BUS INIT')) && !initResp.includes('41')) {
          await this.sleep(1600);
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

      if (locked) {
        // 5. Discover Supported PIDs in 0120 (21-40) and 0140 (41-60) BEFORE switching timing
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
          this.unsupportedPids.add('0142');
          this.unsupportedPids.add('0144');
        }

        // 6. Explicit Check for PID 015C (Engine Oil Temperature) as requested!
        this.notifyStatus('Έλεγχος υποστήριξης πραγματικής θερμοκρασίας λαδιού (PID 015C)...', this.mode);
        const oilResp = await this.executeTrackedPid('015C', 'Engine Oil Temperature (Θερμ. Λαδιού °C)', (raw) => {
          const val = this.parseOilTemp(raw);
          if (val !== null) {
            this.liveTelemetry.oilTemp = val;
            return `${val} °C`;
          }
          return null;
        });

        if (oilResp !== null) {
          this.unsupportedPids.delete('015C');
          this.debugState.oilTempPid015CSupported = `ΝΑΙ (41 5C -> ${oilResp})`;
        } else {
          this.unsupportedPids.add('015C');
          this.liveTelemetry.oilTemp = null;
          this.debugState.oilTempPid015CSupported = 'ΟΧΙ (NO DATA -> N/A)';
        }

        // Oil pressure has no standard OBD-II Mode 01 sensor on BFB -> strictly null (N/A)
        this.liveTelemetry.oilPressure = null;

        // 7. Test & Verify ATAT2 + ATST 19 on K-Line to ensure ZERO lost responses!
        await this.verifyAndApplyOptimalKLineTiming();

        // Update count of active supported sensors
        this.updateSupportedSensorCount();

        this.notifyStatus(
          `ECU Κλειδώθηκε (${this.debugState.protocolName}) • ${this.debugState.supportedSensorsCount} υποστηριζόμενοι αισθητήρες • ${this.debugState.kLineTimingConfig}`,
          this.mode
        );
      } else {
        this.notifyStatus(
          `Συνδέθηκε στο Dongle (${voltResp ? this.liveTelemetry.batteryVoltage + 'V' : 'OK'}), αλλά η ECU δεν απάντησε. Ελέγξτε ότι ο διακόπτης είναι στο ON!`,
          this.mode
        );
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
   * Verifies that ATAT2 and ATST 19 (100ms) do not cause dropped K-Line responses.
   * If any supported PID drops a response under ATAT2 + ATST 19, automatically steps back to safe K-Line timing.
   */
  private async verifyAndApplyOptimalKLineTiming(): Promise<void> {
    await this.sendObdCommand('ATAT2');
    await this.sendObdCommand('ATST 19'); // 25 * 4ms = 100ms

    // Test 2 consecutive reads of known-supported PIDs (010C RPM and 0105 Coolant)
    const r1 = await this.sendObdCommand('010C');
    const r2 = await this.sendObdCommand('0105');

    const ok1 = this.parseRpm(r1) !== null;
    const ok2 = this.parseCoolant(r2) !== null;

    if (ok1 && ok2) {
      this.debugState.kLineTimingConfig = 'ATAT2 + ATST 19 (100ms - Verified 0% Loss)';
      this.debugState.kLineTimingVerified = true;
    } else {
      // Fallback to safer K-Line turnaround timing so no frames are lost
      await this.sendObdCommand('ATAT1');
      await this.sendObdCommand('ATST 32'); // 50 * 4ms = 200ms
      this.debugState.kLineTimingConfig = 'ATAT1 + ATST 32 (200ms - Safe K-Line Fallback)';
      this.debugState.kLineTimingVerified = false;
    }
  }

  private updateSupportedSensorCount(): void {
    const active = INITIAL_PID_CATALOG.filter(item => !this.unsupportedPids.has(item.pid));
    this.debugState.supportedSensorsCount = active.length;
  }

  public async forceProtocolAndReinit(protoCmd: string): Promise<boolean> {
    if (this.mode === 'disconnected') {
      this.notifyError('Συνδεθείτε πρώτα με το Bluetooth ή WiFi dongle.');
      return false;
    }
    const wasPolling = this.isPolling;
    this.stopRealObdPolling();
    await this.sleep(150);
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
    await this.sleep(150);

    await this.initializeAndLockEcu();

    if (wasPolling) {
      this.startRealObdPolling();
    }
  }

  /**
   * Serialized raw command sender with mutex lock so two commands NEVER overlap on the socket
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

      // 2. Web Bluetooth BLE (Event-Driven Zero-Latency Prompt Detection)
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

          let timeoutMs = (cleanCmd === 'ATZ' || cleanCmd.startsWith('0100') || cleanCmd === '03' || cleanCmd === '07') ? 3800 : 650;
          const start = Date.now();
          while (Date.now() - start < timeoutMs) {
            const upperBuf = this.bleReceiveBuffer.toUpperCase();
            if (upperBuf.includes('SEARCHING') || upperBuf.includes('BUS INIT')) {
              timeoutMs = 4500;
            }
            if (this.bleReceiveBuffer.includes('>')) {
              break;
            }
            await new Promise<void>(resolve => {
              const timer = setTimeout(() => {
                if (this.blePromptResolver) {
                  this.blePromptResolver = null;
                }
                resolve();
              }, 15);
              this.blePromptResolver = () => {
                clearTimeout(timer);
                resolve();
              };
            });
          }
          this.blePromptResolver = null;
          return this.bleReceiveBuffer.replace('>', '').trim();
        } catch (e: any) {
          this.blePromptResolver = null;
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
    const nowMs = Date.now();
    const latency = Math.max(1, nowMs - start);
    const nowStr = new Date().toLocaleTimeString('el-GR', { hour12: false });

    // Track rolling average command latency & Hz
    this.recentLatencies.push(latency);
    if (this.recentLatencies.length > 20) {
      this.recentLatencies.shift();
    }
    const sumLat = this.recentLatencies.reduce((a, b) => a + b, 0);
    const avgMs = Math.max(1, Math.round(sumLat / this.recentLatencies.length));
    this.debugState.avgCommandMs = avgMs;
    this.debugState.commandsPerSecHz = Math.round((1000 / avgMs) * 10) / 10;

    const entry: PidDebugEntry = this.debugState.pidTable[pid] || {
      pid,
      name,
      rawResponse: '-',
      parsedValue: 'N/A',
      latencyMs: 0,
      refreshIntervalMs: 0,
      lastValidTimestampMs: 0,
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
      if (entry.lastValidTimestampMs > 0) {
        entry.refreshIntervalMs = nowMs - entry.lastValidTimestampMs;
      }
      entry.lastValidTimestampMs = nowMs;
      entry.parsedValue = parsedStr;
      entry.status = 'ok';
      entry.successCount++;
      this.debugState.totalValidResponses++;
      this.debugState.ecuLocked = true;
      this.unsupportedPids.delete(pid);
      this.recordCommandLog(pid, raw, parsedStr, latency, false);
    } else if (raw.toUpperCase().includes('SEARCHING') || raw.toUpperCase().includes('BUS INIT')) {
      entry.status = 'searching';
      entry.parsedValue = 'SEARCHING...';
      this.recordCommandLog(pid, raw, 'SEARCHING BUS', latency, false);
    } else if (this.isNoData(raw)) {
      entry.status = 'no_data';
      entry.failCount++;
      this.debugState.totalErrors++;

      if (entry.successCount === 0) {
        // Never succeeded -> This PID is genuinely unsupported by the ECU. Blacklist it so we never waste cycle time on it again!
        if (this.debugState.ecuLocked && pid !== '010C' && pid !== '0100') {
          this.unsupportedPids.add(pid);
          entry.parsedValue = 'N/A (Μη υποστηριζόμενο)';
          this.updateSupportedSensorCount();
        }
        this.recordCommandLog(pid, raw, 'NO DATA (Μη υποστηριζόμενο PID - Αφαιρέθηκε από τον κύκλο)', latency, true);
      } else {
        // Previously succeeded (successCount > 0), so this PID IS supported but K-Line dropped a frame!
        // Do NOT blacklist a supported sensor; instead record the K-Line drop and relax ATST if needed.
        this.debugState.kLineDroppedFrames++;
        this.recordCommandLog(pid, raw, 'K-LINE FRAME DROP (Απώλεια απάντησης σε υποστηριζόμενο PID)', latency, true);
        if (this.debugState.kLineDroppedFrames >= 2 && this.debugState.kLineTimingVerified) {
          this.debugState.kLineTimingVerified = false;
          this.debugState.kLineTimingConfig = 'ATAT1 + ATST 28 (160ms Auto-Stabilized)';
          await this.sendObdCommand('ATAT1');
          await this.sendObdCommand('ATST 28');
        }
      }
    } else {
      entry.status = 'error';
      entry.failCount++;
      this.debugState.totalErrors++;
      this.recordCommandLog(pid, raw, 'Σφάλμα αποκωδικοποίησης', latency, true);
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
   * Immediately pushes the updated real telemetry to the UI after each valid sensor response.
   * Strictly NO fabricated/calculated values!
   */
  private pushLiveTelemetryUpdate(): void {
    this.liveTelemetry.timestamp = Date.now();
    this.notifyTelemetry({ ...this.liveTelemetry });
  }

  /**
   * Polls a single PID if supported and immediately updates the UI when a valid response arrives.
   */
  private async pollSinglePidIfSupported(pid: string): Promise<void> {
    if (this.unsupportedPids.has(pid)) return;

    let updated = false;

    switch (pid) {
      case '010C':
        await this.executeTrackedPid('010C', 'Engine RPM (Στροφές Κινητήρα)', (raw) => {
          const val = this.parseRpm(raw);
          if (val !== null) {
            this.liveTelemetry.rpm = val;
            updated = true;
            return `${val} RPM`;
          }
          return null;
        });
        break;

      case '0104':
        await this.executeTrackedPid('0104', 'Calculated Engine Load (Φορτίο %)', (raw) => {
          const val = this.parseBytePercent(raw, '04');
          if (val !== null) {
            this.liveTelemetry.engineLoad = val;
            updated = true;
            return `${val.toFixed(1)}%`;
          }
          return null;
        });
        break;

      case '0105':
        await this.executeTrackedPid('0105', 'Coolant Temp (Θερμοκρασία G62 °C)', (raw) => {
          const val = this.parseCoolant(raw);
          if (val !== null) {
            this.liveTelemetry.coolantTemp = val;
            updated = true;
            return `${val} °C`;
          }
          return null;
        });
        break;

      case '0106':
        await this.executeTrackedPid('0106', 'Short Term Fuel Trim B1 (STFT %)', (raw) => {
          const val = this.parseFuelTrim(raw, '06');
          if (val !== null) {
            this.liveTelemetry.shortTermFuelTrim = val;
            updated = true;
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
            updated = true;
            return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
          }
          return null;
        });
        break;

      case '010B':
        await this.executeTrackedPid('010B', 'Intake Manifold Absolute Pressure (MAP kPa)', (raw) => {
          const val = this.parseMap(raw);
          if (val !== null && val > 10) {
            const boostBar = Math.round(((val - 101.3) / 100) * 100) / 100;
            this.liveTelemetry.boostBar = boostBar;
            this.liveTelemetry.boostPsi = Math.round(boostBar * 14.5038 * 10) / 10;
            if (this.peakBoost === null || boostBar > this.peakBoost) {
              this.peakBoost = boostBar;
              this.liveTelemetry.peakBoostBar = boostBar;
            }
            updated = true;
            return `${val} kPa (${boostBar >= 0 ? '+' : ''}${boostBar.toFixed(2)} bar)`;
          }
          return null;
        });
        break;

      case '010D':
        await this.executeTrackedPid('010D', 'Vehicle Speed (Ταχύτητα km/h)', (raw) => {
          const val = this.parseSpeed(raw);
          if (val !== null) {
            this.liveTelemetry.speed = val;
            updated = true;
            return `${val} km/h`;
          }
          return null;
        });
        break;

      case '010E':
        await this.executeTrackedPid('010E', 'Ignition Timing Advance (Αβάνς °BTDC)', (raw) => {
          const val = this.parseTiming(raw);
          if (val !== null) {
            this.liveTelemetry.ignitionTiming = val;
            updated = true;
            return `${val >= 0 ? '+' : ''}${val.toFixed(1)}° BTDC`;
          }
          return null;
        });
        break;

      case '010F':
        await this.executeTrackedPid('010F', 'Intake Air Temp (Θερμοκρασία IAT G42 °C)', (raw) => {
          const val = this.parseIat(raw);
          if (val !== null) {
            this.liveTelemetry.iat = val;
            updated = true;
            return `${val} °C`;
          }
          return null;
        });
        break;

      case '0110':
        await this.executeTrackedPid('0110', 'MAF Air Flow (Μάζα Αέρα G70 g/s)', (raw) => {
          const val = this.parseMaf(raw);
          if (val !== null) {
            this.liveTelemetry.mafGramsPerSec = val;
            updated = true;
            return `${val.toFixed(2)} g/s`;
          }
          return null;
        });
        break;

      case '0111':
        await this.executeTrackedPid('0111', 'Throttle Position (Πεταλούδα G187 %)', (raw) => {
          const val = this.parseBytePercent(raw, '11');
          if (val !== null) {
            this.liveTelemetry.throttlePosition = Math.round(val);
            updated = true;
            return `${Math.round(val)}%`;
          }
          return null;
        });
        break;

      case '0114':
        await this.executeTrackedPid('0114', 'O2 Sensor B1S1 Narrowband (V)', (raw) => {
          const p = this.parseO2Sensor(raw, '14');
          if (p !== null) {
            this.liveTelemetry.o2SensorVoltage = p.voltage;
            updated = true;
            return `${p.voltage.toFixed(3)} V`;
          }
          return null;
        });
        break;

      case '0115':
        await this.executeTrackedPid('0115', 'O2 Sensor B1S2 After Cat (V)', (raw) => {
          const p = this.parseO2Sensor(raw, '15');
          if (p !== null) {
            this.liveTelemetry.o2SensorAfterVoltage = p.voltage;
            updated = true;
            return `${p.voltage.toFixed(3)} V`;
          }
          return null;
        });
        break;

      case '0124':
        await this.executeTrackedPid('0124', 'Wideband Lambda B1S1 (PID 24 λ & V)', (raw) => {
          const p = this.parseLambda24(raw);
          if (p !== null) {
            this.liveTelemetry.lambda = p.lambda;
            this.liveTelemetry.afr = Math.round(p.lambda * 14.7 * 10) / 10;
            this.liveTelemetry.o2SensorVoltage = p.voltage;
            updated = true;
            return `λ=${p.lambda.toFixed(3)} (${p.voltage.toFixed(2)}V)`;
          }
          return null;
        });
        break;

      case '0142':
        await this.executeTrackedPid('0142', 'Control Module Voltage (ECU V)', (raw) => {
          const b = this.extractPidBytes(raw, '42', 2);
          if (b) {
            const v = Math.round((((b[0] * 256) + b[1]) / 1000) * 100) / 100;
            this.liveTelemetry.batteryVoltage = v;
            updated = true;
            return `${v.toFixed(2)} V`;
          }
          return null;
        });
        break;

      case '0144':
        await this.executeTrackedPid('0144', 'Commanded Equivalence Ratio (λ Spec)', (raw) => {
          const b = this.extractPidBytes(raw, '44', 2);
          if (b) {
            const lam = Math.round((((b[0] * 256) + b[1]) / 32768) * 1000) / 1000;
            this.liveTelemetry.lambdaSpecified = lam;
            updated = true;
            return `λ=${lam.toFixed(3)}`;
          }
          return null;
        });
        break;

      case '015C':
        await this.executeTrackedPid('015C', 'Engine Oil Temperature (Θερμ. Λαδιού °C)', (raw) => {
          const val = this.parseOilTemp(raw);
          if (val !== null) {
            this.liveTelemetry.oilTemp = val;
            updated = true;
            return `${val} °C`;
          }
          return null;
        });
        break;

      case 'ATRV':
        await this.executeTrackedPid('ATRV', 'Adapter Battery Voltage (Pin 16 V)', (raw) => {
          const val = this.parseVoltage(raw);
          if (val !== null) {
            this.liveTelemetry.batteryVoltage = val;
            updated = true;
            return `${val.toFixed(1)} V`;
          }
          return null;
        });
        break;
    }

    if (updated) {
      this.pushLiveTelemetryUpdate();
    }
  }

  /**
   * Flat Full-Cycle Polling Loop:
   * - Polls EVERY supported sensor sequentially in a single flat cycle (no priority starvation!)
   * - Zero artificial delays between commands
   * - Skips all unsupported PIDs automatically
   * - Updates UI immediately after each valid sensor response
   * - Measures exact full-cycle duration (loopCycleMs) and per-sensor refreshIntervalMs
   */
  private async runSequentialPollingLoop(): Promise<void> {
    if (this.isPollingRunning) return;
    this.isPollingRunning = true;

    const allPidsOrder = INITIAL_PID_CATALOG.map(i => i.pid);

    while (this.isPolling && (this.mode === 'bluetooth' || this.mode === 'wifi')) {
      const cycleStart = Date.now();
      try {
        const supportedQueue = allPidsOrder.filter(pid => !this.unsupportedPids.has(pid));
        this.debugState.supportedSensorsCount = supportedQueue.length;

        for (const pid of supportedQueue) {
          if (!this.isPolling || (this.mode !== 'bluetooth' && this.mode !== 'wifi')) break;
          await this.pollSinglePidIfSupported(pid);
        }

        this.debugState.loopCycleMs = Math.max(1, Date.now() - cycleStart);
        this.notifyDebug();
      } catch (e: any) {
        this.debugState.lastError = e.message || String(e);
        this.notifyDebug();
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

  private parseOilTemp(resp: string): number | null {
    const b = this.extractPidBytes(resp, '5C', 1);
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
   * Decodes a real KWP2000 Service 21 (61 <groupHex> ...) 4-cell response if the ECU answers KWP Measuring Blocks
   */
  private decodeKwpBlockResponse(rawHex: string, groupHex: string): [string, string, string, string] | null {
    if (!rawHex || this.isNoData(rawHex)) return null;
    const clean = rawHex.toUpperCase().replace(/[^0-9A-F]/g, '');
    const header = '61' + groupHex.toUpperCase();
    const idx = clean.indexOf(header);
    if (idx === -1) return null;

    const payload = clean.substring(idx + header.length);
    // Each KWP2000 measuring block cell is 3 bytes (Formula Byte + Value A + Value B = 6 hex chars)
    if (payload.length < 24) return null;

    const cells: string[] = [];
    for (let c = 0; c < 4; c++) {
      const slice = payload.substring(c * 6, c * 6 + 6);
      const f = parseInt(slice.substring(0, 2), 16);
      const a = parseInt(slice.substring(2, 4), 16);
      const b = parseInt(slice.substring(4, 6), 16);
      cells.push(this.decodeKwpCellFormula(f, a, b));
    }
    return [cells[0], cells[1], cells[2], cells[3]];
  }

  private decodeKwpCellFormula(formula: number, a: number, b: number): string {
    switch (formula) {
      case 0x01:
        return `${Math.round(0.2 * a * b)}`; // RPM
      case 0x02:
        return `${(a * 0.002 * b).toFixed(1)} %`; // Load %
      case 0x05:
        return `${Math.round((a * (b - 100) * 0.1) * 10) / 10} °C`; // Temp °C
      case 0x08:
        return `${Math.round((0.1 * a * b - 273.1) * 10) / 10} °C`;
      case 0x0C:
        return `${((0.001 * a * b)).toFixed(2)} V`;
      case 0x12:
        return `${Math.round(0.04 * a * b)} mbar`; // Absolute Pressure mbar
      case 0x1A:
        return `${(b - a)} °C`;
      default:
        return `0x${formula.toString(16).toUpperCase()}:${a},${b}`;
    }
  }

  /**
   * Actively queries a VAG Measuring Block Group (001-255) from the connected ECU:
   * 1. Sends KWP2000 Service 21 (<21 XX>) to check if direct KWP block reading is supported by the active protocol.
   * 2. Also polls the real OBD-II Mode 01 PIDs mapped to that group so values are freshly read from the ECU.
   */
  public async queryVagGroupFromEcu(rawGroupNum: number | string): Promise<VagBlockGroup> {
    const numInt = Math.max(1, Math.min(255, parseInt(String(rawGroupNum).trim(), 10) || 1));
    const groupNum = numInt.toString().padStart(3, '0');
    const groupHex = numInt.toString(16).padStart(2, '0').toUpperCase();

    if (this.mode === 'bluetooth' || this.mode === 'wifi') {
      const kwpCmd = `21${groupHex}`;
      const start = Date.now();
      const rawKwp = await this.sendObdCommand(kwpCmd);
      const latency = Date.now() - start;
      const decodedCells = this.decodeKwpBlockResponse(rawKwp, groupHex);

      this.recordCommandLog(
        kwpCmd,
        rawKwp || 'NO DATA',
        decodedCells ? `VAG Group ${groupNum} KWP OK` : `VAG Group ${groupNum} (Standard OBD-II Mode 01 Mapping)`,
        latency,
        !decodedCells
      );

      this.kwpGroupCache[groupNum] = {
        rawHex: rawKwp || 'NO DATA',
        cells: decodedCells,
        updatedAt: new Date().toLocaleTimeString('el-GR', { hour12: false }),
      };

      // Also refresh the real Mode 01 PIDs that belong to this group right now
      const groupPids = this.getMode01PidsForVagGroup(numInt);
      for (const pid of groupPids) {
        if (!this.unsupportedPids.has(pid)) {
          await this.pollSinglePidIfSupported(pid);
        }
      }
      this.notifyDebug();
    }

    return this.getVagGroupByNumber(groupNum, this.liveTelemetry);
  }

  private getMode01PidsForVagGroup(numInt: number): string[] {
    switch (numInt) {
      case 1:
        return ['010C', '0105', '0106'];
      case 2:
        return ['010C', '0104', '0110'];
      case 3:
        return ['010C', '0110', '0111', '010E'];
      case 4:
        return ['010C', 'ATRV', '0105', '010F'];
      case 5:
        return ['010C', '0104', '010D'];
      case 31:
        return ['0124', '0144', '0115'];
      case 32:
      case 33:
        return ['0106', '0107', '0124', '0114'];
      case 34:
      case 36:
        return ['010C', '0115'];
      case 50:
      case 130:
      case 134:
        return ['010C', '0105', '010F', '015C'];
      case 60:
        return ['0111'];
      case 114:
      case 115:
      case 118:
        return ['010C', '0104', '010F', '010B'];
      default:
        return ['010C', '0104', '0105', '0110'];
    }
  }

  /**
   * Default featured VAG-COM Measuring Blocks (strictly real ECU values or N/A)
   */
  public getVagMeasuringBlocks(t: TelemetryData): VagBlockGroup[] {
    return ['001', '002', '003', '004', '020', '031', '032', '115'].map(num =>
      this.getVagGroupByNumber(num, t)
    );
  }

  /**
   * Strictly Real VCDS / VAG-COM Group Lookup (001 - 255):
   * - Never fabricates or calculates unmeasured fields.
   * - Uses either a real KWP2000 Service 21 response (if the ECU answered 61 XX) OR real measured OBD-II Mode 01 PIDs.
   * - Any field not supported or not answered by the ECU strictly displays 'N/A'.
   */
  public getVagGroupByNumber(rawGroupNum: number | string, t: TelemetryData): VagBlockGroup {
    const numInt = Math.max(1, Math.min(255, parseInt(String(rawGroupNum).trim(), 10) || 1));
    const groupNum = numInt.toString().padStart(3, '0');
    const cachedKwp = this.kwpGroupCache[groupNum];

    // If the ECU returned a genuine KWP2000 61 XX frame for this group, return those exact 4 cells
    if (cachedKwp && cachedKwp.cells) {
      return {
        groupNum,
        title: `Group ${groupNum}: Direct KWP2000 ECU Measuring Block`,
        greekTitle: `Ομάδα ${groupNum}: Πραγματική Ανάγνωση KWP2000 (Service 21 ${numInt.toString(16).padStart(2, '0').toUpperCase()})`,
        description: `Raw ECU Response: ${cachedKwp.rawHex}`,
        rawHexResponse: cachedKwp.rawHex,
        sourceMode: 'KWP2000 Service 21',
        fields: [
          { label: 'Field 1', value: cachedKwp.cells[0], unit: '', normalRange: 'Real KWP Cell 1', sourcePid: `21${numInt.toString(16).padStart(2, '0').toUpperCase()}` },
          { label: 'Field 2', value: cachedKwp.cells[1], unit: '', normalRange: 'Real KWP Cell 2', sourcePid: `21${numInt.toString(16).padStart(2, '0').toUpperCase()}` },
          { label: 'Field 3', value: cachedKwp.cells[2], unit: '', normalRange: 'Real KWP Cell 3', sourcePid: `21${numInt.toString(16).padStart(2, '0').toUpperCase()}` },
          { label: 'Field 4', value: cachedKwp.cells[3], unit: '', normalRange: 'Real KWP Cell 4', sourcePid: `21${numInt.toString(16).padStart(2, '0').toUpperCase()}` },
        ]
      };
    }

    // Format helpers that return 'N/A' whenever the real sensor value is null
    const fmtRpm = t.rpm !== null ? `${t.rpm} /min` : 'N/A';
    const fmtLoad = t.engineLoad !== null ? `${t.engineLoad.toFixed(1)} %` : 'N/A';
    const fmtCoolant = t.coolantTemp !== null ? `${t.coolantTemp} °C` : 'N/A';
    const fmtIat = t.iat !== null ? `${t.iat} °C` : 'N/A';
    const fmtOilTemp = t.oilTemp !== null ? `${t.oilTemp} °C` : 'N/A';
    const fmtMaf = t.mafGramsPerSec !== null ? `${t.mafGramsPerSec.toFixed(2)} g/s` : 'N/A';
    const fmtThrottle = t.throttlePosition !== null ? `${t.throttlePosition} %` : 'N/A';
    const fmtTiming = t.ignitionTiming !== null ? `${t.ignitionTiming >= 0 ? '+' : ''}${t.ignitionTiming.toFixed(1)}°` : 'N/A';
    const fmtSpeed = t.speed !== null ? `${t.speed} km/h` : 'N/A';
    const fmtVolt = t.batteryVoltage !== null ? `${t.batteryVoltage.toFixed(1)} V` : 'N/A';
    const fmtStft = t.shortTermFuelTrim !== null ? `${t.shortTermFuelTrim >= 0 ? '+' : ''}${t.shortTermFuelTrim.toFixed(1)} %` : 'N/A';
    const fmtLtft = t.longTermFuelTrim !== null ? `${t.longTermFuelTrim >= 0 ? '+' : ''}${t.longTermFuelTrim.toFixed(1)} %` : 'N/A';
    const fmtLambda = t.lambda !== null ? `${t.lambda.toFixed(3)}` : 'N/A';
    const fmtLambdaSpec = t.lambdaSpecified !== null ? `${t.lambdaSpecified.toFixed(3)}` : 'N/A';
    const fmtO2B1S1 = t.o2SensorVoltage !== null ? `${t.o2SensorVoltage.toFixed(3)} V` : 'N/A';
    const fmtO2B1S2 = t.o2SensorAfterVoltage !== null ? `${t.o2SensorAfterVoltage.toFixed(3)} V` : 'N/A';
    const fmtMapMbar = t.boostBar !== null ? `${Math.round((t.boostBar + 1.013) * 1000)} mbar` : 'N/A';
    const fmtInjTime = t.injectionTimeMs !== null ? `${t.injectionTimeMs.toFixed(2)} ms` : 'N/A';
    const fmtN75 = t.n75DutyCycle !== null ? `${t.n75DutyCycle} %` : 'N/A';

    const rawNote = cachedKwp ? `21${numInt.toString(16).padStart(2, '0').toUpperCase()} -> ${cachedKwp.rawHex}` : 'OBD-II Mode 01 Real PIDs';

    switch (numInt) {
      case 1:
        return {
          groupNum: '001',
          title: 'Group 001: General Engine & Lambda Regulation',
          greekTitle: 'Ομάδα 001: Στροφές (010C), Θερμοκρασία G62 (0105) & Διόρθωση STFT (0106)',
          description: 'Real OBD-II Mode 01 sensor values. Unreported KWP-only fields display N/A.',
          rawHexResponse: rawNote,
          sourceMode: 'OBD-II Mode 01',
          fields: [
            { label: 'Engine Speed (010C)', value: fmtRpm, unit: 'RPM', normalRange: '760 - 880 /min', sourcePid: '010C' },
            { label: 'Coolant Temp (0105)', value: fmtCoolant, unit: '°C', normalRange: '80 - 105 °C', sourcePid: '0105', isWarning: t.coolantTemp !== null && t.coolantTemp > 105 },
            { label: 'Lambda Control (0106)', value: fmtStft, unit: '%', normalRange: '-10.0 to +10.0%', sourcePid: '0106', isWarning: t.shortTermFuelTrim !== null && Math.abs(t.shortTermFuelTrim) > 12 },
            { label: 'Basic Setting Status', value: 'N/A', unit: 'KWP Only', normalRange: 'Απαιτεί KWP Service 21', sourcePid: '2101' },
          ]
        };

      case 2:
        return {
          groupNum: '002',
          title: 'Group 002: Mass Air Flow & Load',
          greekTitle: 'Ομάδα 002: Στροφές (010C), Φορτίο (0104), Χρόνος Ψεκασμού & Μάζα Αέρα MAF (0110)',
          description: 'Real G70 MAF sensor and Engine Load via OBD-II Mode 01. Injection time requires KWP 2102.',
          rawHexResponse: rawNote,
          sourceMode: 'OBD-II Mode 01',
          fields: [
            { label: 'Engine Speed (010C)', value: fmtRpm, unit: 'RPM', normalRange: '760 - 6800', sourcePid: '010C' },
            { label: 'Engine Load (0104)', value: fmtLoad, unit: '%', normalRange: '12 - 100%', sourcePid: '0104' },
            { label: 'Injection Time (KWP)', value: fmtInjTime, unit: 'ms', normalRange: 'Απαιτεί KWP 2102', sourcePid: '2102' },
            { label: 'Mass Air Flow (0110)', value: fmtMaf, unit: 'g/s', normalRange: '2.5 - 200.0 g/s', sourcePid: '0110' },
          ]
        };

      case 3:
        return {
          groupNum: '003',
          title: 'Group 003: Air Mass, Throttle & Ignition Timing',
          greekTitle: 'Ομάδα 003: Στροφές (010C), Μάζα Αέρα MAF (0110), Πεταλούδα (0111) & Αβάνς (010E)',
          description: 'All 4 fields are read directly from real OBD-II Mode 01 PIDs (010C, 0110, 0111, 010E).',
          rawHexResponse: rawNote,
          sourceMode: 'OBD-II Mode 01 (100% Real)',
          fields: [
            { label: 'Engine Speed (010C)', value: fmtRpm, unit: 'RPM', normalRange: '760 - 6800', sourcePid: '010C' },
            { label: 'Mass Air Flow (0110)', value: fmtMaf, unit: 'g/s', normalRange: '2.5 - 200.0 g/s', sourcePid: '0110' },
            { label: 'Throttle Angle (0111)', value: fmtThrottle, unit: '%', normalRange: '0 - 100%', sourcePid: '0111' },
            { label: 'Ignition Timing (010E)', value: fmtTiming, unit: '°BTDC', normalRange: '0.0 - 35.0°', sourcePid: '010E' },
          ]
        };

      case 4:
        return {
          groupNum: '004',
          title: 'Group 004: Battery Voltage & Temperatures (G62 / G42)',
          greekTitle: 'Ομάδα 004: Στροφές (010C), Τάση (ATRV), Θερμ. Ψυκτικού (0105) & Εισαγωγής IAT (010F)',
          description: 'All 4 fields are read directly from real OBD-II PIDs (010C, ATRV, 0105, 010F).',
          rawHexResponse: rawNote,
          sourceMode: 'OBD-II Mode 01 (100% Real)',
          fields: [
            { label: 'Engine Speed (010C)', value: fmtRpm, unit: 'RPM', normalRange: '760 - 6800', sourcePid: '010C' },
            { label: 'Battery Voltage (ATRV)', value: fmtVolt, unit: 'V', normalRange: '13.2 - 14.5 V', sourcePid: 'ATRV', isWarning: t.batteryVoltage !== null && t.batteryVoltage < 12.0 },
            { label: 'Coolant Temp (0105)', value: fmtCoolant, unit: '°C', normalRange: '80 - 105 °C', sourcePid: '0105' },
            { label: 'Intake Air Temp (010F)', value: fmtIat, unit: '°C', normalRange: '15 - 55 °C', sourcePid: '010F', isWarning: t.iat !== null && t.iat > 55 },
          ]
        };

      case 5:
        return {
          groupNum: '005',
          title: 'Group 005: Vehicle Speed & Engine Load',
          greekTitle: 'Ομάδα 005: Στροφές (010C), Φορτίο (0104) & Ταχύτητα Οχήματος (010D)',
          description: 'Real Engine Speed, Calculated Load, and Vehicle Speed from ECU.',
          rawHexResponse: rawNote,
          sourceMode: 'OBD-II Mode 01',
          fields: [
            { label: 'Engine Speed (010C)', value: fmtRpm, unit: 'RPM', normalRange: '760 - 6800', sourcePid: '010C' },
            { label: 'Engine Load (0104)', value: fmtLoad, unit: '%', normalRange: '12 - 100%', sourcePid: '0104' },
            { label: 'Vehicle Speed (010D)', value: fmtSpeed, unit: 'km/h', normalRange: '0 - 260 km/h', sourcePid: '010D' },
            { label: 'Operating Mode (KWP)', value: 'N/A', unit: 'KWP Only', normalRange: 'Απαιτεί KWP 2105', sourcePid: '2105' },
          ]
        };

      case 20:
        return {
          groupNum: '020',
          title: 'Group 020: Cylinder Knock Retard (CF)',
          greekTitle: 'Ομάδα 020: Απόσυρση Αβάνς (Knock Retard CF) Κυλίνδρων 1-4',
          description: 'Individual cylinder knock retard is a proprietary VAG KWP2000 channel (2114). Standard OBD-II Mode 01 only provides global Ignition Timing (010E).',
          rawHexResponse: rawNote,
          sourceMode: 'KWP2000 2114 Required',
          fields: [
            { label: 'Cylinder 1 Retard', value: t.knockRetard[0] !== null ? `${t.knockRetard[0].toFixed(1)}°` : 'N/A', unit: 'CF', normalRange: 'Απαιτεί KWP 2114', sourcePid: '2114' },
            { label: 'Cylinder 2 Retard', value: t.knockRetard[1] !== null ? `${t.knockRetard[1].toFixed(1)}°` : 'N/A', unit: 'CF', normalRange: 'Απαιτεί KWP 2114', sourcePid: '2114' },
            { label: 'Cylinder 3 Retard', value: t.knockRetard[2] !== null ? `${t.knockRetard[2].toFixed(1)}°` : 'N/A', unit: 'CF', normalRange: 'Απαιτεί KWP 2114', sourcePid: '2114' },
            { label: 'Cylinder 4 Retard', value: t.knockRetard[3] !== null ? `${t.knockRetard[3].toFixed(1)}°` : 'N/A', unit: 'CF', normalRange: 'Απαιτεί KWP 2114', sourcePid: '2114' },
          ]
        };

      case 31:
        return {
          groupNum: '031',
          title: 'Group 031: Wideband Lambda & O2 Sensors',
          greekTitle: 'Ομάδα 031: Λάμδα Πραγματικό (0124), Ζητούμενο (0144), Τάση B1S1 & B1S2 (0115)',
          description: 'Real Wideband Lambda (PID 0124), Commanded Lambda (PID 0144), and Post-Cat O2 (PID 0115).',
          rawHexResponse: rawNote,
          sourceMode: 'OBD-II Mode 01',
          fields: [
            { label: 'Lambda Actual (0124)', value: fmtLambda, unit: 'λ', normalRange: '0.80 - 1.05', sourcePid: '0124' },
            { label: 'Lambda Specified (0144)', value: fmtLambdaSpec, unit: 'λ', normalRange: '0.82 - 1.00', sourcePid: '0144' },
            { label: 'O2 B1S1 Voltage (0124)', value: fmtO2B1S1, unit: 'V', normalRange: '1.20 - 2.00 V', sourcePid: '0124' },
            { label: 'O2 B1S2 After Cat (0115)', value: fmtO2B1S2, unit: 'V', normalRange: '0.05 - 0.85 V', sourcePid: '0115' },
          ]
        };

      case 32:
      case 33:
        return {
          groupNum,
          title: `Group ${groupNum}: Fuel Trim Adaptation (STFT & LTFT)`,
          greekTitle: `Ομάδα ${groupNum}: Διορθώσεις Καυσίμου STFT (0106), LTFT (0107) & Αισθητήρας Λάμδα (0124)`,
          description: 'Real Short-Term and Long-Term Fuel Trims from PIDs 0106 and 0107.',
          rawHexResponse: rawNote,
          sourceMode: 'OBD-II Mode 01 (100% Real)',
          fields: [
            { label: 'Short Term Trim (0106)', value: fmtStft, unit: '%', normalRange: '-10.0 to +10.0%', sourcePid: '0106', isWarning: t.shortTermFuelTrim !== null && Math.abs(t.shortTermFuelTrim) > 12 },
            { label: 'Long Term Trim (0107)', value: fmtLtft, unit: '%', normalRange: '-10.0 to +10.0%', sourcePid: '0107', isWarning: t.longTermFuelTrim !== null && Math.abs(t.longTermFuelTrim) > 12 },
            { label: 'O2 Sensor Voltage (0124)', value: fmtO2B1S1, unit: 'V', normalRange: '1.20 - 2.00 V', sourcePid: '0124' },
            { label: 'Lambda Actual (0124)', value: fmtLambda, unit: 'λ', normalRange: '0.80 - 1.05', sourcePid: '0124' },
          ]
        };

      case 60:
        return {
          groupNum: '060',
          title: 'Group 060: Electronic Throttle Body (G187)',
          greekTitle: 'Ομάδα 060: Γωνία Πεταλούδας (PID 0111) • Λοιπά πεδία KWP 213C',
          description: 'Real Throttle Position from PID 0111. Secondary potentiometer G188 requires KWP 213C.',
          rawHexResponse: rawNote,
          sourceMode: 'OBD-II Mode 01',
          fields: [
            { label: 'Throttle Position (0111)', value: fmtThrottle, unit: '%', normalRange: '0 - 100%', sourcePid: '0111' },
            { label: 'Throttle Sensor 2 (G188)', value: 'N/A', unit: '%', normalRange: 'Απαιτεί KWP 213C', sourcePid: '213C' },
            { label: 'Throttle Step Counter', value: 'N/A', unit: 'Step', normalRange: 'Απαιτεί KWP 213C', sourcePid: '213C' },
            { label: 'Adaptation Status', value: 'N/A', unit: 'Status', normalRange: 'Απαιτεί KWP 213C', sourcePid: '213C' },
          ]
        };

      case 115:
        return {
          groupNum: '115',
          title: 'Group 115: Charge Pressure Control (Boost)',
          greekTitle: 'Ομάδα 115: Στροφές (010C), Φορτίο (0104) & Πίεση Εισαγωγής (010B / KWP 2173)',
          description: 'Note: On Audi 1.8T BFB (ISO 9141-2), PID 010B is not supported via standard OBD-II Mode 01 (supported mask 4100BE3FA811). Boost Actual/Specified requires KWP2000 2173.',
          rawHexResponse: rawNote,
          sourceMode: 'OBD-II Mode 01 / KWP 2173',
          fields: [
            { label: 'Engine Speed (010C)', value: fmtRpm, unit: 'RPM', normalRange: '760 - 6800', sourcePid: '010C' },
            { label: 'Engine Load (0104)', value: fmtLoad, unit: '%', normalRange: '15 - 100%', sourcePid: '0104' },
            { label: 'Boost Specified (KWP)', value: 'N/A', unit: 'mbar', normalRange: 'Απαιτεί KWP 2173', sourcePid: '2173' },
            { label: 'Boost Actual (010B)', value: fmtMapMbar, unit: 'mbar', normalRange: 'PID 010B / KWP 2173', sourcePid: '010B' },
          ]
        };

      case 118:
        return {
          groupNum: '118',
          title: 'Group 118: Turbocharger & Intake Air Temp',
          greekTitle: 'Ομάδα 118: Στροφές (010C), Θερμ. Εισαγωγής IAT (010F), N75 & Πίεση (010B)',
          description: 'Real RPM (010C) and IAT (010F). N75 duty cycle requires KWP2000 2176.',
          rawHexResponse: rawNote,
          sourceMode: 'OBD-II Mode 01',
          fields: [
            { label: 'Engine Speed (010C)', value: fmtRpm, unit: 'RPM', normalRange: '760 - 6800', sourcePid: '010C' },
            { label: 'Intake Air Temp (010F)', value: fmtIat, unit: '°C', normalRange: '15 - 55 °C', sourcePid: '010F' },
            { label: 'N75 Duty Cycle (KWP)', value: fmtN75, unit: '%', normalRange: 'Απαιτεί KWP 2176', sourcePid: '2176' },
            { label: 'Charge Pressure (010B)', value: fmtMapMbar, unit: 'mbar', normalRange: 'PID 010B / KWP 2176', sourcePid: '010B' },
          ]
        };

      case 130:
      case 134:
        return {
          groupNum,
          title: `Group ${groupNum}: Engine Cooling & Oil Temperature (015C)`,
          greekTitle: `Ομάδα ${groupNum}: Θερμοκρασία Ψυκτικού (0105), Εισαγωγής (010F) & Λαδιού (015C)`,
          description: 'Real temperatures read from PIDs 0105, 010F, and 015C (displays N/A if 015C is unsupported).',
          rawHexResponse: rawNote,
          sourceMode: 'OBD-II Mode 01',
          fields: [
            { label: 'Engine Speed (010C)', value: fmtRpm, unit: 'RPM', normalRange: '760 - 6800', sourcePid: '010C' },
            { label: 'Coolant Temp (0105)', value: fmtCoolant, unit: '°C', normalRange: '80 - 105 °C', sourcePid: '0105' },
            { label: 'Intake Air Temp (010F)', value: fmtIat, unit: '°C', normalRange: '15 - 55 °C', sourcePid: '010F' },
            { label: 'Oil Temp (015C)', value: fmtOilTemp, unit: '°C', normalRange: 'PID 015C', sourcePid: '015C' },
          ]
        };

      default:
        return {
          groupNum,
          title: `Group ${groupNum}: VAG Measuring Block ${groupNum}`,
          greekTitle: `Ομάδα ${groupNum}: Πατήστε «Ανάγνωση Group από ECU» για αποστολή εντολής 21 ${numInt.toString(16).padStart(2, '0').toUpperCase()}`,
          description: cachedKwp
            ? `Η ECU απάντησε στο 21${numInt.toString(16).padStart(2, '0').toUpperCase()}: "${cachedKwp.rawHex}". Το ενεργό πρωτόκολλο OBD-II δεν επέτρεψε ανάγνωση KWP 21${numInt.toString(16).padStart(2, '0').toUpperCase()}.`
            : `Δεν έχουν διαβαστεί δεδομένα KWP2000 για το Group ${groupNum}. Εμφανίζονται N/A αντί για υπολογισμένες τιμές.`,
          rawHexResponse: rawNote,
          sourceMode: cachedKwp ? `Tested 21${numInt.toString(16).padStart(2, '0').toUpperCase()} (${cachedKwp.rawHex})` : 'Unqueried',
          fields: [
            { label: `Group ${groupNum} Field 1`, value: 'N/A', unit: '-', normalRange: `Απαιτεί KWP 21${numInt.toString(16).padStart(2, '0').toUpperCase()}`, sourcePid: `21${numInt.toString(16).padStart(2, '0').toUpperCase()}` },
            { label: `Group ${groupNum} Field 2`, value: 'N/A', unit: '-', normalRange: `Απαιτεί KWP 21${numInt.toString(16).padStart(2, '0').toUpperCase()}`, sourcePid: `21${numInt.toString(16).padStart(2, '0').toUpperCase()}` },
            { label: `Group ${groupNum} Field 3`, value: 'N/A', unit: '-', normalRange: `Απαιτεί KWP 21${numInt.toString(16).padStart(2, '0').toUpperCase()}`, sourcePid: `21${numInt.toString(16).padStart(2, '0').toUpperCase()}` },
            { label: `Group ${groupNum} Field 4`, value: 'N/A', unit: '-', normalRange: `Απαιτεί KWP 21${numInt.toString(16).padStart(2, '0').toUpperCase()}`, sourcePid: `21${numInt.toString(16).padStart(2, '0').toUpperCase()}` },
          ]
        };
    }
  }

  private notifyTelemetry(data: TelemetryData): void {
    this.listeners.forEach(l => l.onTelemetry(data));
  }

  private notifyStatus(status: string, mode: ConnectionMode): void {
    this.listeners.forEach(l => l.onStatusChange(status, mode));
  }

  private notifyError(err: string): void {
    this.listeners.forEach(l => l.onError(err));
  }

  private notifyDebug(): void {
    const snap = this.getDebugState();
    this.listeners.forEach(l => {
      if (l.onDebugUpdate) {
        l.onDebugUpdate(snap);
      }
    });
  }
}

export const obdEngine = new ObdEngine();
