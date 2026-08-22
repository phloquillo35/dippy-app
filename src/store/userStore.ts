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

      loginWithPin: async (userId, pin) => {
        const user = get().users.find(u => u.id === userId && u.isActive);
        if (!user) return null;
        
        // Si el usuario tiene PIN configurado, verificarlo
        if (user.pin) {
          // Verificar si está bloqueado
          if (user.isLocked) {
            throw new Error('Cuenta bloqueada. Contacte al administrador.');
          }
          
          // Verificar PIN
          if (user.pin !== pin) {
            // Incrementar intentos fallidos
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
          
          // PIN correcto, resetear intentos
          const updatedUser = { 
            ...user, 
            lastLoginAt: new Date().toISOString(),
            pinAttempts: 0,
            isLocked: false
          };
          
          set(state => ({
            currentUser: updatedUser,
            users: state.users.map(u => u.id === userId ? updatedUser : u),
          }));
          
          return updatedUser;
        }
        
        // Si no tiene PIN configurado, permitir login sin PIN (admin inicial)
        const updatedUser = { ...user, lastLoginAt: new Date().toISOString() };
        set(state => ({
          currentUser: updatedUser,
          users: state.users.map(u => u.id === userId ? updatedUser : u),
        }));
        return updatedUser;
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

      setPin: (userId, pin) => {
        // Validar que el PIN sea de 4 dígitos
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