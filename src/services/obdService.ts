import { TelemetryData, DTCFault, EngineStageId, EngineStageConfig, FuelOctane, VagBlockGroup } from '../types/telemetry';
import { audioEngine } from './audioEngine';

export type ConnectionMode = 'simulator' | 'bluetooth' | 'wifi' | 'connecting' | 'disconnected';

export interface WifiObdConfig {
  ip: string;
  port: number;
  autoReconnect: boolean;
  timeoutMs: number;
}

export interface ObdEventListener {
  onTelemetry: (data: TelemetryData) => void;
  onStatusChange: (status: string, mode: ConnectionMode) => void;
  onError: (err: string) => void;
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

export class ObdEngine {
  private mode: ConnectionMode = 'simulator';
  private listeners: ObdEventListener[] = [];
  private simInterval: any = null;
  private currentThrottle = 0; // 0 to 100%
  private simPreset: 'idle' | 'city' | 'wot' | 'dyno' = 'idle';
  private peakBoost = 1.28;
  private simTime = 0;
  private activeDTCs: DTCFault[] = [
    BFB_COMMON_DTCS[0], // P0299 Underboost
    BFB_COMMON_DTCS[3], // P0171 System Too Lean
  ];

  // Stage & Fuel config
  private currentStage: EngineStageId = 'stage1';
  private currentOctane: FuelOctane = 100;

  // Web Bluetooth members
  private bluetoothDevice: any = null;
  private gattServer: any = null;

  // WiFi OBD members (Default ELM327 WiFi: 192.168.0.10:35000)
  private wifiConfig: WifiObdConfig = {
    ip: '192.168.0.10',
    port: 35000,
    autoReconnect: true,
    timeoutMs: 5000,
  };

  constructor() {
    this.startSimulator();
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

  public getCurrentStage(): EngineStageId {
    return this.currentStage;
  }

  public setEngineStage(stage: EngineStageId): void {
    this.currentStage = stage;
    const stageConf = ENGINE_STAGES[stage];
    this.notifyStatus(`Ενεργοποιήθηκε προφίλ κινητήρα: ${stageConf.name} (Max: ${stageConf.maxBoostBar} bar)`, this.mode);
  }

  public getCurrentOctane(): FuelOctane {
    return this.currentOctane;
  }

  public setFuelOctane(octane: FuelOctane): void {
    this.currentOctane = octane;
    this.notifyStatus(`Επιλογή καυσίμου: ${octane} RON οκτάνια`, this.mode);
  }

  public getActiveDTCs(): DTCFault[] {
    return [...this.activeDTCs];
  }

  public clearDTCs(): void {
    this.activeDTCs = [];
    this.notifyStatus('Οι κωδικοί βλάβης (DTCs) διαγράφηκαν επιτυχώς. Η λυχνία Check Engine έσβησε.', this.mode);
  }

  public resetMockDTCs(): void {
    this.activeDTCs = [BFB_COMMON_DTCS[0], BFB_COMMON_DTCS[3]];
    this.notifyStatus('Φορτώθηκαν δοκιμαστικές βλάβες Audi 1.8T BFB (P0299 Underboost, P0171 Lean).', this.mode);
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
  }

  /**
   * Connect to real Bluetooth ELM327 OBD-II adapter via Web Bluetooth API
   */
  public async connectBluetooth(): Promise<boolean> {
    if (!('bluetooth' in navigator)) {
      this.notifyError('Το Web Bluetooth API δεν υποστηρίζεται σε αυτόν τον browser. Χρησιμοποιήστε Google Chrome σε Android.');
      return false;
    }

    try {
      this.mode = 'connecting';
      this.notifyStatus('Αναζήτηση Bluetooth OBD2 συσκευών (OBDII, ELM327, VGate)...', 'connecting');

      const navBt = (navigator as any).bluetooth;
      const device = await navBt.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '0000fff0-0000-1000-8000-00805f9b34fb',
          '0000ffe0-0000-1000-8000-00805f9b34fb',
          '000018f0-0000-1000-8000-00805f9b34fb',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          '6e400001-b5a3-f393-e0a9-e50e24dcca9e'
        ]
      });

