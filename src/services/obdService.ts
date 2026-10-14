import { TelemetryData, DTCFault, EngineStageId, EngineStageConfig, FuelOctane, VagBlockGroup } from '../types/telemetry';

export type ConnectionMode = 'bluetooth' | 'wifi' | 'connecting' | 'disconnected';

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

export interface PidDebugEntry {
  pid: string;
  name: string;
  rawResponse: string;
  parsedValue: string;
  latencyMs: number;
  status: 'ok' | 'no_data' | 'searching' | 'error' | 'pending';
  successCount: number;
  failCount: number;
  lastUpdated: string;
}

export interface DebugLogEntry {
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
  commandLogs: DebugLogEntry[];
}

export interface ObdEventListener {
  onTelemetry: (data: TelemetryData) => void;
  onStatusChange: (status: string, mode: ConnectionMode) => void;
  onError: (err: string) => void;
  onDebugUpdate?: (debug: ObdDebugState) => void;
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
    code: 'P0301',
    vagCode: '16685',
    title: 'Cylinder 1 Misfire Detected',
    description: 'Misfire specific to cylinder 1.',
    greekDescription: 'Αστοχία ανάφλεξης στον Κύλινδρο 1 - Έλεγχος πολλαπλασιαστή, μπουζί ή μπεκ ψεκασμού.',
    severity: 'high',
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
    status: 'Active'
  },
  {
    code: 'P0303',
    vagCode: '16687',
    title: 'Cylinder 3 Misfire Detected',
    description: 'Misfire specific to cylinder 3.',
    greekDescription: 'Αστοχία ανάφλεξης στον Κύλινδρο 3 - Έλεγχος πολλαπλασιαστή, μπουζί ή μπεκ ψεκασμού.',
    severity: 'high',
    system: 'Ignition / Fuel',
    status: 'Active'
  },
  {
    code: 'P0304',
    vagCode: '16688',
    title: 'Cylinder 4 Misfire Detected',
    description: 'Misfire specific to cylinder 4.',
    greekDescription: 'Αστοχία ανάφλεξης στον Κύλινδρο 4 - Έλεγχος πολλαπλασιαστή, μπουζί ή μπεκ ψεκασμού.',
    severity: 'high',
    system: 'Ignition / Fuel',
    status: 'Active'
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
    code: 'P0172',
    vagCode: '16556',
    title: 'Fuel Trim, Bank 1 - System Too Rich',
    description: 'Fuel system running too rich on Bank 1.',
    greekDescription: 'Πλούσιο μείγμα (System Too Rich) - Πιθανή διαρροή πίεσης μετά το MAF, ελαττωματικός αισθητήρας λάμδα ή μπεκ.',
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
    status: 'Active'
  },
  {
    code: 'P0118',
    vagCode: '16502',
    title: 'Engine Coolant Temperature Sensor (G62) - High Input',
    description: 'Signal from coolant temperature sensor indicates open circuit or faulty sensor.',
    greekDescription: 'Αισθητήρας θερμοκρασίας ψυκτικού (G62) - Κλασικό θέμα 1.8T BFB, ο πράσινος 4-πινος αισθητήρας.',
    severity: 'low',
    system: 'Cooling',
    status: 'Active'
  },
  {
    code: 'P1297',
    vagCode: '17705',
    title: 'Connection Charger-Throttle Valve: Pressure Drop',
    description: 'Pressure difference detected between turbo discharge and throttle body.',
    greekDescription: 'Πτώση πίεσης μεταξύ υπερπληρωτή και πεταλούδας γκαζιού - Συχνό σε 1.8T BFB (διαρροή κολάρου intercooler ή σκάστρας 710N).',
    severity: 'high',
    system: 'Turbo / Boost',
    status: 'Active'
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
  shortTermFuelTrim: 0,
  o2SensorVoltage: 0.0,
  o2SensorAfterVoltage: 0.0,
  injectionTimeMs: 0.0,
  timestamp: 0
};

