import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/utils/uuid';
import { BusinessType } from '@/types';

export type ReturnReason = 'defective' | 'wrong_item' | 'changed_mind' | 'allergic' | 'other';

export interface Return {
  id: string;
  originalOrderId: string;
  businessId: BusinessType;
  items: { productId: string; productName: string; quantity: number; unitPrice: number; reason: ReturnReason }[];
  totalRefund: number;
  refundMethod: 'cash' | 'card' | 'transfer' | 'credit';
  processedBy: string;
  processedByName: string;
  notes?: string;
  createdAt: string;
}

interface ReturnState {
  returns: Return[];

  processReturn: (data: Omit<Return, 'id' | 'createdAt'>) => Return;
  getReturns: (businessId?: BusinessType) => Return[];
  getReturnById: (id: string) => Return | undefined;
  getReturnsByOrder: (orderId: string) => Return[];
  getTotalRefunds: (businessId: BusinessType, date?: string) => number;
}

export const useReturnStore = create<ReturnState>()(
  persist(
    (set, get) => ({
      returns: [],

      processReturn: (data) => {
        const ret: Return = {
          ...data,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set(state => ({ returns: [ret, ...state.returns] }));
        return ret;
      },

      getReturns: (businessId) => {
        let returns = get().returns;
        if (businessId) returns = returns.filter(r => r.businessId === businessId);
        return returns;
      },

      getReturnById: (id) => get().returns.find(r => r.id === id),

      getReturnsByOrder: (orderId) => get().returns.filter(r => r.originalOrderId === orderId),

      getTotalRefunds: (businessId, date) => {
        let returns = get().returns.filter(r => r.businessId === businessId);
        if (date) {
          returns = returns.filter(r => r.createdAt.startsWith(date));
        }
        return returns.reduce((sum, r) => sum + r.totalRefund, 0);
      },
    }),
    {
      name: 'dippy-returns',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
