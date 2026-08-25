import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/utils/uuid';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string;
  createdAt: string;
  isActive: boolean;
  businessIds: string[];
}

interface CustomerState {
  customers: Customer[];

  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'totalOrders' | 'totalSpent' | 'isActive'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  getCustomerByPhone: (phone: string) => Customer | undefined;
  getCustomers: () => Customer[];
  searchCustomers: (query: string) => Customer[];
  recordOrder: (customerId: string, amount: number) => void;
  getTopCustomers: (limit?: number) => Customer[];
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: [],

      addCustomer: (data) => {
        const existing = get().customers.find(c => c.phone === data.phone && c.phone !== '');
        if (existing) return existing;

        const customer: Customer = {
          ...data,
          id: generateId(),
          totalOrders: 0,
          totalSpent: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        set(state => ({ customers: [...state.customers, customer] }));
        return customer;
      },

      updateCustomer: (id, data) => {
        set(state => ({
          customers: state.customers.map(c => c.id === id ? { ...c, ...data } : c),
        }));
      },

      deleteCustomer: (id) => {
        set(state => ({
          customers: state.customers.map(c => c.id === id ? { ...c, isActive: false } : c),
        }));
      },

      getCustomerByPhone: (phone) => {
        return get().customers.find(c => c.phone === phone && c.isActive);
      },

      getCustomers: () => get().customers.filter(c => c.isActive),

      searchCustomers: (query) => {
        const q = query.toLowerCase();
        return get().customers.filter(c =>
          c.isActive && (
            c.name.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            c.address.toLowerCase().includes(q)
          )
        );
      },

      recordOrder: (customerId, amount) => {
        set(state => ({
          customers: state.customers.map(c =>
            c.id === customerId
              ? {
                  ...c,
                  totalOrders: c.totalOrders + 1,
                  totalSpent: c.totalSpent + amount,
                  lastOrderAt: new Date().toISOString(),
                }
              : c
          ),
        }));
      },

      getTopCustomers: (limit = 10) => {
        return get().customers
          .filter(c => c.isActive)
          .sort((a, b) => b.totalSpent - a.totalSpent)
          .slice(0, limit);
      },
    }),
    {
      name: 'dippy-customers',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
