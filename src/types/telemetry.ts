export type EngineStageId = 'stock' | 'stage1' | 'stage2' | 'stage3_k04';
export type FuelOctane = 95 | 98 | 100;
export type CockpitTheme = 'rs-red' | 'sline-white' | 'stealth-green';
export type UnitsMode = 'metric' | 'imperial';

export interface EngineStageConfig {
  id: EngineStageId;
  name: string;
  badge: string;
  description: string;
  greekDescription: string;
  maxBoostBar: number;
  peakHp: number;
  peakTorqueNm: number;
  revLimit: number;
  hardware: string;
}

export interface TelemetryData {
  rpm: number | null;
  speed: number | null;
  boostBar: number | null;
  boostPsi: number | null;
  peakBoostBar: number | null;
  coolantTemp: number | null; // °C (PID 0105)
  iat: number | null; // Intake Air Temp °C (PID 010F)
  oilTemp: number | null; // °C (PID 015C - null/N/A if unsupported)
  oilPressure: number | null; // bar (null/N/A without real sensor)
  mafGramsPerSec: number | null; // g/s (PID 0110)
  calculatedHp: number | null; // null unless real torque/power PID responds
  calculatedTorque: number | null; // Nm
  lambda: number | null; // Real Wideband PID 0124 / 0134
  afr: number | null; // Real Wideband AFR
  ignitionTiming: number | null; // degrees BTDC (PID 010E)
  knockRetard: [number | null, number | null, number | null, number | null]; // Cyl 1-4 CF (only from real KWP Group 020)
  n75DutyCycle: number | null; // % wastegate duty (only from real KWP Group 114/118)
  batteryVoltage: number | null; // V (ATRV or PID 0142)
  throttlePosition: number | null; // % (PID 0111)
  engineLoad: number | null; // % (PID 0104)
  lambdaSpecified: number | null; // Target Lambda (PID 0144 or KWP Group 031)
  shortTermFuelTrim: number | null; // % (PID 0106)
  longTermFuelTrim: number | null; // % (PID 0107)
  o2SensorVoltage: number | null; // Pre-cat O2 sensor V (PID 0114 / 0124)
  o2SensorAfterVoltage: number | null; // Post-cat O2 sensor after catalyst V (PID 0115)
  injectionTimeMs: number | null; // Injector open time ms (only from real KWP Group 002)
  timestamp: number;
}

export interface DTCFault {
  code: string;
  vagCode?: string;
  title: string;
  description: string;
  greekDescription: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  system: 'Turbo / Boost' | 'Ignition / Fuel' | 'Sensors' | 'Emissions' | 'Cooling';
  status: 'Active' | 'Pending' | 'Stored';
}

export interface PerformanceRun {
  id: string;
  date: string;
  zeroToHundredTime: number; // seconds
  hundredToTwoHundredTime?: number;
  quarterMileTime: number;
  quarterMileTrapSpeed: number;
  peakGForce: number;
  notes?: string;
}

export interface TelemetryLogEntry {
  time: string;
  rpm: number | null;
  speed: number | null;
  boostBar: number | null;
  specifiedBoostMbar: number | null;
  actualBoostMbar: number | null;
  maf: number | null;
  engineLoad: number | null;
  throttle: number | null;
  injectionTime: number | null;
  lambda: number | null;
  lambdaSpecified: number | null;
  afr: number | null;
  stft: number | null;
  ltft: number | null;
  o2After: number | null;
  timing: number | null;
  knockMax: number | null;
  knockCyl1: number | null;
  knockCyl2: number | null;
  knockCyl3: number | null;
  knockCyl4: number | null;
  iat: number | null;
  coolant: number | null;
  oilTemp: number | null;
  oilPressure: number | null;
  n75: number | null;
  hp: number | null;
  battery: number | null;
}

export interface VagBlockField {
  label: string;
  value: string | number;
  unit: string;
  normalRange: string;
  sourcePid?: string;
  isWarning?: boolean;
}

export interface VagBlockGroup {
  groupNum: string;
  title: string;
  greekTitle: string;
  description: string;
  rawHexResponse?: string;
  sourceMode?: string;
  fields: [VagBlockField, VagBlockField, VagBlockField, VagBlockField];
}