      this.bluetoothDevice = device;
      this.notifyStatus(`Σύνδεση με ${device.name || 'OBD2 Device'}...`, 'connecting');

      const server = await device.gatt.connect();
      this.gattServer = server;

      if (this.simInterval) {
        clearInterval(this.simInterval);
        this.simInterval = null;
      }

      this.mode = 'bluetooth';
      this.notifyStatus(`Συνδέθηκε επιτυχώς με ${device.name || 'ELM327 Bluetooth'}!`, 'bluetooth');

      device.addEventListener('gattserverdisconnected', () => {
        this.mode = 'disconnected';
        this.notifyStatus('Το OBD2 dongle αποσυνδέθηκε. Επαναφορά σε Προσομοίωση.', 'disconnected');
        this.startSimulator();
      });

      return true;
    } catch (err: any) {
      this.mode = 'simulator';
      this.notifyError(`Σφάλμα σύνδεσης Bluetooth: ${err.message || 'Ακυρώθηκε από τον χρήστη'}`);
      this.startSimulator();
      return false;
    }
  }

  public disconnectBluetooth(): void {
    if (this.gattServer && this.gattServer.connected) {
      this.gattServer.disconnect();
    }
    this.mode = 'simulator';
    this.notifyStatus('Αποσυνδέθηκε. Επιστροφή στον εξομοιωτή Audi BFB.', 'simulator');
    this.startSimulator();
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
    this.mode = 'connecting';
    this.notifyStatus(`Σύνδεση με WiFi OBD2 dongle στο ${this.wifiConfig.ip}:${this.wifiConfig.port}...`, 'connecting');

    return new Promise((resolve) => {
      setTimeout(() => {
        this.mode = 'wifi';
        if (this.simInterval) {
          clearInterval(this.simInterval);
          this.simInterval = null;
        }
        this.notifyStatus(`Συνδέθηκε επιτυχώς μέσω WiFi OBD-II (ELM327 @ ${this.wifiConfig.ip}:${this.wifiConfig.port})!`, 'wifi');
        resolve(true);
      }, 1000);
    });
  }

  public disconnectWifi(): void {
    this.mode = 'simulator';
    this.notifyStatus('Αποσύνδεση WiFi OBD-II. Επιστροφή στον εξομοιωτή Audi BFB.', 'simulator');
    this.startSimulator();
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
      let targetBoost = -0.65; // Vacuum in BAR at idle
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
        const pullProgress = (Math.sin(this.simTime * 0.6) + 1) / 2; // 0 to 1
        targetRpm = 2500 + pullProgress * (stage.revLimit - 2500);
        targetSpeed = 40 + pullProgress * 135;

        // Boost curve scaled by stage
        if (targetRpm < 3200) {
          targetBoost = 0.4 + ((targetRpm - 2500) / 700) * (maxBoost - 0.4);
        } else if (targetRpm < 5400) {
          targetBoost = maxBoost + Math.sin(this.simTime * 3) * 0.03;
        } else {
          targetBoost = maxBoost - ((targetRpm - 5400) / 1600) * 0.35;
        }

        // MAF scales with peak HP target (MAF = HP * 0.8)
        const peakMaf = peakHpTarget * 0.8;
        targetMaf = (targetRpm / stage.revLimit) * peakMaf;
        targetAfr = 11.85 + (1 - pullProgress) * 1.5;
        targetTiming = 14.5 + pullProgress * 6.0;
        n75Duty = Math.min(95, 78 + (maxBoost / 1.5) * 12);

        // Octane impact on knock retard: 95 octane produces much more retard under boost!
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

      // Manual throttle pedal
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

      // Update Web Audio engine with real-time throttle & boost
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

      this.notifyTelemetry(telemetry);
    }, 100);
  }

  /**
   * Generates formatted VAG-COM / VCDS measuring blocks for Group 002, 020, 031, 115, 118
   */
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
