import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, WorkTurn, UserRole, TurnShift, BusinessType } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/utils/uuid';
import { useAuditStore } from './auditStore';

interface UserState {
  currentUser: User | null;
  users: User[];
  currentTurn: WorkTurn | null;
  turnsHistory: WorkTurn[];

  // Auth
  login: (email: string, password: string) => Promise<User | null>;
  loginWithPin: (userId: string, pin: string) => Promise<User | null>;
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'>) => User;

  // PIN management
  setPin: (userId: string, pin: string) => void;
  verifyPin: (userId: string, pin: string) => boolean;
  resetPinAttempts: (userId: string) => void;
  isProfileActive: (userId: string) => boolean;

  // Role helpers
  isAdmin: () => boolean;
  canAccessMetrics: () => boolean;
  canWorkInBusiness: (business: BusinessType) => boolean;

  // Turn management (ahora con businessId)
  startTurn: (businessId: BusinessType, shift: TurnShift) => WorkTurn;
  endTurn: () => WorkTurn | null;
  getCurrentTurn: () => WorkTurn | null;
  getTurnsByBusiness: (businessId: BusinessType) => WorkTurn[];

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
  getUsersByBusiness: (business: BusinessType) => User[];
}

const DEFAULT_USERS: User[] = [
  {
    id: 'admin-1',
    name: 'Marta (Dueña)',
    email: 'marta@dippy.com',
    role: 'admin',
    avatar: '👩‍💼',
    businesses: ['kiosko', 'delivery'],
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'cajero-1',
    name: 'Juan (Cajero)',
    role: 'cajero',
    avatar: '👨‍💼',
    businesses: ['kiosko'],
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'cajero-2',
    name: 'María (Cajera Delivery)',
    role: 'cajero',
    avatar: '👩‍💼',
    businesses: ['delivery'],
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'dual-1',
    name: 'Carlos (Multi)',
    role: 'cajero',
    avatar: '🧑‍💼',
    businesses: ['kiosko', 'delivery'],
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'ayudante-1',
    name: 'Pedro (Ayudante)',
    role: 'ayudante',
    avatar: '👨‍🍳',
    businesses: ['kiosko', 'delivery'],
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
        const user = get().users.find(u => u.email === email && u.isActive);
        if (user) {
          const updatedUser = { ...user, lastLoginAt: new Date().toISOString() };
          set(state => ({
            currentUser: updatedUser,
            users: state.users.map(u => u.id === user.id ? updatedUser : u),
          }));
          useAuditStore.getState().log({
            action: 'login',
            userId: user.id,
            userName: user.name,
            description: 'Login con email',
          });
          return updatedUser;
        }
        return null;
      },

      loginWithPin: async (userId, pin) => {
        const user = get().users.find(u => u.id === userId && u.isActive);
        if (!user) return null;

        if (user.pin) {
          if (user.isLocked) {
            throw new Error('Cuenta bloqueada. Contacte al administrador.');
          }

          if (user.pin !== pin) {
            const newAttempts = (user.pinAttempts || 0) + 1;
            const isLocked = newAttempts >= 3;

            set(state => ({
              users: state.users.map(u =>
                u.id === userId ? { ...u, pinAttempts: newAttempts, isLocked } : u
              ),
            }));

            if (isLocked) {
              throw new Error('Cuenta bloqueada por 3 intentos fallidos. Contacte al administrador.');
            }

            throw new Error(`PIN incorrecto. Intentos restantes: ${3 - newAttempts}`);
          }

          const updatedUser = {
            ...user,
            lastLoginAt: new Date().toISOString(),
            pinAttempts: 0,
            isLocked: false,
          };

          set(state => ({
            currentUser: updatedUser,
            users: state.users.map(u => u.id === userId ? updatedUser : u),
          }));

          useAuditStore.getState().log({
            action: 'login',
            userId: user.id,
            userName: user.name,
            description: 'Login con PIN',
          });

          return updatedUser;
        }

        const updatedUser = { ...user, lastLoginAt: new Date().toISOString() };
        set(state => ({
          currentUser: updatedUser,
          users: state.users.map(u => u.id === userId ? updatedUser : u),
        }));
        return updatedUser;
      },

      logout: () => {
        const user = get().currentUser;
        if (get().currentTurn) {
          get().endTurn();
        }
        set({ currentUser: null });
        if (user) {
          useAuditStore.getState().log({
            action: 'logout',
            userId: user.id,
            userName: user.name,
            description: 'Cierre de sesión',
          });
        }
      },

      isAdmin: () => {
        const user = get().currentUser;
        return user?.role === 'admin';
      },

      canAccessMetrics: () => {
        const user = get().currentUser;
        return user?.role === 'admin';
      },

      canWorkInBusiness: (business) => {
        const user = get().currentUser;
        if (!user) return false;
        if (user.role === 'admin') return true;
        return user.businesses.includes(business);
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

      setPin: (userId, pin) => {
        if (!/^\d{4}$/.test(pin)) {
          throw new Error('El PIN debe ser de 4 dígitos numéricos');
        }

        set(state => ({
          users: state.users.map(u =>
            u.id === userId ? { ...u, pin } : u
          ),
          currentUser: state.currentUser?.id === userId
            ? { ...state.currentUser, pin }
            : state.currentUser,
        }));
      },

      verifyPin: (userId, pin) => {
        const user = get().users.find(u => u.id === userId);
        if (!user) return false;
        return user.pin === pin;
      },

      resetPinAttempts: (userId) => {
        set(state => ({
          users: state.users.map(u =>
            u.id === userId ? { ...u, pinAttempts: 0, isLocked: false } : u
          ),
        }));
      },

      isProfileActive: (userId) => {
        const user = get().users.find(u => u.id === userId);
        return user?.isActive ?? false;
      },

      startTurn: (businessId, shift) => {
        const user = get().currentUser;
        if (!user) throw new Error('No hay usuario logueado');

        const existingTurn = get().currentTurn;
        if (existingTurn && existingTurn.isActive) {
          throw new Error('Ya hay un turno activo');
        }

        const newTurn: WorkTurn = {
          id: generateId(),
          businessId,
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
        useAuditStore.getState().log({
          action: 'turn_started',
          userId: user.id,
          userName: user.name,
          businessId,
          description: `Turno ${shift} iniciado`,
        });
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

        useAuditStore.getState().log({
          action: 'turn_ended',
          userId: turn.userId,
          userName: turn.userName,
          businessId: turn.businessId,
          description: `Turno finalizado — ${turn.totalOrders} ventas`,
          metadata: { totalSales: turn.totalSales },
        });

        return completedTurn;
      },

      getCurrentTurn: () => get().currentTurn,

      getTurnsByBusiness: (businessId) => {
        return get().turnsHistory.filter(t => t.businessId === businessId);
      },

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
        return get().turnsHistory.filter(
          t =>
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
          users: state.users.map(u => (u.id === id ? { ...u, ...data } : u)),
          currentUser:
            state.currentUser?.id === id
              ? { ...state.currentUser, ...data }
              : state.currentUser,
        }));
      },

      deleteUser: (id) => {
        set(state => ({
          users: state.users.filter(u => u.id !== id),
        }));
      },

      getUsers: () => get().users.filter(u => u.isActive),

      getUsersByBusiness: (business) => {
        return get().users.filter(
          u => u.isActive && (u.role === 'admin' || u.businesses.includes(business))
        );
      },
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
