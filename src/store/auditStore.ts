import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/utils/uuid';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'sale'
  | 'order_created'
  | 'order_cancelled'
  | 'order_status_changed'
  | 'cash_open'
  | 'cash_close'
  | 'cash_movement'
  | 'product_created'
  | 'product_updated'
  | 'product_deleted'
  | 'stock_adjustment'
  | 'stock_return'
  | 'user_created'
  | 'user_deleted'
  | 'pin_set'
  | 'turn_started'
  | 'turn_ended'
  | 'coupon_created'
  | 'coupon_used'
  | 'return_processed'
  | 'backup_exported'
  | 'supplier_payment';

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  userId: string;
  userName: string;
  businessId?: string;
  description: string;
  metadata?: Record<string, any>;
}

interface AuditState {
  entries: AuditEntry[];
  log: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  getEntries: (filters?: { action?: AuditAction; userId?: string; businessId?: string; from?: string; to?: string }) => AuditEntry[];
  getRecentEntries: (limit?: number) => AuditEntry[];
  clearOldEntries: (daysToKeep?: number) => void;
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set, get) => ({
      entries: [],

      log: (entry) => {
        const newEntry: AuditEntry = {
          ...entry,
          id: generateId(),
          timestamp: new Date().toISOString(),
        };
        set(state => ({
          entries: [newEntry, ...state.entries].slice(0, 2000),
        }));
      },

      getEntries: (filters) => {
        let entries = get().entries;
        if (filters?.action) entries = entries.filter(e => e.action === filters.action);
        if (filters?.userId) entries = entries.filter(e => e.userId === filters.userId);
        if (filters?.businessId) entries = entries.filter(e => e.businessId === filters.businessId);
        if (filters?.from) entries = entries.filter(e => e.timestamp >= filters.from!);
        if (filters?.to) entries = entries.filter(e => e.timestamp <= filters.to!);
        return entries;
      },

      getRecentEntries: (limit = 50) => get().entries.slice(0, limit),

      clearOldEntries: (daysToKeep = 90) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysToKeep);
        const cutoffStr = cutoff.toISOString();
        set(state => ({
          entries: state.entries.filter(e => e.timestamp >= cutoffStr),
        }));
      },
    }),
    {
      name: 'dippy-audit',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        entries: state.entries.slice(0, 2000),
      }),
    }
  )
);
