import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product, ProductVariant, ProductCategory, StockMovement, BusinessType } from '@/types';
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
  getProducts: (businessId?: BusinessType) => Product[];
  getProductById: (id: string) => Product | undefined;
  getProductByBarcode: (barcode: string, businessId?: BusinessType) => Product | undefined;

  addVariant: (variant: Omit<ProductVariant, 'id'>) => ProductVariant;
  updateVariant: (id: string, data: Partial<ProductVariant>) => void;
  deleteVariant: (id: string) => void;
  getVariantsByProduct: (productId: string) => ProductVariant[];

  updateStock: (
    productId: string,
    quantity: number,
    type: StockMovement['type'],
    reason: string,
    userId: string,
    userName: string,
    orderId?: string
  ) => void;

  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: ProductCategory | null) => void;
  searchProducts: (query: string, businessId?: BusinessType) => Product[];
  getProductsByCategory: (category: ProductCategory, businessId?: BusinessType) => Product[];
  getLowStockProducts: (businessId?: BusinessType) => Product[];
}

const DEFAULT_PRODUCTS: Product[] = [
  // KIOSKO
  {
    id: 'prod-lim-001',
    businessId: 'kiosko',
    name: 'Detergente Magistral',
    description: 'Detergente liquido limon 500ml',
    barcode: '7790123456789',
    category: 'limpieza',
    costPrice: 450,
    salePrice: 650,
    stock: 48,
    minStock: 10,
    unit: 'unidad',
    isWeightBased: false,
    providerId: 'prov-1',
    salesChannels: ['store'],
    tags: ['detergente', 'limpieza'],
    emoji: '🧴',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-gas-001',
    businessId: 'kiosko',
    name: 'Coca-Cola',
    description: 'Gaseosa Coca-Cola 2.25L',
    barcode: '7790550000123',
    category: 'gaseosas',
    costPrice: 900,
    salePrice: 1350,
    stock: 72,
    minStock: 20,
    unit: 'unidad',
    isWeightBased: false,
    providerId: 'prov-1',
    salesChannels: ['store'],
    tags: ['coca', 'gaseosa', 'cola'],
    emoji: '🥤',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-cand-001',
    businessId: 'kiosko',
    name: 'Caramelos Sugus',
    description: 'Caramelos Sugus surtidos 100u',
    barcode: '7797778901234',
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
  {
    id: 'prod-fiam-001',
    businessId: 'kiosko',
    name: 'Salame Llanero',
    description: 'Salame artesanal lote 500g',
    barcode: '7795551234567',
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
    ],
    providerId: 'prov-3',
    salesChannels: ['store'],
    tags: ['salame', 'fiambre'],
    emoji: '🥩',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-pan-001',
    businessId: 'kiosko',
    name: 'Medialunas x6',
    description: 'Docena de medialunas glaseadas',
    barcode: '7796667890123',
    category: 'panaderia',
    costPrice: 1200,
    salePrice: 1800,
    stock: 20,
    minStock: 8,
    unit: 'unidad',
    isWeightBased: false,
    providerId: 'prov-4',
    salesChannels: ['store'],
    tags: ['medialunas', 'panaderia'],
    emoji: '🥐',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // DELIVERY
  {
    id: 'prod-com-001',
    businessId: 'delivery',
    name: 'Milanesa Napolitana',
    description: 'Milanesa napolitana con papas fritas',
    barcode: '7793334567890',
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
    id: 'prod-sand-001',
    businessId: 'delivery',
    name: 'Sandwich de Lomo',
    description: 'Sandwich de lomo con lechuga, tomate y mayonesa',
    barcode: '7793334567891',
    category: 'comida_preparada',
    costPrice: 1800,
    salePrice: 3500,
    stock: 25,
    minStock: 8,
    unit: 'unidad',
    isWeightBased: false,
    providerId: 'prov-3',
    salesChannels: ['delivery'],
    tags: ['sandwich', 'lomo', 'comida'],
    emoji: '🥪',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-emp-001',
    businessId: 'delivery',
    name: 'Empanadas x6',
    description: 'Docena de empanadas de carne cortada a cuchillo',
    barcode: '7793334567892',
    category: 'comida_preparada',
    costPrice: 1500,
    salePrice: 2800,
    stock: 40,
    minStock: 15,
    unit: 'unidad',
    isWeightBased: false,
    providerId: 'prov-3',
    salesChannels: ['delivery'],
    tags: ['empanadas', 'carne', 'comida'],
    emoji: '🥟',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-piz-001',
    businessId: 'delivery',
    name: 'Pizza Muzzarella',
    description: 'Pizza muzzarella grande individual',
    barcode: '7793334567893',
    category: 'comida_preparada',
    costPrice: 1600,
    salePrice: 3200,
    stock: 20,
    minStock: 8,
    unit: 'unidad',
    isWeightBased: false,
    providerId: 'prov-3',
    salesChannels: ['delivery'],
    tags: ['pizza', 'muzzarella', 'comida'],
    emoji: '🍕',
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

      getProducts: (businessId) => {
        const products = get().products.filter(p => p.isActive);
        if (businessId) {
          return products.filter(p => p.businessId === businessId);
        }
        return products;
      },

      getProductById: (id) => get().products.find(p => p.id === id),

      getProductByBarcode: (barcode, businessId) => {
        let products = get().products.filter(p => p.barcode === barcode && p.isActive);
        if (businessId) {
          products = products.filter(p => p.businessId === businessId);
        }
        return products[0];
      },

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
          variants: state.variants.map(v => (v.id === id ? { ...v, ...data } : v)),
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
          businessId: product.businessId,
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

      searchProducts: (query, businessId) => {
        const lowerQuery = query.toLowerCase();
        let products = get().products.filter(p => p.isActive);
        if (businessId) {
          products = products.filter(p => p.businessId === businessId);
        }
        return products.filter(
          p =>
            p.name.toLowerCase().includes(lowerQuery) ||
            p.description?.toLowerCase().includes(lowerQuery) ||
            p.barcode.includes(query) ||
            p.tags.some(t => t.toLowerCase().includes(lowerQuery))
        );
      },

      getProductsByCategory: (category, businessId) => {
        let products = get().products.filter(p => p.isActive && p.category === category);
        if (businessId) {
          products = products.filter(p => p.businessId === businessId);
        }
        return products;
      },

      getLowStockProducts: (businessId) => {
        let products = get().products.filter(p => p.isActive && p.stock <= p.minStock);
        if (businessId) {
          products = products.filter(p => p.businessId === businessId);
        }
        return products;
      },
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
