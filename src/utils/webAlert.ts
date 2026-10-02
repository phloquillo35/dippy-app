import { Alert, Platform } from 'react-native';
import type { AlertButton } from 'react-native';
import { create } from 'zustand';

// En la versión web de React Native, `Alert.alert` no hace nada: confirmaciones como "Confirmar venta"
// nunca aparecían y el botón Cobrar parecía muerto. Acá se reemplaza solo en web por un modal propio
// (ver WebAlertHost). En iOS y Android se sigue usando el Alert nativo.

export interface WebAlertItem {
  id: number;
  title: string;
  message?: string;
  buttons: AlertButton[];
  cancelable: boolean;
  onDismiss?: () => void;
}

interface WebAlertState {
  queue: WebAlertItem[];
  push: (alert: WebAlertItem) => void;
  shift: () => void;
}

export const useWebAlertStore = create<WebAlertState>((set) => ({
  queue: [],
  push: (alert) => set((s) => ({ queue: [...s.queue, alert] })),
  shift: () => set((s) => ({ queue: s.queue.slice(1) })),
}));

let nextId = 1;
let installed = false;

export function installWebAlert() {
  if (Platform.OS !== 'web' || installed) return;
  installed = true;

  Alert.alert = (title, message, buttons, options) => {
    useWebAlertStore.getState().push({
      id: nextId++,
      title,
      message,
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }],
      cancelable: options?.cancelable ?? false,
      onDismiss: options?.onDismiss,
    });
  };
}
