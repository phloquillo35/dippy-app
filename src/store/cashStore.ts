import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CashRegister, CashMovement, BusinessType, PaymentMethod } from '@/types';
import { generateId } from '@/utils/uuid';
import { useAuditStore } from './auditStore';

interface CashState {
  registers: CashRegister[];

  openRegister: (businessId: BusinessType, openingAmount: number, userId: string, userName: string) => CashRegister;
  closeRegister: (registerId: string, closingAmount: number, userId: string, userName: string) => void;
  addMovement: (registerId: string, movement: Omit<CashMovement, 'id' | 'createdAt'>) => void;
  getOpenRegister: (businessId: BusinessType) => CashRegister | null;
  getTodayRegister: (businessId: BusinessType) => CashRegister | null;
  getRegisterHistory: (businessId: BusinessType, days?: number) => CashRegister[];
  getDailyReport: (date: string) => {
    kiosko: CashRegister | null;
    delivery: CashRegister | null;
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
  };
  getBusinessReport: (businessId: BusinessType, date: string) => CashRegister | null;
}

export const useCashStore = create<CashState>()(
  persist(
    (set, get) => ({
      registers: [],

      openRegister: (businessId, openingAmount, userId, userName) => {
        const today = new Date().toISOString().split('T')[0];

        const existing = get().registers.find(
          r => r.businessId === businessId && r.date === today && r.status === 'open'
        );
        if (existing) {
          throw new Error('Ya hay una caja abierta para este negocio hoy');
        }

        const register: CashRegister = {
          id: generateId(),
          businessId,
          date: today,
          openingAmount,
          cashIn: 0,
          cashOut: 0,
          transfersIn: 0,
          cardIn: 0,
          mercadopagoIn: 0,
          closingAmount: null,
          status: 'open',
          openedBy: userId,
          openedByName: userName,
          movements: [],
        };

        set(state => ({ registers: [register, ...state.registers] }));
        useAuditStore.getState().log({
          action: 'cash_open',
          userId,
          userName,
          businessId,
          description: `Caja abierta con $${openingAmount.toLocaleString()}`,
        });
        return register;
      },

      closeRegister: (registerId, closingAmount, userId, userName) => {
        const register = get().registers.find(r => r.id === registerId);
        set(state => ({
          registers: state.registers.map(r =>
            r.id === registerId
              ? {
                  ...r,
                  status: 'closed' as const,
                  closingAmount,
                  closedBy: userId,
                  closedByName: userName,
                  closedAt: new Date().toISOString(),
                }
              : r
          ),
        }));
        if (register) {
          useAuditStore.getState().log({
            action: 'cash_close',
            userId,
            userName,
            businessId: register.businessId,
            description: `Caja cerrada — monto final $${closingAmount.toLocaleString()}`,
          });
        }
      },

      addMovement: (registerId, movementData) => {
        const movement: CashMovement = {
          ...movementData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };

        set(state => ({
          registers: state.registers.map(r => {
            if (r.id !== registerId) return r;

            const updates: Partial<CashRegister> = {
              movements: [...r.movements, movement],
            };

            if (movement.type === 'sale') {
              switch (movement.paymentMethod) {
                case 'efectivo':
                  updates.cashIn = r.cashIn + movement.amount;
                  break;
                case 'transferencia':
                  updates.transfersIn = r.transfersIn + movement.amount;
                  break;
                case 'tarjeta':
                  updates.cardIn = r.cardIn + movement.amount;
                  break;
                case 'mercadopago':
                  updates.mercadopagoIn = r.mercadopagoIn + movement.amount;
                  break;
                case 'qr':
                  updates.mercadopagoIn = r.mercadopagoIn + movement.amount;
                  break;
              }
            } else if (
              movement.type === 'expense' ||
              movement.type === 'withdrawal' ||
              movement.type === 'supplier_payment'
            ) {
              updates.cashOut = r.cashOut + movement.amount;
            } else if (movement.type === 'deposit') {
              updates.cashIn = r.cashIn + movement.amount;
            }

            return { ...r, ...updates };
          }),
        }));
      },

      getOpenRegister: (businessId) => {
        const today = new Date().toISOString().split('T')[0];
        return (
          get().registers.find(
            r => r.businessId === businessId && r.date === today && r.status === 'open'
          ) || null
        );
      },

      getTodayRegister: (businessId) => {
        const today = new Date().toISOString().split('T')[0];
        return (
          get().registers.find(
            r => r.businessId === businessId && r.date === today
          ) || null
        );
      },

      getRegisterHistory: (businessId, days = 30) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return get().registers
          .filter(r => r.businessId === businessId && new Date(r.date) >= cutoff)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },

      getDailyReport: (date) => {
        const kiosko = get().registers.find(
          r => r.businessId === 'kiosko' && r.date === date
        ) || null;
        const delivery = get().registers.find(
          r => r.businessId === 'delivery' && r.date === date
        ) || null;

        const kioskoRevenue = kiosko
          ? kiosko.cashIn + kiosko.transfersIn + kiosko.cardIn + kiosko.mercadopagoIn
          : 0;
        const deliveryRevenue = delivery
          ? delivery.cashIn + delivery.transfersIn + delivery.cardIn + delivery.mercadopagoIn
          : 0;

        const kioskoExpenses = kiosko ? kiosko.cashOut : 0;
        const deliveryExpenses = delivery ? delivery.cashOut : 0;

        return {
          kiosko,
          delivery,
          totalRevenue: kioskoRevenue + deliveryRevenue,
          totalExpenses: kioskoExpenses + deliveryExpenses,
          netProfit: kioskoRevenue + deliveryRevenue - kioskoExpenses - deliveryExpenses,
        };
      },

      getBusinessReport: (businessId, date) => {
        return (
          get().registers.find(
            r => r.businessId === businessId && r.date === date
          ) || null
        );
      },
    }),
    {
      name: 'dippy-cash',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        registers: state.registers.slice(0, 500),
      }),
    }
  )
);
