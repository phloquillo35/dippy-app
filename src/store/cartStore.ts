import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, Product, ProductVariant, PaymentMethod } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from './userStore';

interface CartState {
  items: CartItem[];
  notes: string;
  discount: number;
  paymentMethod: PaymentMethod | null;
  amountPaid: number;

  // Actions
  addItem: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setNotes: (notes: string) => void;
  setDiscount: (discount: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setAmountPaid: (amount: number) => void;

  // Computed
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  getChange: () => number;  // Vuelto = amountPaid - total

  // Confirmar venta en tienda
  confirmStoreOrder: () => boolean;
}

const generateItemId = (productId: string, variantId?: string) =>
  `store-${productId}-${variantId || 'default'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      notes: '',
      discount: 0,
      paymentMethod: null,
      amountPaid: 0,

      addItem: (product, variant, quantity = 1) => {
        const variantId = variant?.id;
        const itemId = generateItemId(product.id, variantId);

        const existingIndex = get().items.findIndex(
          item => item.productId === product.id && item.variantId === variantId
        );

        const unitPrice = variant?.price ?? product.salePrice;
        const costPrice = variant?.costPrice ?? product.costPrice;
        const variantName = variant?.name ?? (product.isWeightBased ? 'Unidad' : undefined);

        if (existingIndex >= 0) {
          const newItems = [...get().items];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + quantity,
            totalPrice: (newItems[existingIndex].quantity + quantity) * unitPrice,
          };
          set({ items: newItems });
        } else {
          const newItem: CartItem = {
            id: itemId,
            productId: product.id,
            productName: product.name,
            productImage: product.imageUrl,
            variantId,
            variantName,
            quantity,
            unitPrice,
            costPrice,
            totalPrice: unitPrice * quantity,
            emoji: product.emoji,
          };
          set({ items: [...get().items, newItem] });
        }
      },

      removeItem: (itemId) => {
        set({ items: get().items.filter(item => item.id !== itemId) });
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        const newItems = get().items.map(item =>
          item.id === itemId
            ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
            : item
        );
        set({ items: newItems });
      },

      clearCart: () => {
        set({
          items: [],
          notes: '',
          discount: 0,
          paymentMethod: null,
          amountPaid: 0,
        });
      },

      setNotes: (notes) => set({ notes }),

      setDiscount: (discount) => set({ discount: Math.max(0, Math.min(100, discount)) }),

      setPaymentMethod: (method) => set({ paymentMethod: method }),

      setAmountPaid: (amount) => set({ amountPaid: Math.max(0, amount) }),

      getSubtotal: () => get().items.reduce((sum, item) => sum + item.totalPrice, 0),

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().discount;
        return subtotal * (1 - discount / 100);
      },

      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      getChange: () => {
        const amountPaid = get().amountPaid;
        const total = get().getTotal();
        return Math.max(0, amountPaid - total);
      },

      confirmStoreOrder: () => {
        const state = get();
        if (state.items.length === 0) return false;

        const userStore = useUserStore.getState();
        const currentTurn = userStore.currentTurn;
        
        if (currentTurn) {
          const total = state.getTotal();
          const itemCount = state.getItemCount();
          userStore.recordSale(total, itemCount, 'store');
        }

        get().clearCart();
        return true;
      },
    }),
    {
      name: 'dippy-store-cart',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        notes: state.notes,
        discount: state.discount,
        paymentMethod: state.paymentMethod,
        amountPaid: state.amountPaid,
      }),
    }
  )
);
