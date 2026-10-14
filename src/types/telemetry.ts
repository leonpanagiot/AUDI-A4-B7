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
  rpm: number;
  speed: number;
  boostBar: number;
  boostPsi: number;
  peakBoostBar: number;
  coolantTemp: number; // °C
  iat: number; // Intake Air Temp °C
  oilTemp: number; // °C
  oilPressure: number; // bar
  mafGramsPerSec: number; // g/s
  calculatedHp: number; // Estimated BHP
  calculatedTorque: number; // Nm
  lambda: number; // e.g. 1.00, 0.85
  afr: number; // e.g. 14.7, 12.5
  ignitionTiming: number; // degrees BTDC
  knockRetard: [number, number, number, number]; // Cyl 1, 2, 3, 4 retard in deg CF
  n75DutyCycle: number; // % wastegate duty
  batteryVoltage: number; // V
  throttlePosition: number; // %
  engineLoad?: number; // % from PID 0104
  lambdaSpecified?: number; // Target Lambda from PID 0144 or ME7.5 load map
  shortTermFuelTrim?: number; // % from PID 0106
  o2SensorVoltage?: number; // Pre-cat O2 sensor (V)
  o2SensorAfterVoltage?: number; // Post-cat O2 sensor after catalyst (V)
  injectionTimeMs?: number; // Injector open time (ms)
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
  rpm: number;
  speed: number;
  boostBar: number;
  maf: number;
  afr: number;
  timing: number;
  knockMax: number;
  iat: number;
}

export interface VagBlockField {
  label: string;
  value: string | number;
  unit: string;
  normalRange: string;
  isWarning?: boolean;
}

export interface VagBlockGroup {
  groupNum: string;
  title: string;
  greekTitle: string;
  description: string;
  fields: [VagBlockField, VagBlockField, VagBlockField, VagBlockField];
}
