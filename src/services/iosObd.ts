import { registerPlugin } from '@capacitor/core';

export interface IosObdPlugin {
  connect(options: { host: string; port: number }): Promise<{ connected: boolean }>;
  command(options: { command: string }): Promise<{ response: string }>;
  disconnect(): Promise<void>;
}

export const iosObd = registerPlugin<IosObdPlugin>('IosObd');
