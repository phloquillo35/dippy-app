import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Provider, ProviderProduct, ProductCategory } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/utils/uuid';

interface ProviderState {
  providers: Provider[];
  providerProducts: ProviderProduct[];

  addProvider: (provider: Omit<Provider, 'id' | 'createdAt' | 'updatedAt'>) => Provider;
  updateProvider: (id: string, data: Partial<Provider>) => void;
  deleteProvider: (id: string) => void;
  getProviders: () => Provider[];
  getProviderById: (id: string) => Provider | undefined;
  getProvidersByCategory: (category: ProductCategory) => Provider[];

  addProviderProduct: (product: Omit<ProviderProduct, 'id' | 'lastUpdated'>) => ProviderProduct;
  updateProviderProduct: (id: string, data: Partial<ProviderProduct>) => void;
  deleteProviderProduct: (id: string) => void;
  getProviderProducts: (providerId: string) => ProviderProduct[];
}

const DEFAULT_PROVIDERS: Provider[] = [
  {
    id: 'prov-1',
    name: 'Distribuidora Norte',
    contactPerson: 'Roberto García',
    email: 'roberto@distnorte.com.ar',
    phone: '+54 11 4567-8901',
    address: 'Av. San Martín 1234, Buenos Aires',
    cuit: '30-71234567-9',
    paymentTerms: '30 días',
    categories: ['limpieza', 'gaseosas', 'caramelos'],
    rating: 4,
    isPreferred: true,
    isActive: true,
    notes: 'Entrega los martes y jueves',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prov-2',
    name: 'Casa del Utensilio',
    contactPerson: 'María López',
    email: 'ventas@casadelutensilio.com.ar',
    phone: '+54 11 5678-9012',
    address: 'Belgrano 567, CABA',
    cuit: '30-82345678-0',
    paymentTerms: 'Contado / Transferencia',
    categories: ['cocina'],
    rating: 3,
    isPreferred: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prov-3',
    name: 'Frigorífico del Sur',
    contactPerson: 'Carlos Méndez',
    email: 'pedidos@frigodesur.com.ar',
    phone: '+54 11 6789-0123',
    address: 'Ruta 8 km 52, Pilar',
    cuit: '30-93456789-1',
    paymentTerms: '15 días',
    categories: ['fiambres', 'comida_preparada'],
    rating: 5,
    isPreferred: true,
    isActive: true,
    notes: ' Producto fresco, entrega diaria excepto domingos',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prov-4',
    name: 'Panadería Artesanal Don Pedro',
    contactPerson: 'Pedro Álvarez',
    email: 'donpedro@panaderia.com.ar',
    phone: '+54 11 7890-1234',
    address: 'Av. Belgrano 890, San Telmo',
    cuit: '20-12345678-9',
    paymentTerms: 'Contado diario',
    categories: ['panaderia'],
    rating: 4,
    isPreferred: true,
    isActive: true,
    notes: 'Entrega de 6:00 a 10:00 AM',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useProviderStore = create<ProviderState>()(
  persist(
    (set, get) => ({
      providers: DEFAULT_PROVIDERS,
      providerProducts: [],

      addProvider: (providerData) => {
        const provider: Provider = {
          ...providerData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set(state => ({ providers: [...state.providers, provider] }));
        return provider;
      },

      updateProvider: (id, data) => {
        set(state => ({
          providers: state.providers.map(p =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      deleteProvider: (id) => {
        set(state => ({
          providers: state.providers.map(p =>
            p.id === id ? { ...p, isActive: false } : p
          ),
        }));
      },

      getProviders: () => get().providers.filter(p => p.isActive),

      getProviderById: (id) => get().providers.find(p => p.id === id),

      getProvidersByCategory: (category) =>
        get().providers.filter(p => p.isActive && p.categories.includes(category)),

      addProviderProduct: (productData) => {
        const product: ProviderProduct = {
          ...productData,
          id: generateId(),
          lastUpdated: new Date().toISOString(),
        };
        set(state => ({
          providerProducts: [...state.providerProducts, product],
        }));
        return product;
      },

      updateProviderProduct: (id, data) => {
        set(state => ({
          providerProducts: state.providerProducts.map(p =>
            p.id === id ? { ...p, ...data, lastUpdated: new Date().toISOString() } : p
          ),
        }));
      },

      deleteProviderProduct: (id) => {
        set(state => ({
          providerProducts: state.providerProducts.filter(p => p.id !== id),
        }));
      },

      getProviderProducts: (providerId) =>
        get().providerProducts.filter(p => p.providerId === providerId),
    }),
    {
      name: 'dippy-providers',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        providers: state.providers,
        providerProducts: state.providerProducts,
      }),
    }
  )
);