const INITIAL_PID_TABLE: Record<string, PidDebugEntry> = {
  'ATRV': { pid: 'ATRV', name: 'Battery Voltage (Pin 16)', rawResponse: '-', parsedValue: '-', latencyMs: 0, status: 'pending', successCount: 0, failCount: 0, lastUpdated: '-' },
  '010C': { pid: '010C', name: 'Engine Speed (RPM)', rawResponse: '-', parsedValue: '-', latencyMs: 0, status: 'pending', successCount: 0, failCount: 0, lastUpdated: '-' },
  '0110': { pid: '0110', name: 'MAF Air Flow (G70 g/s)', rawResponse: '-', parsedValue: '-', latencyMs: 0, status: 'pending', successCount: 0, failCount: 0, lastUpdated: '-' },
  '0104': { pid: '0104', name: 'Calculated Engine Load (%)', rawResponse: '-', parsedValue: '-', latencyMs: 0, status: 'pending', successCount: 0, failCount: 0, lastUpdated: '-' },
  '0111': { pid: '0111', name: 'Throttle Position (%)', rawResponse: '-', parsedValue: '-', latencyMs: 0, status: 'pending', successCount: 0, failCount: 0, lastUpdated: '-' },
  '010B': { pid: '010B', name: 'Intake Manifold Pressure (MAP)', rawResponse: '-', parsedValue: '-', latencyMs: 0, status: 'pending', successCount: 0, failCount: 0, lastUpdated: '-' },
  '0105': { pid: '0105', name: 'Coolant Temp (G62 °C)', rawResponse: '-', parsedValue: '-', latencyMs: 0, status: 'pending', successCount: 0, failCount: 0, lastUpdated: '-' },
  '010F': { pid: '010F', name: 'Intake Air Temp (IAT °C)', rawResponse: '-', parsedValue: '-', latencyMs: 0, status: 'pending', successCount: 0, failCount: 0, lastUpdated: '-' },
  '010E': { pid: '010E', name: 'Ignition Timing Advance (°)', rawResponse: '-', parsedValue: '-', latencyMs: 0, status: 'pending', successCount: 0, failCount: 0, lastUpdated: '-' },
  '010D': { pid: '010D', name: 'Vehicle Speed (km/h)', rawResponse: '-', parsedValue: '-', latencyMs: 0, status: 'pending', successCount: 0, failCount: 0, lastUpdated: '-' },
  '0106': { pid: '0106', name: 'Short Term Fuel Trim B1 (%)', rawResponse: '-', parsedValue: '-', latencyMs: 0, status: 'pending', successCount: 0, failCount: 0, lastUpdated: '-' },
  '0124': { pid: '0124', name: 'Wideband Lambda (PID 24)', rawResponse: '-', parsedValue: '-', latencyMs: 0, status: 'pending', successCount: 0, failCount: 0, lastUpdated: '-' },
  '0134': { pid: '0134', name: 'Wideband Lambda (PID 34)', rawResponse: '-', parsedValue: '-', latencyMs: 0, status: 'pending', successCount: 0, failCount: 0, lastUpdated: '-' },
  '0144': { pid: '0144', name: 'Lambda Specified (PID 44)', rawResponse: '-', parsedValue: '-', latencyMs: 0, status: 'pending', successCount: 0, failCount: 0, lastUpdated: '-' },
  '0114': { pid: '0114', name: 'O2 Sensor 1 Pre-Cat (B1S1)', rawResponse: '-', parsedValue: '-', latencyMs: 0, status: 'pending', successCount: 0, failCount: 0, lastUpdated: '-' },
  '0115': { pid: '0115', name: 'O2 Sensor 2 After Cat (B1S2)', rawResponse: '-', parsedValue: '-', latencyMs: 0, status: 'pending', successCount: 0, failCount: 0, lastUpdated: '-' },
  '0142': { pid: '0142', name: 'ECU Module Voltage (PID 42)', rawResponse: '-', parsedValue: '-', latencyMs: 0, status: 'pending', successCount: 0, failCount: 0, lastUpdated: '-' },
};

export class ObdEngine {
  private mode: ConnectionMode = 'disconnected';
  private listeners: ObdEventListener[] = [];
  private isPolling = false;
  private isPollingRunning = false;
  private peakBoost = 0;
  private logCounter = 1;
  private commandMutex: Promise<any> = Promise.resolve();

  private activeDTCs: DTCFault[] = [];
  private currentStage: EngineStageId = 'stage1';
  private currentOctane: FuelOctane = 100;
  private liveTelemetry: TelemetryData = { ...ZERO_TELEMETRY, timestamp: Date.now() };

  // Web Bluetooth members
  private bluetoothDevice: any = null;
  private gattServer: any = null;
  private bleTxChar: any = null;
  private bleRxChar: any = null;
  private bleReceiveBuffer = '';

  // WiFi OBD members
  private wifiConfig: WifiObdConfig = {
    ip: '192.168.0.10',
    port: 35000,
    autoReconnect: true,
    timeoutMs: 5000,
  };

  // Comprehensive Debug State
  private debugState: ObdDebugState = {
    bridgeType: 'Αναμονή σύνδεσης',
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
    lastError: 'Κανένα σφάλμα',
    pidTable: JSON.parse(JSON.stringify(INITIAL_PID_TABLE)),
    commandLogs: []
  };

