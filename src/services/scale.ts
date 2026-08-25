import { Platform } from 'react-native';

export interface ScaleReading {
  weight: number;
  unit: 'kg' | 'g';
  stable: boolean;
  timestamp: string;
}

class ScaleService {
  private ws: WebSocket | null = null;
  private onReading: ((reading: ScaleReading) => void) | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(url: string, onReading: (reading: ScaleReading) => void) {
    this.onReading = onReading;

    try {
      this.ws = new WebSocket(url);

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.weight !== undefined) {
            this.onReading?.({
              weight: data.weight,
              unit: data.unit || 'g',
              stable: data.stable ?? true,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (e) {
          // Try parsing as plain number
          const weight = parseFloat(event.data);
          if (!isNaN(weight)) {
            this.onReading?.({
              weight,
              unit: 'g',
              stable: true,
              timestamp: new Date().toISOString(),
            });
          }
        }
      };

      this.ws.onclose = () => {
        this.reconnectTimer = setTimeout(() => {
          if (this.onReading) this.connect(url, this.onReading);
        }, 3000);
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch (e) {
      console.log('Scale WebSocket not available:', e);
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.onReading = null;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // For Bluetooth scales on mobile
  async requestBluetoothPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const Bluetooth = await import('expo-bluetooth' as any).catch(() => null);
        if (Bluetooth && Bluetooth.default) {
          const result = await Bluetooth.default.requestPermissionsAsync();
          return result.granted;
        }
        return false;
      } catch {
        return false;
      }
    }
    return true;
  }

  // Simulate reading for testing
  simulateReading(callback: (reading: ScaleReading) => void, intervalMs = 1000) {
    const timer = setInterval(() => {
      const weight = Math.round(Math.random() * 5000); // 0-5000g
      callback({
        weight,
        unit: 'g',
        stable: Math.random() > 0.3,
        timestamp: new Date().toISOString(),
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }

  // Convert reading to usable weight
  formatWeight(reading: ScaleReading): string {
    if (reading.unit === 'kg') {
      return `${reading.weight.toFixed(2)} kg`;
    }
    if (reading.weight >= 1000) {
      return `${(reading.weight / 1000).toFixed(2)} kg`;
    }
    return `${reading.weight} g`;
  }
}

export const scaleService = new ScaleService();
