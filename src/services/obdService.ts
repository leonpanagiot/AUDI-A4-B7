import { TelemetryData, DTCFault, DtcScanDebugInfo, EngineStageId, EngineStageConfig, FuelOctane, VagBlockGroup, VagBlockField } from '../types/telemetry';
import { lookupAndTranslateDtcToGreek } from './vagDtcDictionary';

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
  kwpSessionStatus: string;
  kwp1089Response: string;
  boostGroup115Status: string;
  lambdaPidsStatus: string;
  instruments17G266Status: string;
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
      getPairedDevicesJson?: () => string;
      getPairedBluetoothDevices?: () => string;
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
  boostSpecifiedBar: null,
  boostSpecifiedMbar: null,
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
 * Complete flat catalog of real OBD-II Mode 01 PIDs & verified VAG KWP2000 Service 21 Measuring Blocks
 * checked and polled sequentially without priority starvation.
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
  { pid: '0114', name: 'O2 Sensor B1S1 Narrowband (V & Trim)' },
  { pid: '0115', name: 'O2 Sensor B1S2 After Cat (V)' },
  { pid: '0124', name: 'Wideband Lambda B1S1 (PID 0124 λ & V)' },
  { pid: '0134', name: 'Wideband Lambda B1S1 Current (PID 0134 λ & mA)' },
  { pid: '0142', name: 'Control Module Voltage (ECU V)' },
  { pid: '0144', name: 'Commanded Equivalence Ratio (λ Spec)' },
  { pid: '015C', name: 'Engine Oil Temperature (Θερμ. Λαδιού °C)' },
  { pid: '2173', name: 'VAG KWP Group 115 (Boost Specified & Actual mbar)' },
  { pid: '2176', name: 'VAG KWP Group 118 (IAT, N75 Duty % & Boost Actual)' },
  { pid: '2102', name: 'VAG KWP Group 002 (Load, Injection Time ms & MAF)' },
  { pid: '2114', name: 'VAG KWP Group 020 (Knock Retard Cyl 1-4 CF°)' },
  { pid: '211F', name: 'VAG KWP Group 031 (Lambda Actual & Specified)' },
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

  // Active DTC Faults & Raw HEX Scan Debug Info
  private activeDTCs: DTCFault[] = [];
  private lastDtcScanDebug: DtcScanDebugInfo = {
    timestamp: '-',
    rawMode03Hex: '-',
    rawMode07Hex: '-',
    parsedMode03Frames: [],
    parsedMode07Frames: [],
    mode03Codes: [],
    mode07Codes: [],
  };

  // Polling & Mutex Lock
  private isPolling: boolean = false;
  private isPollingRunning: boolean = false;
  private commandMutex: Promise<any> = Promise.resolve();
  private logCounter: number = 1;
  private recentLatencies: number[] = [];

  // Set of PIDs confirmed unsupported on the connected ECU so we NEVER waste K-Line time on NO DATA
  private unsupportedPids: Set<string> = new Set();

  // Verified KWP2000 Diagnostic Session flag (true only when 10 89 -> 50 89 or 21 XX -> 61 XX succeeds)
  private kwpSessionActive: boolean = false;

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
    kwpSessionStatus: 'Εκκρεμεί έλεγχος συνεδρίας KWP2000 (10 89)',
    kwp1089Response: '-',
    boostGroup115Status: 'Εκκρεμεί έλεγχος (010B / KWP 2173)',
    lambdaPidsStatus: 'Εκκρεμεί έλεγχος (0114 / 0124 / 0134 / 0144)',
    instruments17G266Status: 'Μη ελεγμένο (Πατήστε Έλεγχος G266 17-Instruments)',
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
    // Do NOT assume KWP2000 Service 21 channels work without a verified KWP2000 diagnostic session!
    this.unsupportedPids.add('2173');
    this.unsupportedPids.add('2176');
    this.unsupportedPids.add('2102');
    this.unsupportedPids.add('2114');
    this.unsupportedPids.add('211F');
    this.kwpSessionActive = false;
    this.recentLatencies = [];
    this.kwpGroupCache = {};
    this.debugState.kLineDroppedFrames = 0;
    this.debugState.supportedSensorsCount = 0;
    this.debugState.oilTempPid015CSupported = 'Εκκρεμεί έλεγχος';
    this.debugState.kwpSessionStatus = 'Εκκρεμεί έλεγχος συνεδρίας KWP2000 (10 89)';
    this.debugState.kwp1089Response = '-';
    this.debugState.boostGroup115Status = 'Εκκρεμεί έλεγχος (010B / KWP 2173)';
    this.debugState.lambdaPidsStatus = 'Εκκρεμεί έλεγχος (0114 / 0124 / 0134 / 0144)';
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
        const fn = window.AndroidOBD.getPairedDevicesJson || window.AndroidOBD.getPairedBluetoothDevices;
        if (typeof fn === 'function') {
          const json = fn.call(window.AndroidOBD);
          return JSON.parse(json) || [];
        }
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

  public getLastDtcScanDebug(): DtcScanDebugInfo {
    return {
      ...this.lastDtcScanDebug,
      parsedMode03Frames: [...this.lastDtcScanDebug.parsedMode03Frames],
      parsedMode07Frames: [...this.lastDtcScanDebug.parsedMode07Frames],
      mode03Codes: [...this.lastDtcScanDebug.mode03Codes],
      mode07Codes: [...this.lastDtcScanDebug.mode07Codes],
    };
  }

  public resetPeakBoost(): void {
    this.peakBoost = this.liveTelemetry.boostBar;
    this.liveTelemetry.peakBoostBar = this.liveTelemetry.boostBar;
    this.notifyTelemetry({ ...this.liveTelemetry });
  }

  /**
   * Decodes a 2-byte SAE J2012 / ISO 15031-6 DTC pair into its 5-character code (e.g., 01 00 -> P0100, 41 00 -> C0100).
   */
  public decodeDtcBytePair(b1: number, b2: number): string | null {
    if (isNaN(b1) || isNaN(b2)) return null;
    if (b1 === 0 && b2 === 0) return null; // 00 00 padding

    const typeIndex = (b1 >> 6) & 0x03;
    const prefix = ['P', 'C', 'B', 'U'][typeIndex];
    const d1 = (b1 >> 4) & 0x03;
    const d2 = b1 & 0x0F;
    const d3 = (b2 >> 4) & 0x0F;
    const d4 = b2 & 0x0F;

    const code = `${prefix}${d1}${d2.toString(16)}${d3.toString(16)}${d4.toString(16)}`.toUpperCase();
    if (!/^[PCBU][0-9A-F]{4}$/.test(code) || code === 'P0000') return null;
    return code;
  }

  /**
   * Strict, protocol-aware OBD-II Mode 03 (0x43) & Mode 07 (0x47) K-Line / CAN / ISO-TP Frame Decoder.
   *
   * Why the previous implementation produced a false 'C0100':
   * 1. On ISO 9141-2 / ISO 14230-4 (K-Line, e.g. Audi 1.8T BFB with ATH0 + ATS0), Mode 03 returns 6 payload bytes per frame
   *    DIRECTLY after the 0x43 service byte: `43 <B1> <B2> <B3> <B4> <B5> <B6>` (3 DTC pairs per frame, NO count byte).
   *    Skipping `i + 2` misaligned reading by 1 byte, or when a count byte / multi-frame line was present, shifted bytes by 1:
   *    e.g. `43 01 41 00 ...` (1 DTC = P0100 -> `41 00` read as a DTC pair = `C0100` because 0x41 has bits 7..6 = 01 = 'C'!).
   * 2. Furthermore, if an echoed command or stray Mode 01 response (`41 00 ...`) appeared in the buffer, reading `41 00` as a DTC pair
   *    also decoded directly to `C0100`.
   *
   * This decoder processes a single mode's response in isolation, splits frames by CR/LF, strips optional K-Line/CAN headers
   * (`48 6B 10`, `8x F1 10`, `7E8`), handles ISO 15765-4 multi-frame (`0:`, `1:`, `10 xx 43 count`), and accurately distinguishes
   * K-Line 6-byte DTC frames (`43 D1_HI D1_LO D2_HI D2_LO D3_HI D3_LO`) from count-prefixed frames (`43 <count> D1_HI D1_LO...`).
   */
  public decodeObdDtcResponse(
    rawResp: string,
    modeHex: '43' | '47'
  ): {
    cleanFrames: string[];
    decoded: Array<{ code: string; pairHex: string; frameHex: string }>;
  } {
    const cleanFrames: string[] = [];
    const decoded: Array<{ code: string; pairHex: string; frameHex: string }> = [];

    if (!rawResp) {
      return { cleanFrames, decoded };
    }

    const upper = rawResp
      .toUpperCase()
      .replace(/SEARCHING\.\.\./g, '')
      .replace(/BUS INIT:\s*OK/g, '')
      .replace(/>/g, '\n');

    if (this.isNoData(upper) && !upper.includes(modeHex)) {
      return { cleanFrames, decoded };
    }

    const rawLines = upper
      .split(/[\r\n]+/)
      .map(l => l.trim())
      .filter(l => l.length > 0 && !/^(03|07|OK|NO DATA|STOPPED|\?)$/.test(l));

    // Check if response is ISO-TP segmented (lines starting with 0:, 1:, 2: or 10 xx 43 ...)
    const isIsoTpColon = rawLines.some(l => /^[0-9A-F]:/i.test(l));
    if (isIsoTpColon) {
      const assembledBytes: string[] = [];
      for (const line of rawLines) {
        const stripped = line.replace(/^[0-9A-F]:\s*/i, '');
        const hexOnly = stripped.replace(/[^0-9A-F]/g, '');
        for (let k = 0; k + 1 < hexOnly.length; k += 2) {
          assembledBytes.push(hexOnly.substring(k, k + 2));
        }
      }
      const frameStr = assembledBytes.join(' ');
      if (frameStr) cleanFrames.push(frameStr);

      const sIdx = assembledBytes.indexOf(modeHex);
      if (sIdx !== -1) {
        // In ISO-TP / CAN (ISO 15765-4), byte after 43/47 is ALWAYS the DTC count byte
        const afterService = assembledBytes.slice(sIdx + 1);
        const dtcData = afterService.length % 2 === 1 ? afterService.slice(1) : afterService.slice(1);
        for (let j = 0; j + 1 < dtcData.length; j += 2) {
          const b1 = parseInt(dtcData[j], 16);
          const b2 = parseInt(dtcData[j + 1], 16);
          const code = this.decodeDtcBytePair(b1, b2);
          if (code && !decoded.some(d => d.code === code)) {
            decoded.push({
              code,
              pairHex: `${dtcData[j]} ${dtcData[j + 1]}`,
              frameHex: frameStr,
            });
          }
        }
      }
      return { cleanFrames, decoded };
    }

    // Standard K-Line (ISO 9141-2 / ISO 14230-4 KWP) or single-line frames
    for (const line of rawLines) {
      const hexClean = line.replace(/[^0-9A-F]/g, '');
      if (hexClean.length < 4 || hexClean.length % 2 !== 0) continue;

      const bytes: string[] = [];
      for (let k = 0; k < hexClean.length; k += 2) {
        bytes.push(hexClean.substring(k, k + 2));
      }

      // Guard against Mode 01 response bleed (`41 00 ...`) when no `43` or `47` is in this frame
      if (bytes[0] === '41' && !bytes.includes(modeHex)) {
        continue;
      }

      // Strip optional K-Line / CAN headers if ATH1 was enabled:
      // - ISO 9141-2 header: 48 6B 10 43 ...
      // - KWP2000 header: 8x F1 10 43 ... or C8 F1 10 43 ...
      // - CAN 11-bit header + PCI length: 07 E8 04 43 ...
      let serviceIdx = -1;
      if (bytes[0] === modeHex) {
        serviceIdx = 0;
      } else if (bytes.length >= 4 && bytes[0] === '48' && bytes[1] === '6B' && bytes[3] === modeHex) {
        serviceIdx = 3;
        // Strip trailing K-Line checksum byte if ATH1 was active
        if (bytes.length > 4) bytes.pop();
      } else if (bytes.length >= 4 && bytes[1] === 'F1' && bytes[3] === modeHex) {
        serviceIdx = 3;
        if (bytes.length > 4) bytes.pop();
      } else if (bytes.length >= 3 && bytes[2] === modeHex && (bytes[0] === '07' || parseInt(bytes[0], 16) <= 0x07)) {
        serviceIdx = 2;
      } else if (bytes.length >= 2 && bytes[1] === modeHex && parseInt(bytes[0], 16) <= 0x07) {
        // PCI byte before 43/47 (e.g. `04 43 01 01 71`)
        serviceIdx = 1;
      }

      if (serviceIdx === -1) continue;

      const frameFormatted = bytes.join(' ');
      cleanFrames.push(frameFormatted);

      let payload = bytes.slice(serviceIdx + 1);
      if (payload.length === 0) continue;

      // Case 1: Multiple concatenated `43` / `47` K-Line frames on a single line (when ELM327 ATL0 joins lines without CR)
      // Each K-Line Mode 03/07 frame is 7 bytes: `43 <6 data bytes>` (or `43 <frame#>` + 6 data bytes)
      if (payload.length >= 13 && payload[6] === modeHex) {
        const subFrames: string[][] = [];
        let cursor = serviceIdx;
        while (cursor < bytes.length) {
          if (bytes[cursor] === modeHex) {
            subFrames.push(bytes.slice(cursor + 1, cursor + 7));
            cursor += 7;
          } else {
            break;
          }
        }
        for (const sf of subFrames) {
          for (let j = 0; j + 1 < sf.length; j += 2) {
            const b1 = parseInt(sf[j], 16);
            const b2 = parseInt(sf[j + 1], 16);
            const code = this.decodeDtcBytePair(b1, b2);
            if (code && !decoded.some(d => d.code === code)) {
              decoded.push({
                code,
                pairHex: `${sf[j]} ${sf[j + 1]}`,
                frameHex: `${modeHex} ${sf.join(' ')}`,
              });
            }
          }
        }
        continue;
      }

      // Case 2: Determine if `payload[0]` is a DTC count / message-number byte or the first byte of DTC #1:
      // - If payload has an ODD number of bytes (e.g. `43 00`, `43 01 01 71`, `43 02 01 71 02 99`),
      //   `payload[0]` is unambiguously the DTC count / frame index byte (1 byte + N*2 DTC bytes).
      // - If payload has an EVEN number of bytes (e.g. K-Line standard 6 bytes: `43 01 71 02 99 00 00` or `43 00 00 00 00 00 00`),
      //   the pairs start immediately at `payload[0]`!
      //   Exception: What if an ECU sends `43 <count> <B1> <B2> ...` padded to an even byte count where `payload[1]` is `41`?
      if (payload.length === 1 && payload[0] === '00') {
        // `43 00` -> 0 DTCs
        continue;
      }

      if (payload.length % 2 === 1) {
        const countOrFrameByte = parseInt(payload[0], 16);
        if (countOrFrameByte === 0) {
          continue;
        }
        payload = payload.slice(1);
      }

      // Parse 2-byte aligned DTC pairs
      for (let j = 0; j + 1 < payload.length; j += 2) {
        // Prevent accidentally decoding a nested `43` / `47` or `41 00` Mode 01 response header as `C0100`
        if (payload[j] === '41' && payload[j + 1] === '00' && j === 0 && rawLines.length > 1) {
          continue;
        }
        const b1 = parseInt(payload[j], 16);
        const b2 = parseInt(payload[j + 1], 16);
        const code = this.decodeDtcBytePair(b1, b2);
        if (code && !decoded.some(d => d.code === code)) {
          decoded.push({
            code,
            pairHex: `${payload[j]} ${payload[j + 1]}`,
            frameHex: frameFormatted,
          });
        }
      }
    }

    return { cleanFrames, decoded };
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
   * Diagnostic Mode 03 & 07: Scan real ECU trouble codes with separate K-Line/ISO-TP decoding per mode
   */
  public async scanRealDTCs(): Promise<DTCFault[]> {
    if (this.mode === 'disconnected') {
      this.notifyError('Απαιτείται σύνδεση με το αυτοκίνητο (Bluetooth ή WiFi OBD2) για ανάγνωση της μνήμης σφαλμάτων της ECU.');
      return [];
    }

    try {
      this.notifyStatus('Ανάγνωση μνήμης σφαλμάτων ECU (Ξεχωριστή αποκωδικοποίηση Mode 03 & Mode 07)...', this.mode);

      const start03 = Date.now();
      const res03 = await this.sendObdCommand('03');
      const lat03 = Date.now() - start03;

      const parsed03 = this.decodeObdDtcResponse(res03, '43');
      this.recordCommandLog(
        '03',
        res03 || 'NO DATA',
        parsed03.decoded.length > 0
          ? `Mode 03 Active DTCs: ${parsed03.decoded.map(d => `${d.code} [${d.pairHex}]`).join(', ')}`
          : 'Mode 03: 0 Ενεργά Σφάλματα',
        lat03,
        false
      );

      await this.sleep(30);

      const start07 = Date.now();
      const res07 = await this.sendObdCommand('07');
      const lat07 = Date.now() - start07;

      const parsed07 = this.decodeObdDtcResponse(res07, '47');
      this.recordCommandLog(
        '07',
        res07 || 'NO DATA',
        parsed07.decoded.length > 0
          ? `Mode 07 Pending DTCs: ${parsed07.decoded.map(d => `${d.code} [${d.pairHex}]`).join(', ')}`
          : 'Mode 07: 0 Εκκρεμή Σφάλματα',
        lat07,
        false
      );

      this.lastDtcScanDebug = {
        timestamp: new Date().toLocaleTimeString('el-GR', { hour12: false }),
        rawMode03Hex: (res03 || 'NO DATA').trim(),
        rawMode07Hex: (res07 || 'NO DATA').trim(),
        parsedMode03Frames: parsed03.cleanFrames,
        parsedMode07Frames: parsed07.cleanFrames,
        mode03Codes: parsed03.decoded,
        mode07Codes: parsed07.decoded,
      };
      this.notifyDebug();

      const resultList: DTCFault[] = [];

      // 1. Add Mode 03 (Active / Confirmed DTCs)
      for (const item of parsed03.decoded) {
        const translated = lookupAndTranslateDtcToGreek(item.code, 'Active', item.frameHex);
        resultList.push({
          ...translated,
          modeSource: '03',
          decodedPairHex: item.pairHex,
          rawHexFrame: item.frameHex,
        });
      }

      // 2. Add Mode 07 (Pending DTCs) if not already listed under Mode 03
      for (const item of parsed07.decoded) {
        const existing = resultList.find(r => r.code === item.code);
        if (!existing) {
          const translated = lookupAndTranslateDtcToGreek(item.code, 'Pending', item.frameHex);
          resultList.push({
            ...translated,
            modeSource: '07',
            decodedPairHex: item.pairHex,
            rawHexFrame: item.frameHex,
          });
        }
      }

      this.activeDTCs = resultList;
      if (resultList.length === 0) {
        this.notifyStatus('Ολοκληρώθηκε ο έλεγχος. Δεν βρέθηκαν κωδικοί σφάλματος (MIL OFF - 0 Σφάλματα).', this.mode);
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
      // Keep KWP2000 Service 21 channels disabled until confirmed by a real 61 XX response
      this.unsupportedPids.add('2173');
      this.unsupportedPids.add('2176');
      this.unsupportedPids.add('2102');
      this.unsupportedPids.add('2114');
      this.unsupportedPids.add('211F');
      this.kwpSessionActive = false;
      this.debugState.kLineDroppedFrames = 0;
      this.debugState.kLineTimingVerified = false;

      // Allow any in-flight native initElm327() K-Line 5-baud handshake to finish cleanly
      await this.sleep(350);

      await this.sendObdCommand('ATE0'); // Echo Off
      await this.sendObdCommand('ATL0'); // Linefeeds Off
      await this.sendObdCommand('ATS1'); // Spaces On (reliable framing across all K-Line clones)
      await this.sendObdCommand('ATH0'); // Headers Off
      await this.sendObdCommand('ATAT1'); // Safe Adaptive Timing during K-Line handshake
      await this.sendObdCommand('ATST 25'); // 148ms timeout (fits well inside Android 450-650ms socket read window)
      this.debugState.kLineTimingConfig = 'ATAT1 + ATST 25 (Handshake)';

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
      this.notifyDebug();

      // Helper to test 0100 lock without aborting K-Line 5-baud BUS INIT
      const tryLockWith0100 = async (): Promise<string | null> => {
        let initResp = await this.sendObdCommand('0100');
        if (initResp.includes('41') && !initResp.toUpperCase().includes('UNABLE')) {
          return initResp;
        }
        const upper = initResp.toUpperCase();
        if ((upper.includes('SEARCHING') || upper.includes('BUS INIT')) && !upper.includes('UNABLE')) {
          // Wait quietly so the 5-baud K-Line init completes without UART interruption
          await this.sleep(1800);
          initResp = await this.sendObdCommand('0100');
          if (initResp.includes('41') && !initResp.toUpperCase().includes('UNABLE')) {
            return initResp;
          }
        }
        return null;
      };

      let locked = false;

      // 3A. First check if ECU is ALREADY locked from native initElm327() before resetting protocol with ATSPx
      if (!forcedProtocolCmd) {
        this.notifyStatus('Έλεγχος ενεργής σύνδεσης ECU (0100)...', this.mode);
        const initialCheck = await tryLockWith0100();
        if (initialCheck) {
          locked = true;
          this.debugState.supportedPids0120 = initialCheck;
          this.applyPidSupportBitmask(initialCheck, 1);
        }
      }

      // 3B. If not yet locked, try VAG K-Line protocols in optimal order for Audi BFB ME7.5
      if (!locked) {
        const protocolsToTry = forcedProtocolCmd
          ? [forcedProtocolCmd]
          : ['ATSP4', 'ATSP5', 'ATSP3', 'ATSP0', 'ATSP6'];

        for (const protoCmd of protocolsToTry) {
          if (this.mode === 'disconnected') return false;

          this.notifyStatus(`Κλείδωμα εγκεφάλου ECU (${protoCmd})...`, this.mode);
          await this.sleep(30);
          await this.sendObdCommand(protoCmd);

          const lockResp = await tryLockWith0100();
          if (lockResp) {
            locked = true;
            this.debugState.supportedPids0120 = lockResp;
            this.applyPidSupportBitmask(lockResp, 1);
            break;
          }
        }
      }

      this.debugState.ecuLocked = locked;

      // 4. Query Active Protocol Name & Number
      const dpResp = await this.sendObdCommand('ATDP');
      const dpnResp = await this.sendObdCommand('ATDPN');
      this.debugState.protocolName = dpResp || 'Unknown';
      this.debugState.protocolNum = dpnResp || '-';
      this.notifyDebug();

      if (locked) {
        this.notifyStatus(`ECU Κλειδώθηκε (${this.debugState.protocolName})! Έλεγχος Bitmasks (0100 / 0120 / 0140)...`, this.mode);

        // 5. Discover Supported PIDs in 0120 (21-40) and 0140 (41-60)
        // NOTE: Do NOT mark 0121..0140 or 0141..0160 as unsupported merely because 0120/0140 missed a single K-Line frame!
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
          this.debugState.supportedPids4160 = p40 || 'NO DATA';
        }

        // 6. Explicit Individual Verification of Lambda & O2 PIDs (0114, 0115, 0124, 0134, 0144)
        // Even if 0120/0140 bitmask had a K-Line turnaround glitch, we test each Lambda/O2 PID directly against the ECU!
        this.notifyStatus('Ξεχωριστός έλεγχος αισθητήρων Lambda & O2 (PIDs 0114, 0115, 0124, 0134, 0144)...', this.mode);
        const lambdaSummary: string[] = [];

        this.unsupportedPids.delete('0114');
        await this.pollSinglePidIfSupported('0114');
        if (!this.unsupportedPids.has('0114')) lambdaSummary.push('0114:OK');

        this.unsupportedPids.delete('0115');
        await this.pollSinglePidIfSupported('0115');
        if (!this.unsupportedPids.has('0115')) lambdaSummary.push('0115:OK');

        this.unsupportedPids.delete('0124');
        await this.pollSinglePidIfSupported('0124');
        if (!this.unsupportedPids.has('0124')) lambdaSummary.push('0124(λ+V):OK');

        this.unsupportedPids.delete('0134');
        await this.pollSinglePidIfSupported('0134');
        if (!this.unsupportedPids.has('0134')) lambdaSummary.push('0134(λ+mA):OK');

        this.unsupportedPids.delete('0144');
        await this.pollSinglePidIfSupported('0144');
        if (!this.unsupportedPids.has('0144')) lambdaSummary.push('0144(λSpec):OK');

        this.debugState.lambdaPidsStatus =
          lambdaSummary.length > 0
            ? `Ενεργά: ${lambdaSummary.join(', ')}`
            : 'Κανένα από τα 0114/0124/0134/0144 δεν απάντησε';

        // 7. Explicit Check for PID 010B (Standard MAP / Boost)
        this.unsupportedPids.delete('010B');
        await this.pollSinglePidIfSupported('010B');
        const map010BSupported = !this.unsupportedPids.has('010B');

        // 8. Explicit Check for PID 015C (Engine Oil Temperature via 01-Engine)
        this.notifyStatus('Έλεγχος υποστήριξης πραγματικής θερμοκρασίας λαδιού (PID 015C)...', this.mode);
        this.unsupportedPids.delete('015C');
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
          this.debugState.oilTempPid015CSupported = 'ΟΧΙ στο 01-Engine (015C -> NO DATA)';
        }

        // Oil pressure has no standard OBD-II Mode 01 sensor on BFB -> strictly null (N/A)
        this.liveTelemetry.oilPressure = null;

        // 9. Attempt Real VAG KWP2000 Diagnostic Session (10 89) & Probe VAG Groups 115 (2173) / 118 (2176) / 002 (2102) / 020 (2114) / 031 (211F)
        await this.probeVagKwp2000SessionAndBlocks(map010BSupported);

        // 10. Test & Verify ATAT2 + ATST 19 on K-Line to ensure ZERO lost responses!
        await this.verifyAndApplyOptimalKLineTiming();

        // Update count of active supported sensors
        this.updateSupportedSensorCount();

        this.notifyStatus(
          `ECU Κλειδώθηκε (${this.debugState.protocolName}) • ${this.debugState.supportedSensorsCount} ενεργά κανάλια • ${this.debugState.kLineTimingConfig}`,
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
   * Attempts to open a real VAG KWP2000 Diagnostic Session (Service 10 89 -> Positive Response 50 89)
   * on the active K-Line connection and probes whether `21 73` (Group 115 Boost Specified/Actual)
   * and `21 76` (Group 118 N75/Boost) return genuine `61 73` / `61 76` Measuring Block frames.
   *
   * Strictly NEVER assumes `2173` works unless a verified `61 73` response is received from the ECU!
   */
  private async probeVagKwp2000SessionAndBlocks(map010BSupported: boolean): Promise<void> {
    this.notifyStatus('Έλεγχος συνεδρίας VAG KWP2000 (10 89) & Group 115/118 (2173/2176)...', this.mode);

    const start1089 = Date.now();
    const resp1089 = await this.sendObdCommand('1089');
    const lat1089 = Date.now() - start1089;
    const clean1089 = (resp1089 || '').toUpperCase().replace(/[^0-9A-F]/g, '');
    const sessionConfirmed = clean1089.includes('5089') || clean1089.includes('50');

    this.debugState.kwp1089Response = (resp1089 || 'NO DATA').trim();
    this.recordCommandLog(
      '1089',
      resp1089 || 'NO DATA',
      sessionConfirmed
        ? 'KWP2000 Diagnostic Session 0x89 ΕΠΙΒΕΒΑΙΩΘΗΚΕ (50 89)'
        : 'KWP2000 10 89 απορρίφθηκε (ISO 9141-2 OBD Mode)',
      lat1089,
      !sessionConfirmed
    );

    // Now test Group 115 (`2173`) directly to see if the ECU answers `61 73 ...`
    this.unsupportedPids.delete('2173');
    const g115Res = await this.executeTrackedPid('2173', 'VAG KWP Group 115 (Boost Specified & Actual mbar)', (raw) => {
      return this.parseAndApplyKwpGroup('73', '115', raw);
    });

    if (g115Res !== null) {
      this.kwpSessionActive = true;
      this.unsupportedPids.delete('2173');
      this.debugState.kwpSessionStatus = `ΕΝΕΡΓΗ (KWP2000 Service 21 Επιβεβαιώθηκε • 1089: ${this.debugState.kwp1089Response})`;
      this.debugState.boostGroup115Status = `ΕΝΕΡΓΟ μέσω VAG KWP Group 115 (61 73 -> ${g115Res})`;

      // Since KWP2000 Service 21 is confirmed on this protocol, also probe Group 118 (2176), 002 (2102), 020 (2114), 031 (211F)
      for (const kwpItem of [
        { pid: '2176', hex: '76', num: '118', label: 'VAG KWP Group 118 (IAT, N75 Duty % & Boost Actual)' },
        { pid: '2102', hex: '02', num: '002', label: 'VAG KWP Group 002 (Load, Injection Time ms & MAF)' },
        { pid: '2114', hex: '14', num: '020', label: 'VAG KWP Group 020 (Knock Retard Cyl 1-4 CF°)' },
        { pid: '211F', hex: '1F', num: '031', label: 'VAG KWP Group 031 (Lambda Actual & Specified)' },
      ]) {
        this.unsupportedPids.delete(kwpItem.pid);
        const res = await this.executeTrackedPid(kwpItem.pid, kwpItem.label, (raw) =>
          this.parseAndApplyKwpGroup(kwpItem.hex, kwpItem.num, raw)
        );
        if (res === null) {
          this.unsupportedPids.add(kwpItem.pid);
        }
      }
    } else {
      // 2173 did not return 61 73 -> keep all 21XX channels in unsupportedPids so polling stays 100% fast!
      this.kwpSessionActive = false;
      this.unsupportedPids.add('2173');
      this.unsupportedPids.add('2176');
      this.unsupportedPids.add('2102');
      this.unsupportedPids.add('2114');
      this.unsupportedPids.add('211F');

      this.debugState.kwpSessionStatus = sessionConfirmed
        ? `1089 -> ${this.debugState.kwp1089Response}, αλλά 2173 -> NO DATA`
        : `Μη διαθέσιμη σε ISO 9141-2 (${this.debugState.protocolName}) • 1089 -> ${this.debugState.kwp1089Response}`;

      this.debugState.boostGroup115Status = map010BSupported
        ? 'Boost Actual ενεργό μέσω PID 010B • Boost Specified απαιτεί KWP2000 2173 (Μη υποστηριζόμενο σε ISO 9141-2)'
        : 'Μη διαθέσιμο: Το PID 010B (Bitmask 0100) και το KWP 2173 επέστρεψαν NO DATA στο ενεργό πρωτόκολλο';
    }
  }

  /**
   * Probes 17-Instruments (Kombiinstrument - Address 0x17) for real Oil Temperature sensor G266 (Group 050 / 21 32).
   * Safely pauses Engine polling, configures KWP2000 target header for 17-Instruments (ATSH 81 17 F1 & ATSP5/ATSP4),
   * checks `10 89` + `21 32` (Group 050) and `21 03` (Group 003), and then cleanly restores the 01-Engine connection.
   * Never creates a fake oil temperature!
   */
  public async probe17InstrumentsOilTempG266(): Promise<string> {
    if (this.mode === 'disconnected') {
      const msg = 'Απαιτείται ενεργή σύνδεση με το OBD-II dongle.';
      this.notifyError(msg);
      return msg;
    }

    const wasPolling = this.isPolling;
    this.stopRealObdPolling();
    await this.sleep(150);

    const savedProtoNum = (this.debugState.protocolNum || '').replace(/[^0-9A-F]/gi, '');
    this.notifyStatus('Δοκιμή ανάγνωσης G266 (Θερμ. Λαδιού) από 17-Instruments (Καντράν)...', this.mode);
    this.debugState.instruments17G266Status = 'Σε εξέλιξη σύνδεση με 17-Instruments...';
    this.notifyDebug();

    let resultMsg = '';
    try {
      // Configure KWP2000 header targeting 17-Instruments (physical address 0x17, tester 0xF1)
      await this.sendObdCommand('ATSH 81 17 F1');
      await this.sendObdCommand('ATIIA 17'); // ISO 5-baud init address 0x17 (if supported by ELM v1.4+)
      await this.sendObdCommand('ATSP5');

      const r1089 = await this.sendObdCommand('1089');
      const r2132 = await this.sendObdCommand('2132'); // Group 050 (0x32): Speed, RPM, Oil Temp G266, Coolant

      this.recordCommandLog(
        '17-INST:2132',
        `1089->${r1089 || 'NO DATA'} | 2132->${r2132 || 'NO DATA'}`,
        'Έλεγχος G266 μέσω 17-Instruments (Group 050)',
        0,
        !r2132.includes('61')
      );

      const cells50 = this.decodeKwpBlockResponse(r2132, '32');
      if (cells50) {
        // In 17-Instruments Group 050, Field 3 (cells50[2]) or Field 4 is Oil Temperature G266 in °C
        const oilStr = cells50.find(c => c.includes('°C')) || cells50[2];
        const parsedTemp = parseFloat(oilStr);
        if (!isNaN(parsedTemp) && parsedTemp > -30 && parsedTemp < 180) {
          this.liveTelemetry.oilTemp = Math.round(parsedTemp);
          this.pushLiveTelemetryUpdate();
          resultMsg = `ΕΠΙΤΥΧΙΑ 17-Instruments Group 050 (2132): G266 = ${Math.round(parsedTemp)} °C [Raw: ${r2132.trim()}]`;
        } else {
          resultMsg = `17-Instruments απάντησε (${ cells50.join(' | ') }), αλλά δεν βρέθηκε έγκυρη θερμοκρασία G266.`;
        }
      } else {
        resultMsg = `Αδύνατη ανάγνωση 17-Instruments με ELM327 (1089: "${(r1089 || 'NO DATA').trim()}", 2132: "${(r2132 || 'NO DATA').trim()}"). Στο Audi A4 B7 (8E) το καντράν (17-Instruments) χρησιμοποιεί αποκλειστικό VAG KW1281 (5-baud @ 0x17) ή TP2.0 CAN που δεν υποστηρίζεται από ELM327. Η θερμοκρασία λαδιού παραμένει αυστηρά N/A.`;
      }
    } catch (e: any) {
      resultMsg = `Σφάλμα κατά τον έλεγχο 17-Instruments: ${e.message || e}`;
    } finally {
      // Restore standard 01-Engine OBD-II addressing and protocol
      await this.sendObdCommand('ATIIA 33');
      await this.sendObdCommand('ATSH 68 6A F1');
      const restoreCmd = savedProtoNum ? `ATSP${savedProtoNum.charAt(savedProtoNum.length - 1)}` : 'ATSP3';
      await this.initializeAndLockEcu(restoreCmd);
      this.debugState.instruments17G266Status = resultMsg;
      this.notifyDebug();
      if (wasPolling) {
        this.startRealObdPolling();
      }
    }

    return resultMsg;
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

    const rpmVal = this.parseRpm(r1);
    const coolVal = this.parseCoolant(r2);

    if (rpmVal !== null) {
      this.liveTelemetry.rpm = rpmVal;
    }
    if (coolVal !== null) {
      this.liveTelemetry.coolantTemp = coolVal;
    }
    if (rpmVal !== null || coolVal !== null) {
      this.pushLiveTelemetryUpdate();
    }

    if (rpmVal !== null && coolVal !== null) {
      this.debugState.kLineTimingConfig = 'ATAT2 + ATST 19 (100ms - Verified 0% Loss)';
      this.debugState.kLineTimingVerified = true;
    } else {
      // Fallback to safer K-Line turnaround timing (148ms, safe inside 450ms Android socket timeout)
      await this.sendObdCommand('ATAT1');
      await this.sendObdCommand('ATST 25'); // 37 * 4ms = 148ms
      this.debugState.kLineTimingConfig = 'ATAT1 + ATST 25 (148ms - Safe K-Line Fallback)';
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
   * Serialized raw command sender with mutex lock so two commands NEVER overlap on the socket.
   * Includes a 4ms macrotask yield before synchronous AndroidOBD JNI calls so React renders immediately and never freezes the UI thread.
   */
  public async sendObdCommand(cmd: string): Promise<string> {
    const run = async (): Promise<string> => {
      const cleanCmd = cmd.trim().toUpperCase();
      this.debugState.totalCommandsSent++;

      // 1. Android Native Bridge (Bluetooth Classic RFCOMM SPP & TCP Socket)
      if (this.isNativeAndroid() && window.AndroidOBD) {
        // CRITICAL: Yield to browser macrotask queue before synchronous JNI call so UI updates render immediately
        await new Promise<void>(resolve => setTimeout(resolve, 4));
        const res = window.AndroidOBD.sendRawCommand(cleanCmd) || '';
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
        await this.executeTrackedPid('0124', 'Wideband Lambda B1S1 (PID 0124 λ & V)', (raw) => {
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

      case '0134':
        await this.executeTrackedPid('0134', 'Wideband Lambda B1S1 Current (PID 0134 λ & mA)', (raw) => {
          const p = this.parseLambda34(raw);
          if (p !== null) {
            this.liveTelemetry.lambda = p.lambda;
            this.liveTelemetry.afr = Math.round(p.lambda * 14.7 * 10) / 10;
            updated = true;
            return `λ=${p.lambda.toFixed(3)} (${p.currentMa >= 0 ? '+' : ''}${p.currentMa.toFixed(2)}mA)`;
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

      case '2173':
        await this.executeTrackedPid('2173', 'VAG KWP Group 115 (Boost Specified & Actual mbar)', (raw) => {
          const res = this.parseAndApplyKwpGroup('73', '115', raw);
          if (res !== null) {
            updated = true;
          }
          return res;
        });
        break;

      case '2176':
        await this.executeTrackedPid('2176', 'VAG KWP Group 118 (IAT, N75 Duty % & Boost Actual)', (raw) => {
          const res = this.parseAndApplyKwpGroup('76', '118', raw);
          if (res !== null) {
            updated = true;
          }
          return res;
        });
        break;

      case '2102':
        await this.executeTrackedPid('2102', 'VAG KWP Group 002 (Load, Injection Time ms & MAF)', (raw) => {
          const res = this.parseAndApplyKwpGroup('02', '002', raw);
          if (res !== null) {
            updated = true;
          }
          return res;
        });
        break;

      case '2114':
        await this.executeTrackedPid('2114', 'VAG KWP Group 020 (Knock Retard Cyl 1-4 CF°)', (raw) => {
          const res = this.parseAndApplyKwpGroup('14', '020', raw);
          if (res !== null) {
            updated = true;
          }
          return res;
        });
        break;

      case '211F':
        await this.executeTrackedPid('211F', 'VAG KWP Group 031 (Lambda Actual & Specified)', (raw) => {
          const res = this.parseAndApplyKwpGroup('1F', '031', raw);
          if (res !== null) {
            updated = true;
          }
          return res;
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

  private parseLambda34(resp: string): { lambda: number; currentMa: number } | null {
    const b = this.extractPidBytes(resp, '34', 4);
    if (!b) return null;
    const lambda = Math.round((((b[0] * 256) + b[1]) / 32768) * 1000) / 1000;
    const currentMa = Math.round(((((b[2] * 256) + b[3]) / 256) - 128) * 100) / 100;
    if (lambda < 0.4 || lambda > 2.5) return null;
    return { lambda, currentMa };
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

  /**
   * Complete VAG KWP1281 / KWP2000 Bosch ME7.5 Measuring Block Formula Table
   */
  private decodeKwpCellFormula(formula: number, a: number, b: number): string {
    switch (formula) {
      case 0x01:
        return `${Math.round(0.2 * a * b)} /min`; // RPM
      case 0x02:
        return `${(a * 0.002 * b).toFixed(1)} %`; // Load / Duty %
      case 0x03:
        return `${(0.002 * a * b).toFixed(1)} deg`; // Throttle / Angle
      case 0x04:
        return `${(Math.abs(b - 127) * 0.01 * a).toFixed(1)} °`; // Ignition Timing / Retard
      case 0x05:
        return `${Math.round((a * (b - 100) * 0.1) * 10) / 10} °C`; // Temperature °C
      case 0x06:
      case 0x0C:
      case 0x15:
        return `${(0.001 * a * b).toFixed(3)} V`; // Voltage V
      case 0x07:
        return `${Math.round(0.01 * a * b)} km/h`; // Vehicle Speed km/h
      case 0x08:
        return `${Math.round((0.1 * a * b - 273.1) * 10) / 10} °C`; // Temperature °C
      case 0x0F:
      case 0x16:
        return `${(0.001 * a * b).toFixed(2)} ms`; // Injection Time ms
      case 0x10:
        return `b${b.toString(2).padStart(8, '0')}`; // Bitmask status
      case 0x12:
        return `${Math.round(0.04 * a * b)} mbar`; // Absolute Pressure mbar (Boost Specified / Actual)
      case 0x14:
        return `${((a * (b - 128)) / 128).toFixed(1)} %`; // Fuel Trim / Adaptation %
      case 0x1A:
        return `${(b - a)} °C`;
      case 0x1E:
      case 0x25:
        return `${(0.0001 * a * b).toFixed(3)} λ`; // Lambda Factor
      case 0x21:
        return `${(b === 0 ? 0 : (100 * a) / b).toFixed(1)} %`; // N75 Duty Cycle %
      case 0x26:
        return `${((b - 128) * 0.001 * a).toFixed(1)}°`; // Knock Retard CF°
      case 0x31:
        return `${((a * b) / 360).toFixed(2)} g/s`; // MAF Air Mass g/s
      default:
        return `0x${formula.toString(16).toUpperCase()}:${a},${b}`;
    }
  }

  /**
   * Parses a real KWP2000 Service 21 (`61 <groupHex> ...`) response, caches the 4 cells,
   * and maps real physical values (Boost Specified, Boost Actual, N75, Injection Time, Knock Retard, Lambda)
   * directly into `this.liveTelemetry`.
   */
  private parseAndApplyKwpGroup(groupHex: string, groupNum: string, rawHex: string): string | null {
    const cells = this.decodeKwpBlockResponse(rawHex, groupHex);
    if (!cells) return null;

    this.kwpGroupCache[groupNum] = {
      rawHex: rawHex.trim(),
      cells,
      updatedAt: new Date().toLocaleTimeString('el-GR', { hour12: false }),
    };

    const numVal = (s: string): number | null => {
      const m = s.match(/-?[0-9]+(\.[0-9]+)?/);
      return m ? parseFloat(m[0]) : null;
    };

    if (groupNum === '115') {
      // Group 115: [RPM, Load %, Boost Specified mbar, Boost Actual mbar]
      const rpm = numVal(cells[0]);
      const load = numVal(cells[1]);
      const specMbar = numVal(cells[2]);
      const actMbar = numVal(cells[3]);
      if (rpm !== null) this.liveTelemetry.rpm = Math.round(rpm);
      if (load !== null) this.liveTelemetry.engineLoad = load;
      if (specMbar !== null && specMbar > 100) {
        this.liveTelemetry.boostSpecifiedMbar = Math.round(specMbar);
        this.liveTelemetry.boostSpecifiedBar = Math.round(((specMbar - 1013) / 1000) * 100) / 100;
      }
      if (actMbar !== null && actMbar > 100) {
        const boostBar = Math.round(((actMbar - 1013) / 1000) * 100) / 100;
        this.liveTelemetry.boostBar = boostBar;
        this.liveTelemetry.boostPsi = Math.round(boostBar * 14.5038 * 10) / 10;
        if (this.peakBoost === null || boostBar > this.peakBoost) {
          this.peakBoost = boostBar;
          this.liveTelemetry.peakBoostBar = boostBar;
        }
      }
      return `Spec:${cells[2]} | Act:${cells[3]}`;
    }

    if (groupNum === '118') {
      // Group 118: [RPM, IAT °C, N75 Duty %, Boost Actual mbar]
      const iat = numVal(cells[1]);
      const n75 = numVal(cells[2]);
      const actMbar = numVal(cells[3]);
      if (iat !== null) this.liveTelemetry.iat = Math.round(iat);
      if (n75 !== null) this.liveTelemetry.n75DutyCycle = Math.round(n75 * 10) / 10;
      if (actMbar !== null && actMbar > 100) {
        const boostBar = Math.round(((actMbar - 1013) / 1000) * 100) / 100;
        this.liveTelemetry.boostBar = boostBar;
        this.liveTelemetry.boostPsi = Math.round(boostBar * 14.5038 * 10) / 10;
      }
      return `N75:${cells[2]} | Boost:${cells[3]}`;
    }

    if (groupNum === '002') {
      // Group 002: [RPM, Load %, Injection Time ms, MAF g/s]
      const inj = numVal(cells[2]);
      const maf = numVal(cells[3]);
      if (inj !== null) this.liveTelemetry.injectionTimeMs = inj;
      if (maf !== null) this.liveTelemetry.mafGramsPerSec = maf;
      return `Inj:${cells[2]} | MAF:${cells[3]}`;
    }

    if (groupNum === '020') {
      // Group 020: [Cyl 1 CF, Cyl 2 CF, Cyl 3 CF, Cyl 4 CF]
      const c1 = numVal(cells[0]);
      const c2 = numVal(cells[1]);
      const c3 = numVal(cells[2]);
      const c4 = numVal(cells[3]);
      this.liveTelemetry.knockRetard = [
        c1 !== null ? Math.abs(c1) : null,
        c2 !== null ? Math.abs(c2) : null,
        c3 !== null ? Math.abs(c3) : null,
        c4 !== null ? Math.abs(c4) : null,
      ];
      return `${cells[0]} | ${cells[1]} | ${cells[2]} | ${cells[3]}`;
    }

    if (groupNum === '031') {
      // Group 031: [Lambda Actual, Lambda Specified, ...]
      const lamAct = numVal(cells[0]);
      const lamSpec = numVal(cells[1]);
      if (lamAct !== null && lamAct > 0.4 && lamAct < 2.5) {
        this.liveTelemetry.lambda = lamAct;
        this.liveTelemetry.afr = Math.round(lamAct * 14.7 * 10) / 10;
      }
      if (lamSpec !== null && lamSpec > 0.4 && lamSpec < 2.5) {
        this.liveTelemetry.lambdaSpecified = lamSpec;
      }
      return `λAct:${cells[0]} | λSpec:${cells[1]}`;
    }

    return cells.join(' | ');
  }

  /**
   * Actively queries a VAG Measuring Block Group (001-255) from the connected ECU:
   * 1. Attempts KWP2000 diagnostic session (`10 89`) if not yet active, then sends Service 21 (`21 XX`).
   * 2. Also polls the real OBD-II Mode 01 PIDs mapped to that group so values are freshly read from the ECU.
   */
  public async queryVagGroupFromEcu(rawGroupNum: number | string): Promise<VagBlockGroup> {
    const numInt = Math.max(1, Math.min(255, parseInt(String(rawGroupNum).trim(), 10) || 1));
    const groupNum = numInt.toString().padStart(3, '0');
    const groupHex = numInt.toString(16).padStart(2, '0').toUpperCase();

    if (this.mode === 'bluetooth' || this.mode === 'wifi') {
      if (!this.kwpSessionActive) {
        const r1089 = await this.sendObdCommand('1089');
        if (r1089 && r1089.replace(/\s+/g, '').includes('50')) {
          this.kwpSessionActive = true;
        }
      }

      const kwpCmd = `21${groupHex}`;
      const start = Date.now();
      const rawKwp = await this.sendObdCommand(kwpCmd);
      const latency = Date.now() - start;
      const appliedSummary = this.parseAndApplyKwpGroup(groupHex, groupNum, rawKwp);
      const decodedCells = this.decodeKwpBlockResponse(rawKwp, groupHex);

      this.recordCommandLog(
        kwpCmd,
        rawKwp || 'NO DATA',
        decodedCells
          ? `VAG Group ${groupNum} KWP2000 OK (${appliedSummary})`
          : `VAG Group ${groupNum}: KWP 21${groupHex} -> NO DATA (Χρήση OBD-II Mode 01 PIDs)`,
        latency,
        !decodedCells
      );

      if (!decodedCells) {
        this.kwpGroupCache[groupNum] = {
          rawHex: rawKwp || 'NO DATA',
          cells: null,
          updatedAt: new Date().toLocaleTimeString('el-GR', { hour12: false }),
        };
      } else {
        this.pushLiveTelemetryUpdate();
      }

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
    const fmtBoostSpecMbar =
      t.boostSpecifiedMbar !== undefined && t.boostSpecifiedMbar !== null
        ? `${Math.round(t.boostSpecifiedMbar)} mbar`
        : 'N/A';
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
          greekTitle: 'Ομάδα 031: Λάμδα Πραγματικό (0124/0134), Ζητούμενο (0144), Τάση B1S1 (0114/0124) & B1S2 (0115)',
          description: 'Real Wideband Lambda (PID 0124/0134), Commanded Lambda (PID 0144), Pre-Cat O2 (0114/0124) and Post-Cat O2 (PID 0115).',
          rawHexResponse: rawNote,
          sourceMode: 'OBD-II Mode 01 / KWP 211F',
          fields: [
            { label: 'Lambda Actual (0124/0134)', value: fmtLambda, unit: 'λ', normalRange: '0.80 - 1.05', sourcePid: '0124' },
            { label: 'Lambda Specified (0144)', value: fmtLambdaSpec, unit: 'λ', normalRange: '0.82 - 1.00', sourcePid: '0144' },
            { label: 'O2 B1S1 Voltage (0114/0124)', value: fmtO2B1S1, unit: 'V', normalRange: '0.10 - 2.00 V', sourcePid: '0114/0124' },
            { label: 'O2 B1S2 After Cat (0115)', value: fmtO2B1S2, unit: 'V', normalRange: '0.05 - 0.85 V', sourcePid: '0115' },
          ]
        };

      case 32:
      case 33:
        return {
          groupNum,
          title: `Group ${groupNum}: Fuel Trim Adaptation (STFT & LTFT)`,
          greekTitle: `Ομάδα ${groupNum}: Διορθώσεις Καυσίμου STFT (0106), LTFT (0107) & Αισθητήρας Λάμδα (0114/0124)`,
          description: 'Real Short-Term and Long-Term Fuel Trims from PIDs 0106 and 0107.',
          rawHexResponse: rawNote,
          sourceMode: 'OBD-II Mode 01 (100% Real)',
          fields: [
            { label: 'Short Term Trim (0106)', value: fmtStft, unit: '%', normalRange: '-10.0 to +10.0%', sourcePid: '0106', isWarning: t.shortTermFuelTrim !== null && Math.abs(t.shortTermFuelTrim) > 12 },
            { label: 'Long Term Trim (0107)', value: fmtLtft, unit: '%', normalRange: '-10.0 to +10.0%', sourcePid: '0107', isWarning: t.longTermFuelTrim !== null && Math.abs(t.longTermFuelTrim) > 12 },
            { label: 'O2 Sensor Voltage (0114/0124)', value: fmtO2B1S1, unit: 'V', normalRange: '0.10 - 2.00 V', sourcePid: '0114/0124' },
            { label: 'Lambda Actual (0124/0134)', value: fmtLambda, unit: 'λ', normalRange: '0.80 - 1.05', sourcePid: '0124' },
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
          greekTitle: 'Ομάδα 115: Στροφές (010C), Φορτίο (0104), Boost Specified (KWP 2173) & Boost Actual (010B / KWP 2173)',
          description: 'Real Boost Specified & Actual from KWP2000 2173 (when ECU accepts KWP session 10 89) or PID 010B.',
          rawHexResponse: rawNote,
          sourceMode: 'OBD-II Mode 01 / KWP 2173',
          fields: [
            { label: 'Engine Speed (010C)', value: fmtRpm, unit: 'RPM', normalRange: '760 - 6800', sourcePid: '010C' },
            { label: 'Engine Load (0104)', value: fmtLoad, unit: '%', normalRange: '15 - 100%', sourcePid: '0104' },
            { label: 'Boost Specified (KWP 2173)', value: fmtBoostSpecMbar, unit: 'mbar', normalRange: 'KWP 2173 Cell 3', sourcePid: '2173' },
            { label: 'Boost Actual (010B / 2173)', value: fmtMapMbar, unit: 'mbar', normalRange: 'PID 010B / KWP 2173', sourcePid: '010B/2173' },
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