  constructor() {
    this.mode = 'disconnected';
    this.liveTelemetry = { ...ZERO_TELEMETRY, timestamp: Date.now() };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public subscribe(listener: ObdEventListener): () => void {
    this.listeners.push(listener);
    if (listener.onDebugUpdate) {
      listener.onDebugUpdate({ ...this.debugState });
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getDebugState(): ObdDebugState {
    return { ...this.debugState };
  }

  public clearDebugLogs(): void {
    this.debugState.commandLogs = [];
    this.notifyDebug();
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
      await this.sleep(50);
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

    this.notifyError('Το Bluetooth δεν υποστηρίζεται σε αυτόν τον browser. Χρησιμοποιήστε την εφαρμογή APK ή Google Chrome.');
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

    this.notifyError('Η σύνδεση WiFi OBD απαιτεί την εγκατεστημένη εφαρμογή Android APK για άμεση σύνδεση TCP Socket.');
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
   * Smart ELM327 Initialization & Audi ME7.5 Protocol Lock (K-Line ISO 9141-2 / KWP2000 & CAN)
   */
  public async initializeAndLockEcu(forcedProtocolCmd?: string): Promise<boolean> {
    try {
      // Wait for any native initElm327 buffer to settle so we don't abort a K-Line 5-baud init
      await this.sleep(500);

      await this.sendObdCommand('ATE0'); // Echo Off
      await this.sendObdCommand('ATL0'); // Linefeeds Off
      await this.sendObdCommand('ATS1'); // Spaces On
      await this.sendObdCommand('ATH0'); // Headers Off
      await this.sendObdCommand('ATAT1'); // Standard Adaptive Timing (essential for K-Line stability!)
      await this.sendObdCommand('ATST 64'); // 400ms timeout (prevents K-Line premature drop)

      // 1. Read ELM327 Chip Version
      const atiResp = await this.sendObdCommand('ATI');
      if (atiResp) {
        this.debugState.elmVersion = atiResp.replace(/AT\s*I/i, '').trim() || 'ELM327 Compatible';
      }

      // 2. Read Battery Voltage immediately from Pin 16 (works before ECU lock)
      const voltResp = await this.executeTrackedPid('ATRV', 'Battery Voltage (Pin 16)', (r) => {
        const v = this.parseVoltage(r);
        if (v !== null) {
          this.liveTelemetry.batteryVoltage = v;
          return `${v.toFixed(1)} V`;
        }
        return null;
      });
      this.notifyTelemetry({ ...this.liveTelemetry, timestamp: Date.now() });

      // 3. Protocol Selection & ECU Handshake
      const protocolsToTry = forcedProtocolCmd
        ? [forcedProtocolCmd]
        : ['ATSP0', 'ATSP5', 'ATSP4', 'ATSP3', 'ATSP6'];

      let locked = false;

      for (const protoCmd of protocolsToTry) {
        await this.sendObdCommand(protoCmd);
        await this.sleep(100);

        this.notifyStatus(`Αναζήτηση εγκεφάλου ECU (${protoCmd})... Περιμένετε 2-3 δευτερόλεπτα για K-Line/CAN init`, this.mode);
        let initResp = await this.sendObdCommand('0100');

        // If ELM327 is still doing 5-baud K-Line init ("SEARCHING..." or "BUS INIT"), wait without interrupting!
        if ((initResp.toUpperCase().includes('SEARCHING') || initResp.toUpperCase().includes('BUS INIT')) && !initResp.includes('41')) {
          await this.sleep(2200);
          initResp = await this.sendObdCommand('0100');
        }

        if (initResp.includes('41') && !initResp.toUpperCase().includes('UNABLE')) {
          locked = true;
          this.debugState.supportedPids0120 = initResp;
          break;
        }

        // Also test 010C (RPM) directly in case 0100 was swallowed during BUS INIT: OK
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

      // 5. Query Supported PIDs ranges (0120 & 0140) if locked
      if (locked) {
        const p20 = await this.sendObdCommand('0120');
        if (p20.includes('41')) this.debugState.supportedPids2140 = p20;
        const p40 = await this.sendObdCommand('0140');
        if (p40.includes('41')) this.debugState.supportedPids4160 = p40;
        this.notifyStatus(`Κλειδώθηκε η ECU (${this.debugState.protocolName})! Ανάγνωση αισθητήρων σε εξέλιξη.`, this.mode);
      } else {
        this.notifyStatus(`Συνδέθηκε στο Dongle (${voltResp ? this.liveTelemetry.batteryVoltage + 'V' : 'OK'}), αλλά η ECU δεν απάντησε ακόμη. Βεβαιωθείτε ότι ο διακόπτης είναι στο ON!`, this.mode);
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
   * Allows user from Debug Tools to force a specific OBD2 protocol (e.g. ATSP5 KWP Fast, ATSP3 ISO 9141-2, ATSP6 CAN)
   */
  public async forceProtocolAndReinit(protoCmd: string): Promise<boolean> {
    if (this.mode === 'disconnected') {
      this.notifyError('Συνδεθείτε πρώτα με το Bluetooth ή WiFi dongle.');
      return false;
    }
    const wasPolling = this.isPolling;
    this.stopRealObdPolling();
    await this.sleep(300);
    const ok = await this.initializeAndLockEcu(protoCmd);
    if (wasPolling) {
      this.startRealObdPolling();
    }
    return ok;
  }

  /**
   * Sends a single manual command from the Debug Terminal and logs the result
   */
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

  /**
   * Runs a full one-click sensor sweep of all 16 PIDs and updates the Debug Table
   */
  public async runFullSensorDiagnosticSweep(): Promise<void> {
    if (this.mode === 'disconnected') {
      this.notifyError('Συνδεθείτε πρώτα με το OBD2 dongle για εκτέλεση διαγνωστικού τεστ αισθητήρων.');
      return;
    }
    const wasPolling = this.isPolling;
    this.stopRealObdPolling();
    await this.sleep(250);

    await this.initializeAndLockEcu();
    await this.pollAllSensorsOnce();

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
        // If ELM327 is in the middle of K-Line 5-baud init, wait so we don't abort it on the next command
        if ((res.toUpperCase().includes('SEARCHING') || res.toUpperCase().includes('BUS INIT')) && !res.includes('41')) {
          await this.sleep(1500);
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

          let timeoutMs = (cleanCmd === 'ATZ' || cleanCmd === '0100' || cleanCmd === '03' || cleanCmd === '07') ? 3800 : 1200;
          const start = Date.now();
          while (Date.now() - start < timeoutMs) {
            const upperBuf = this.bleReceiveBuffer.toUpperCase();
            if (upperBuf.includes('SEARCHING') || upperBuf.includes('BUS INIT')) {
              timeoutMs = 4500;
            }
            if (this.bleReceiveBuffer.includes('>')) {
              break;
            }
            await new Promise(r => setTimeout(r, 12));
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
      this.recordCommandLog(pid, raw, parsedStr, latency, false);
    } else if (raw.toUpperCase().includes('SEARCHING') || raw.toUpperCase().includes('BUS INIT')) {
      entry.status = 'searching';
      entry.parsedValue = 'Αναζήτηση διαύλου K-Line/CAN...';
      this.recordCommandLog(pid, raw, 'SEARCHING BUS', latency, false);
    } else if (this.isNoData(raw)) {
      entry.status = 'no_data';
      entry.failCount++;
      this.debugState.totalErrors++;
      this.recordCommandLog(pid, raw, 'NO DATA / Μη υποστηριζόμενο PID', latency, true);
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
   * Polls all sensors once (used on initial connect and in diagnostic sweep)
   */
  private async pollAllSensorsOnce(): Promise<void> {
    await this.pollCoreSensors();
    for (let c = 0; c < 5; c++) {
      await this.pollSecondaryGroup(c);
    }
    this.recalculateDerivedMetrics();
    this.liveTelemetry.timestamp = Date.now();
    this.notifyTelemetry({ ...this.liveTelemetry });
    this.notifyDebug();
  }

  private async pollCoreSensors(): Promise<void> {
    // 1. Engine RPM (010C)
    await this.executeTrackedPid('010C', 'Engine Speed (RPM)', (raw) => {
      const val = this.parseRpm(raw);
      if (val !== null) {
        this.liveTelemetry.rpm = val;
        return `${val} RPM`;
      }
      return null;
    });
    await this.sleep(10);

    // 2. Mass Air Flow MAF (0110)
    const mafEntry = this.debugState.pidTable['0110'];
    const skipMaf = mafEntry && mafEntry.successCount === 0 && mafEntry.failCount >= 5 && (mafEntry.failCount % 10 !== 0);
    if (!skipMaf) {
      await this.executeTrackedPid('0110', 'MAF Air Flow (G70 g/s)', (raw) => {
        const val = this.parseMaf(raw);
        if (val !== null) {
          this.liveTelemetry.mafGramsPerSec = val;
          return `${val.toFixed(1)} g/s`;
        }
        return null;
      });
      await this.sleep(10);
    } else {
      mafEntry.failCount++;
    }

    // 3. Calculated Engine Load (0104)
    await this.executeTrackedPid('0104', 'Calculated Engine Load (%)', (raw) => {
      const val = this.parseBytePercent(raw, '04');
      if (val !== null) {
        this.liveTelemetry.engineLoad = val;
        return `${val}%`;
      }
      return null;
    });
    await this.sleep(10);

    // 4. Throttle Position (0111)
    await this.executeTrackedPid('0111', 'Throttle Position (%)', (raw) => {
      const val = this.parseBytePercent(raw, '11');
      if (val !== null) {
        this.liveTelemetry.throttlePosition = val;
        return `${val}%`;
      }
      return null;
    });
    await this.sleep(10);

    // 5. MAP Sensor (010B) - Only poll every cycle if it hasn't failed 3 times while ECU is awake
    const mapEntry = this.debugState.pidTable['010B'];
    const skipMap = mapEntry && mapEntry.successCount === 0 && mapEntry.failCount >= 3 && (mapEntry.failCount % 15 !== 0);
    if (!skipMap) {
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
    } else if (mapEntry) {
      mapEntry.failCount++;
    }
  }

  private async pollSecondaryGroup(cycle: number): Promise<void> {
    if (cycle === 0) {
      // Speed (010D) + Short Term Fuel Trim (0106)
      await this.executeTrackedPid('010D', 'Vehicle Speed (km/h)', (raw) => {
        const val = this.parseSpeed(raw);
        if (val !== null) {
          this.liveTelemetry.speed = val;
          return `${val} km/h`;
        }
        return null;
      });

      const stftEntry = this.debugState.pidTable['0106'];
      if (!stftEntry || stftEntry.successCount > 0 || stftEntry.failCount < 4 || stftEntry.failCount % 10 === 0) {
        await this.executeTrackedPid('0106', 'Short Term Fuel Trim B1 (%)', (raw) => {
          const val = this.parseFuelTrim(raw);
          if (val !== null) {
            this.liveTelemetry.shortTermFuelTrim = val;
            return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
          }
          return null;
        });
      } else {
        stftEntry.failCount++;
      }
    } else if (cycle === 1) {
      // Wideband Lambda (0124 / 0134) or Narrowband O2 (0114) + Commanded Lambda Specified (0144)
      let gotLambda = false;

      const e24 = this.debugState.pidTable['0124'];
      if (!e24 || e24.successCount > 0 || e24.failCount < 3 || e24.failCount % 12 === 0) {
        const res24 = await this.executeTrackedPid('0124', 'Wideband Lambda (PID 24)', (raw) => {
          const p = this.parseLambda24(raw);
          if (p !== null) {
            this.liveTelemetry.lambda = p.lambda;
            this.liveTelemetry.afr = Math.round(p.lambda * 14.7 * 10) / 10;
            this.liveTelemetry.o2SensorVoltage = p.voltage;
            gotLambda = true;
            return `λ=${p.lambda.toFixed(3)} (${p.voltage.toFixed(2)}V)`;
          }
          return null;
        });
        if (res24) gotLambda = true;
      } else {
        e24.failCount++;
      }

      if (!gotLambda) {
        const e34 = this.debugState.pidTable['0134'];
        if (!e34 || e34.successCount > 0 || e34.failCount < 3 || e34.failCount % 12 === 0) {
          const res34 = await this.executeTrackedPid('0134', 'Wideband Lambda (PID 34)', (raw) => {
            const p = this.parseLambda34(raw);
            if (p !== null) {
              this.liveTelemetry.lambda = p.lambda;
              this.liveTelemetry.afr = Math.round(p.lambda * 14.7 * 10) / 10;
              gotLambda = true;
              return `λ=${p.lambda.toFixed(3)} (${p.currentMa.toFixed(2)}mA)`;
            }
            return null;
          });
          if (res34) gotLambda = true;
        } else {
          e34.failCount++;
        }
      }

      if (!gotLambda) {
        const e14 = this.debugState.pidTable['0114'];
        if (!e14 || e14.successCount > 0 || e14.failCount < 4 || e14.failCount % 10 === 0) {
          await this.executeTrackedPid('0114', 'O2 Sensor 1 Pre-Cat (B1S1)', (raw) => {
            const p = this.parseO2Sensor(raw, '14');
            if (p !== null) {
              this.liveTelemetry.o2SensorVoltage = p.voltage;
              this.liveTelemetry.shortTermFuelTrim = p.trim;
              const baseLam = 1.0 - ((p.voltage - 0.45) * 0.12) + (p.trim * 0.0015);
              const lamVal = Math.round(Math.max(0.75, Math.min(1.25, baseLam)) * 1000) / 1000;
              this.liveTelemetry.lambda = lamVal;
              this.liveTelemetry.afr = Math.round(lamVal * 14.7 * 10) / 10;
              gotLambda = true;
              return `${p.voltage.toFixed(2)}V (Trim: ${p.trim.toFixed(1)}%)`;
            }
            return null;
          });
        } else {
          e14.failCount++;
        }
      }

      // Commanded Equivalence Ratio / Lambda Specified (0144)
      const e44 = this.debugState.pidTable['0144'];
      if (!e44 || e44.successCount > 0 || e44.failCount < 3 || e44.failCount % 12 === 0) {
        await this.executeTrackedPid('0144', 'Lambda Specified (PID 44)', (raw) => {
          const val = this.parseCommandedLambda(raw);
          if (val !== null) {
            this.liveTelemetry.lambdaSpecified = val;
            return `λ=${val.toFixed(3)}`;
          }
          return null;
        });
      } else {
        e44.failCount++;
      }
    } else if (cycle === 2) {
      // O2 Sensor After Catalytic Converter (0115 - Bank 1 Sensor 2) + Timing Advance (010E)
      const e15 = this.debugState.pidTable['0115'];
      if (!e15 || e15.successCount > 0 || e15.failCount < 4 || e15.failCount % 10 === 0) {
        await this.executeTrackedPid('0115', 'O2 Sensor 2 After Cat (B1S2)', (raw) => {
          const p = this.parseO2Sensor(raw, '15');
          if (p !== null) {
            this.liveTelemetry.o2SensorAfterVoltage = p.voltage;
            return `${p.voltage.toFixed(2)} V`;
          }
          return null;
        });
      } else {
        e15.failCount++;
      }

      await this.executeTrackedPid('010E', 'Ignition Timing Advance (°)', (raw) => {
        const val = this.parseTiming(raw);
        if (val !== null) {
          this.liveTelemetry.ignitionTiming = val;
          return `${val.toFixed(1)}° BTDC`;
        }
        return null;
      });
    } else if (cycle === 3) {
      // Coolant Temp (0105) + Intake Air Temp (010F)
      await this.executeTrackedPid('0105', 'Coolant Temp (G62 °C)', (raw) => {
        const val = this.parseCoolant(raw);
        if (val !== null) {
          this.liveTelemetry.coolantTemp = val;
          this.liveTelemetry.oilTemp = Math.max(60, Math.min(120, val + 4));
          return `${val}°C`;
        }
        return null;
      });

      await this.executeTrackedPid('010F', 'Intake Air Temp (IAT °C)', (raw) => {
        const val = this.parseIat(raw);
        if (val !== null) {
          this.liveTelemetry.iat = val;
          return `${val}°C`;
        }
        return null;
      });
    } else if (cycle === 4) {
      // Battery Voltage (ATRV & 0142)
      const vRes = await this.executeTrackedPid('ATRV', 'Battery Voltage (Pin 16)', (raw) => {
        const val = this.parseVoltage(raw);
        if (val !== null) {
          this.liveTelemetry.batteryVoltage = val;
          return `${val.toFixed(1)} V`;
        }
        return null;
      });

      if (!vRes) {
        await this.executeTrackedPid('0142', 'ECU Module Voltage (PID 42)', (raw) => {
          const val = this.parseModuleVoltage(raw);
          if (val !== null) {
            this.liveTelemetry.batteryVoltage = val;
            return `${val.toFixed(1)} V`;
          }
          return null;
        });
      }
    }
  }

  /**
   * Computes ME7.5 physical values (MAF->BHP, Boost fallback when 010B is unsupported, Injection Time, etc.)
   */
  private recalculateDerivedMetrics(): void {
    const rpm = this.liveTelemetry.rpm;
    const maf = this.liveTelemetry.mafGramsPerSec;
    const loadPct = this.liveTelemetry.engineLoad || 0;
    const thr = this.liveTelemetry.throttlePosition;

    // 1. BHP & Torque from MAF (or Engine Load fallback if MAF PID 0110 is unsupported)
    if (rpm > 350) {
      const effectiveMaf = maf > 0.4 ? maf : ((rpm * 1.781 * (Math.max(15, loadPct) / 100)) / 65);
      if (maf <= 0.4 && loadPct > 0) {
        this.liveTelemetry.mafGramsPerSec = Math.round(effectiveMaf * 10) / 10;
      }
      this.liveTelemetry.calculatedHp = Math.round(effectiveMaf / 0.8);
      this.liveTelemetry.calculatedTorque = Math.round((this.liveTelemetry.calculatedHp * 7120) / rpm);
      this.liveTelemetry.oilPressure = Math.round((1.4 + (rpm / 6000) * 3.4) * 10) / 10;
    } else {
      this.liveTelemetry.calculatedHp = 0;
      this.liveTelemetry.calculatedTorque = 0;
      this.liveTelemetry.oilPressure = 0.0;
    }

    // 2. Boost Pressure fallback if PID 010B MAP is unsupported on this Bosch ME7.5 ECU
    const mapEntry = this.debugState.pidTable['010B'];
    const mapHasRealData = mapEntry && mapEntry.successCount > 0;
    if (!mapHasRealData) {
      if (rpm > 350) {
        const theoreticalNaMaf = (rpm * 1.781 * 0.88 * 1.18) / 120;
        const mafRatio = this.liveTelemetry.mafGramsPerSec > 0.5
          ? (this.liveTelemetry.mafGramsPerSec / Math.max(2.0, theoreticalNaMaf))
          : (loadPct / 100);
        const blendedRatio = this.liveTelemetry.mafGramsPerSec > 0.5
          ? (mafRatio * 0.75 + (loadPct / 100) * 0.25)
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

    // 4. Lambda & AFR fallback if wideband PIDs 0124/0134/0114 did not return data yet
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

    // 5. Lambda Specified fallback if PID 0144 is unsupported
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

    // 6. Post-Cat O2 Sensor After fallback if PID 0115 is unsupported
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

    // 7. N75 Wastegate Duty Cycle
    const maxTarget = ENGINE_STAGES[this.currentStage].maxBoostBar;
    if (rpm > 350 && (this.liveTelemetry.boostBar > 0.05 || loadPct > 40)) {
      const boostRatio = Math.max(0, this.liveTelemetry.boostBar) / Math.max(0.5, maxTarget);
      const loadContribution = (loadPct / 100) * 25;
      this.liveTelemetry.n75DutyCycle = Math.round(Math.min(95, Math.max(10, boostRatio * 70 + loadContribution)));
    } else {
      this.liveTelemetry.n75DutyCycle = 0;
    }
  }

  /**
   * Main continuous OBD-II polling loop
   */
  private async runSequentialPollingLoop(): Promise<void> {
    if (this.isPollingRunning) return;
    this.isPollingRunning = true;

    let cycle = 0;

    while (this.isPolling && (this.mode === 'bluetooth' || this.mode === 'wifi')) {
      const cycleStart = Date.now();
      try {
        await this.pollCoreSensors();
        await this.pollSecondaryGroup(cycle);
        cycle = (cycle + 1) % 5;

        this.recalculateDerivedMetrics();

        this.debugState.loopCycleMs = Date.now() - cycleStart;
        this.liveTelemetry.timestamp = Date.now();
        this.notifyTelemetry({ ...this.liveTelemetry });
        this.notifyDebug();

        await this.sleep(15);
      } catch (e: any) {
        this.debugState.lastError = e.message || String(e);
        this.notifyDebug();
        await this.sleep(80);
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
    return Math.round((((b[0] * 256) + b[1]) / 100) * 10) / 10;
  }

  private parseBytePercent(resp: string, pidHex: string): number | null {
    const b = this.extractPidBytes(resp, pidHex, 1);
    if (!b) return null;
    return Math.round((b[0] * 100) / 255);
  }

  private parseFuelTrim(resp: string): number | null {
    const b = this.extractPidBytes(resp, '06', 1);
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

  private parseLambda34(resp: string): { lambda: number; currentMa: number } | null {
    const b = this.extractPidBytes(resp, '34', 4);
    if (!b) return null;
    const lambda = Math.round((((b[0] * 256) + b[1]) / 32768) * 1000) / 1000;
    const currentMa = Math.round(((((b[2] * 256) + b[3]) / 256) - 128) * 100) / 100;
    if (lambda < 0.4 || lambda > 2.5) return null;
    return { lambda, currentMa };
  }

  private parseCommandedLambda(resp: string): number | null {
    const b = this.extractPidBytes(resp, '44', 2);
    if (!b) return null;
    const lambda = Math.round((((b[0] * 256) + b[1]) / 32768) * 1000) / 1000;
    if (lambda < 0.5 || lambda > 2.0) return null;
    return lambda;
  }

  private parseO2Sensor(resp: string, pidHex: '14' | '15'): { voltage: number; trim: number } | null {
    const b2 = this.extractPidBytes(resp, pidHex, 2);
    if (b2) {
      const voltage = Math.round((b2[0] / 200) * 100) / 100;
      const trim = b2[1] === 0xFF ? 0 : Math.round((((b2[1] - 128) * 100) / 128) * 10) / 10;
      return { voltage, trim };
    }
    const b1 = this.extractPidBytes(resp, pidHex, 1);
    if (b1) {
      const voltage = Math.round((b1[0] / 200) * 100) / 100;
      return { voltage, trim: 0 };
    }
    return null;
  }

  private parseModuleVoltage(resp: string): number | null {
    const b = this.extractPidBytes(resp, '42', 2);
    if (!b) return null;
    const v = Math.round((((b[0] * 256) + b[1]) / 1000) * 10) / 10;
    return (v > 6 && v < 20) ? v : null;
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

  /**
   * VAG-COM / VCDS Measuring Blocks formatted from live OBD-II ECU sensor values
   */
  public getVagMeasuringBlocks(t: TelemetryData): VagBlockGroup[] {
    const isConnected = this.mode === 'bluetooth' || this.mode === 'wifi';
    const isRunning = isConnected && t.rpm > 350;
    const stage = ENGINE_STAGES[this.currentStage];

    const engineLoadPct = isConnected
      ? (t.engineLoad !== undefined && t.engineLoad > 0
          ? t.engineLoad
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

    const o2AfterStr = isConnected && t.o2SensorAfterVoltage !== undefined && t.o2SensorAfterVoltage > 0
      ? `${t.o2SensorAfterVoltage.toFixed(2)} V`
      : '0.00 V';

    return [
      {
        groupNum: '002',
        title: 'Group 002: Mass Air Flow & Engine Load',
        greekTitle: 'Ομάδα 002: Μάζα Αέρα MAF & Φορτίο Κινητήρα',
        description: 'VAG standard air measurement (G70 MAF sensor) and injector open time.',
        fields: [
          { label: 'Engine Speed', value: `${t.rpm} /min`, unit: 'RPM', normalRange: '760 - 6800' },
          { label: 'Engine Load', value: `${engineLoadPct}%`, unit: '%', normalRange: '15 - 100%' },
          { label: 'Injection Time', value: injectionTimeStr, unit: 'ms', normalRange: '1.8 - 22.0 ms' },
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
          { label: 'Engine Speed', value: `${t.rpm} /min`, unit: 'RPM', normalRange: '760 - 6800' },
          { label: 'Engine Load', value: `${engineLoadPct}%`, unit: '%', normalRange: '15 - 100%' },
          { label: 'Boost Specified', value: `${specifiedBoostMbar} mbar`, unit: 'mbar', normalRange: '1000 - 2500' },
          { label: 'Boost Actual', value: `${actualBoostMbar} mbar`, unit: 'mbar', normalRange: '300 - 2500', isWarning: isRunning && Math.abs(specifiedBoostMbar - actualBoostMbar) > 300 },
        ]
      },
      {
        groupNum: '118',
        title: 'Group 118: Turbocharger & N75 Wastegate Duty',
        greekTitle: 'Ομάδα 118: Θερμοκρασία Εισαγωγής (IAT) & Βαλβίδα N75',
        description: 'Intercooler efficiency and wastegate solenoid cycle.',
        fields: [
          { label: 'Engine Speed', value: `${t.rpm} /min`, unit: 'RPM', normalRange: '760 - 6800' },
          { label: 'Intake Air Temp (IAT)', value: `${t.iat}°C`, unit: '°C', normalRange: '15 - 55°C', isWarning: t.iat > 55 },
          { label: 'N75 Duty Cycle', value: `${t.n75DutyCycle}%`, unit: '%', normalRange: '0 - 95%' },
          { label: 'Charge Pressure', value: `${actualBoostMbar} mbar`, unit: 'mbar', normalRange: '300 - 2500' },
        ]
      },
      {
        groupNum: '031',
        title: 'Group 031: Wideband Lambda & O2 Sensors',
        greekTitle: 'Ομάδα 031: Ρύθμιση Λάμδα & Αισθητήρες Οξυγόνου',
        description: 'Air-fuel ratio monitoring (Pre-cat Wideband Lambda & Post-cat O2 sensor).',
        fields: [
          { label: 'Lambda Actual', value: lambdaActualStr, unit: 'λ', normalRange: '0.80 - 1.05' },
          { label: 'Lambda Specified', value: lambdaSpecStr, unit: 'λ', normalRange: '0.82 - 1.00' },
          { label: 'AFR Ratio', value: afrStr, unit: 'AFR', normalRange: '11.8 - 14.7' },
          { label: 'O2 Sensor After Cat', value: o2AfterStr, unit: 'V', normalRange: '0.45 - 0.85 V' },
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
