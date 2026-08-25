/**
 * Setup para correr los stores en Node:
 * - Polyfill de window.localStorage (AsyncStorage lo usa cuando detecta web)
 * - Mapa expuesto para verificar persistencia
 * Debe importarse PRIMERO (antes que cualquier store).
 */
const memStorage = new Map<string, string>();

(globalThis as any).window = {
  localStorage: {
    getItem: (k: string) => memStorage.get(k) ?? null,
    setItem: (k: string, v: string) => { memStorage.set(k, String(v)); },
    removeItem: (k: string) => { memStorage.delete(k); },
    clear: () => memStorage.clear(),
  },
};

export const storageData = memStorage;
