import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product, ProductVariant, ProductCategory, StockMovement } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/utils/uuid';

interface ProductState {
  products: Product[];
  variants: ProductVariant[];
  stockMovements: StockMovement[];
  searchQuery: string;
  selectedCategory: ProductCategory | null;

  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProducts: () => Product[];
  getProductById: (id: string) => Product | undefined;
  getProductByBarcode: (barcode: string) => Product | undefined;

  addVariant: (variant: Omit<ProductVariant, 'id'>) => ProductVariant;
  updateVariant: (id: string, data: Partial<ProductVariant>) => void;
  deleteVariant: (id: string) => void;
  getVariantsByProduct: (productId: string) => ProductVariant[];

  updateStock: (productId: string, quantity: number, type: StockMovement['type'], reason: string, userId: string, userName: string, orderId?: string) => void;

  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: ProductCategory | null) => void;
  searchProducts: (query: string) => Product[];
  getProductsByCategory: (category: ProductCategory) => Product[];
  getLowStockProducts: () => Product[];
}

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-lim-001',
    name: 'Detergente Magistral',
    description: 'Detergente líquido limón 500ml',
    barcode: '7790123456789',
    imageUrl: undefined,
    category: 'limpieza',
    costPrice: 450,
    salePrice: 650,
    stock: 48,
    minStock: 10,
    unit: 'unidad',
    isWeightBased: false,
    providerId: 'prov-1',
    salesChannels: ['store'],
    tags: ['detergente', 'limpieza', 'limón'],
    emoji: '🧴',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-coc-001',
    name: 'Sartén Antiadherente',
    description: 'Sartén 24cm antiadherente Tefal',
    barcode: '7790987654321',
    imageUrl: undefined,
    category: 'cocina',
    costPrice: 8500,
    salePrice: 12900,
    stock: 12,
    minStock: 3,
    unit: 'unidad',
    isWeightBased: false,
    providerId: 'prov-2',
    salesChannels: ['store'],
    tags: ['sartén', 'antiadherente', 'tefal'],
    emoji: '🍳',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-fiam-001',
    name: 'Salame Llanero',
    description: 'Salame artesanal lote 500g',
    barcode: '7795551234567',
    imageUrl: undefined,
    category: 'fiambres',
    costPrice: 2800,
    salePrice: 4200,
    stock: 15,
    minStock: 5,
    unit: 'g',
    isWeightBased: true,
    weightOptions: [
      { id: 'w-100', label: '100g', weightInGrams: 100, price: 840, costPrice: 560 },
      { id: 'w-200', label: '200g', weightInGrams: 200, price: 1600, costPrice: 1050 },
      { id: 'w-500', label: '500g', weightInGrams: 500, price: 3800, costPrice: 2500 },
    ],
    providerId: 'prov-3',
    salesChannels: ['store', 'delivery'],
    tags: ['salame', 'fiambre', 'artesanal'],
    emoji: '🥩',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-gas-001',
    name: 'Coca-Cola',
    description: 'Gaseosa Coca-Cola 2.25L',
    barcode: '7790550000123',
    imageUrl: undefined,
    category: 'gaseosas',
    costPrice: 900,
    salePrice: 1350,
    stock: 72,
    minStock: 20,
    unit: 'unidad',
    isWeightBased: false,
    providerId: 'prov-1',
    salesChannels: ['store', 'delivery'],
    tags: ['coca', 'gaseosa', 'cola'],
    emoji: '🥤',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-pan-001',
    name: 'Medialunas x6',
    description: 'Docena de medialunas glaseadas',
    barcode: '7796667890123',
    imageUrl: undefined,
    category: 'panaderia',
    costPrice: 1200,
    salePrice: 1800,
    stock: 20,
    minStock: 8,
    unit: 'unidad',
    isWeightBased: false,
    providerId: 'prov-4',
    salesChannels: ['store', 'delivery'],
    tags: ['medialunas', 'panadería', 'masa fresca'],
    emoji: '🥐',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-com-001',
    name: 'Milanesa Napolitana',
    description: 'Milanesa napolitana con papas fritas',
    barcode: '7793334567890',
    imageUrl: undefined,
    category: 'comida_preparada',
    costPrice: 2200,
    salePrice: 4500,
    stock: 30,
    minStock: 10,
    unit: 'unidad',
    isWeightBased: false,
    providerId: 'prov-3',
    salesChannels: ['delivery'],
    tags: ['milanesa', 'napolitana', 'comida'],
    emoji: '🍝',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-ques-001',
    name: 'Queso Cremoso',
    description: 'Queso cremoso La Serenísima',
    barcode: '7794445678901',
    imageUrl: undefined,
    category: 'fiambres',
    costPrice: 3200,
    salePrice: 4800,
    stock: 18,
    minStock: 5,
    unit: 'g',
    isWeightBased: true,
    weightOptions: [
      { id: 'w-q-100', label: '100g', weightInGrams: 100, price: 960, costPrice: 640 },
      { id: 'w-q-200', label: '200g', weightInGrams: 200, price: 1850, costPrice: 1200 },
      { id: 'w-q-500', label: '500g', weightInGrams: 500, price: 4200, costPrice: 2800 },
    ],
    providerId: 'prov-3',
    salesChannels: ['store', 'delivery'],
    tags: ['queso', 'cremoso', 'lacteos'],
    emoji: '🧀',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-cand-001',
    name: 'Caramelos Sugus',
    description: 'Caramelos Sugus surtidos 100u',
    barcode: '7797778901234',
    imageUrl: undefined,
    category: 'caramelos',
    costPrice: 350,
    salePrice: 550,
    stock: 100,
    minStock: 30,
    unit: 'unidad',
    isWeightBased: false,
    providerId: 'prov-1',
    salesChannels: ['store'],
    tags: ['caramelos', 'sugus', 'dulces'],
    emoji: '🍬',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: DEFAULT_PRODUCTS,
      variants: [],
      stockMovements: [],
      searchQuery: '',
      selectedCategory: null,

      addProduct: (productData) => {
        const product: Product = {
          ...productData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set(state => ({ products: [...state.products, product] }));
        return product;
      },

      updateProduct: (id, data) => {
        set(state => ({
          products: state.products.map(p =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      deleteProduct: (id) => {
        set(state => ({
          products: state.products.map(p =>
            p.id === id ? { ...p, isActive: false } : p
          ),
        }));
      },

      getProducts: () => get().products.filter(p => p.isActive),

      getProductById: (id) => get().products.find(p => p.id === id),

      getProductByBarcode: (barcode) =>
        get().products.find(p => p.barcode === barcode && p.isActive),

      addVariant: (variantData) => {
        const variant: ProductVariant = {
          ...variantData,
          id: generateId(),
        };
        set(state => ({ variants: [...state.variants, variant] }));
        return variant;
      },

      updateVariant: (id, data) => {
        set(state => ({
          variants: state.variants.map(v =>
            v.id === id ? { ...v, ...data } : v
          ),
        }));
      },

      deleteVariant: (id) => {
        set(state => ({
          variants: state.variants.filter(v => v.id !== id),
        }));
      },

      getVariantsByProduct: (productId) =>
        get().variants.filter(v => v.productId === productId),

      updateStock: (productId, quantity, type, reason, userId, userName, orderId) => {
        const product = get().products.find(p => p.id === productId);
        if (!product) return;

        let newStock = product.stock;
        switch (type) {
          case 'in':
            newStock += quantity;
            break;
          case 'out':
          case 'waste':
            newStock -= quantity;
            break;
          case 'adjustment':
            newStock = quantity;
            break;
          case 'return':
            newStock += quantity;
            break;
        }

        const movement: StockMovement = {
          id: generateId(),
          productId,
          productName: product.name,
          type,
          quantity,
          previousStock: product.stock,
          newStock,
          reason,
          userId,
          userName,
          orderId,
          providerId: product.providerId,
          createdAt: new Date().toISOString(),
        };

        set(state => ({
          products: state.products.map(p =>
            p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p
          ),
          stockMovements: [movement, ...state.stockMovements],
        }));
      },

      setSearchQuery: (query) => set({ searchQuery: query }),

      setSelectedCategory: (category) => set({ selectedCategory: category }),

      searchProducts: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().products.filter(p =>
          p.isActive && (
            p.name.toLowerCase().includes(lowerQuery) ||
            p.description?.toLowerCase().includes(lowerQuery) ||
            p.barcode.includes(query) ||
            p.tags.some(t => t.toLowerCase().includes(lowerQuery))
          )
        );
      },

      getProductsByCategory: (category) =>
        get().products.filter(p => p.isActive && p.category === category),

      getLowStockProducts: () =>
        get().products.filter(p => p.isActive && p.stock <= p.minStock),
    }),
    {
      name: 'dippy-products',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        products: state.products,
        variants: state.variants,
        stockMovements: state.stockMovements.slice(0, 1000),
      }),
    }
  )
);