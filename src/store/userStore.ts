import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, WorkTurn, UserRole, TurnShift } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/utils/uuid';

interface UserState {
  currentUser: User | null;
  users: User[];
  currentTurn: WorkTurn | null;
  turnsHistory: WorkTurn[];
  
  // Auth
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'>) => User;
  
  // Role helpers
  isAdmin: () => boolean;
  canAccessMetrics: () => boolean;
  
  // Turn management
  startTurn: (shift: TurnShift) => WorkTurn;
  endTurn: () => WorkTurn | null;
  getCurrentTurn: () => WorkTurn | null;
  
  // Sales tracking
  recordSale: (amount: number, items: number, channel: 'store' | 'delivery') => void;
  
  // Reports
  getTurnReport: (turnId: string) => WorkTurn | undefined;
  getUserReport: (userId: string, date: string) => WorkTurn[];
  getAllTurns: () => WorkTurn[];
  
  // User management
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'>) => User;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  getUsers: () => User[];
}

const DEFAULT_USERS: User[] = [
  {
    id: 'admin-1',
    name: 'Marta (Dueña)',
    email: 'marta@dippy.com',
    role: 'admin',
    avatar: '👩‍💼',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'cajero-1',
    name: 'Juan (Cajero Mañana)',
    role: 'cajero',
    avatar: '👨‍💼',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'cajero-2',
    name: 'María (Cajero Tarde)',
    role: 'cajero',
    avatar: '👩‍💼',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'ayudante-1',
    name: 'Pedro (Ayudante)',
    role: 'ayudante',
    avatar: '👨‍🍳',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
];

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: DEFAULT_USERS,
      currentTurn: null,
      turnsHistory: [],

      login: async (email, password) => {
        // En producción, validar contra backend
        const user = get().users.find(u => u.email === email && u.isActive);
        if (user) {
          const updatedUser = { ...user, lastLoginAt: new Date().toISOString() };
          set(state => ({
            currentUser: updatedUser,
            users: state.users.map(u => u.id === user.id ? updatedUser : u),
          }));
          return updatedUser;
        }
        return null;
      },

      logout: () => {
        // Si hay turno activo, cerrarlo automáticamente
        if (get().currentTurn) {
          get().endTurn();
        }
        set({ currentUser: null });
      },

      isAdmin: () => {
        const user = get().currentUser;
        return user?.role === 'admin';
      },

      canAccessMetrics: () => {
        const user = get().currentUser;
        return user?.role === 'admin';
      },

      register: (userData) => {
        const newUser: User = {
          ...userData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        set(state => ({ users: [...state.users, newUser] }));
        return newUser;
      },

      startTurn: (shift) => {
        const user = get().currentUser;
        if (!user) throw new Error('No hay usuario logueado');
        
        const existingTurn = get().currentTurn;
        if (existingTurn && existingTurn.isActive) {
          throw new Error('Ya hay un turno activo');
        }

        const newTurn: WorkTurn = {
          id: generateId(),
          userId: user.id,
          userName: user.name,
          shift,
          startTime: new Date().toISOString(),
          totalSales: 0,
          totalItems: 0,
          totalOrders: 0,
          averageTicket: 0,
          isActive: true,
        };

        set({ currentTurn: newTurn });
        return newTurn;
      },

      endTurn: () => {
        const turn = get().currentTurn;
        if (!turn || !turn.isActive) return null;

        const completedTurn: WorkTurn = {
          ...turn,
          endTime: new Date().toISOString(),
          isActive: false,
          averageTicket: turn.totalOrders > 0 ? turn.totalSales / turn.totalOrders : 0,
        };

        set(state => ({
          currentTurn: null,
          turnsHistory: [completedTurn, ...state.turnsHistory],
        }));

        return completedTurn;
      },

      getCurrentTurn: () => get().currentTurn,

      recordSale: (amount, items, channel) => {
        const turn = get().currentTurn;
        if (!turn || !turn.isActive) return;

        const updatedTurn: WorkTurn = {
          ...turn,
          totalSales: turn.totalSales + amount,
          totalItems: turn.totalItems + items,
          totalOrders: turn.totalOrders + 1,
          averageTicket: (turn.totalSales + amount) / (turn.totalOrders + 1),
        };

        set({ currentTurn: updatedTurn });
      },

      getTurnReport: (turnId) => {
        return get().turnsHistory.find(t => t.id === turnId);
      },

      getUserReport: (userId, date) => {
        const targetDate = new Date(date).toDateString();
        return get().turnsHistory.filter(t => 
          t.userId === userId && 
          new Date(t.startTime).toDateString() === targetDate
        );
      },

      getAllTurns: () => get().turnsHistory,

      addUser: (userData) => {
        const newUser: User = {
          ...userData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set(state => ({ users: [...state.users, newUser] }));
        return newUser;
      },

      updateUser: (id, data) => {
        set(state => ({
          users: state.users.map(u => u.id === id ? { ...u, ...data } : u),
          currentUser: state.currentUser?.id === id ? { ...state.currentUser, ...data } : state.currentUser,
        }));
      },

      deleteUser: (id) => {
        set(state => ({
          users: state.users.filter(u => u.id !== id),
        }));
      },

      getUsers: () => get().users.filter(u => u.isActive),
    }),
    {
      name: 'dippy-users',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        users: state.users,
        currentUser: state.currentUser,
        currentTurn: state.currentTurn,
        turnsHistory: state.turnsHistory,
      }),
    }
  )
);