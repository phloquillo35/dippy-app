import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, PaymentMethod, BusinessType } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/utils/uuid';
import { useUserStore } from './userStore';
import { useCashStore } from './cashStore';

interface CartState {
  items: CartItem[];
  notes: string;
  discount: number;
  paymentMethod: PaymentMethod | null;
  amountPaid: number;

  addItem: (product: any, variantId?: string, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setNotes: (notes: string) => void;
  setDiscount: (discount: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setAmountPaid: (amount: number) => void;

  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  getChange: () => number;

  confirmStoreOrder: (businessId?: BusinessType) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      notes: '',
      discount: 0,
      paymentMethod: null,
      amountPaid: 0,

      addItem: (product, variantId, quantity = 1) => {
        const existingItem = get().items.find(
          i => i.productId === product.id && i.variantId === variantId
        );

        if (existingItem) {
          set(state => ({
            items: state.items.map(i =>
              i.id === existingItem.id
                ? {
                    ...i,
                    quantity: i.quantity + quantity,
                    totalPrice: (i.quantity + quantity) * i.unitPrice,
                  }
                : i
            ),
          }));
        } else {
          const newItem: CartItem = {
            id: generateId(),
            productId: product.id,
            productName: product.name,
            productImage: product.imageUrl,
            variantId,
            quantity,
            unitPrice: product.salePrice,
            costPrice: product.costPrice,
            totalPrice: product.salePrice * quantity,
            emoji: product.emoji,
          };
          set(state => ({ items: [...state.items, newItem] }));
        }
      },

      removeItem: (itemId) => {
        set(state => ({
          items: state.items.filter(i => i.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        set(state => ({
          items: state.items.map(i =>
            i.id === itemId
              ? { ...i, quantity, totalPrice: quantity * i.unitPrice }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [], notes: '', discount: 0, paymentMethod: null, amountPaid: 0 }),

      setNotes: (notes) => set({ notes }),
      setDiscount: (discount) => set({ discount }),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      setAmountPaid: (amount) => set({ amountPaid: amount }),

      getSubtotal: () => get().items.reduce((sum, i) => sum + i.totalPrice, 0),

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discountAmount = subtotal * (get().discount / 100);
        return subtotal - discountAmount;
      },

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      getChange: () => {
        const total = get().getTotal();
        const paid = get().amountPaid;
        return paid > total ? paid - total : 0;
      },

      confirmStoreOrder: (businessId = 'kiosko') => {
        const { items, notes, discount, paymentMethod, amountPaid } = get();
        const subtotal = get().getSubtotal();
        const total = get().getTotal();
        const discountAmount = subtotal * (discount / 100);

        const currentUser = useUserStore.getState().currentUser;
        const currentTurn = useUserStore.getState().currentTurn;

        if (!currentUser) return;

        // Registrar venta en turno
        useUserStore.getState().recordSale(total, items.length, 'store');

        // Registrar movimiento en caja
        const cashRegister = useCashStore.getState().getOpenRegister(businessId);
        if (cashRegister) {
          useCashStore.getState().addMovement(cashRegister.id, {
            type: 'sale',
            amount: total,
            description: `Venta #${Date.now().toString(36).toUpperCase()} - ${items.length} items`,
            paymentMethod: paymentMethod || 'efectivo',
            userId: currentUser.id,
            userName: currentUser.name,
          });
        }

        // Registrar stock
        items.forEach(item => {
          const { updateStock } = require('./productStore').useProductStore.getState();
          updateStock(
            item.productId,
            item.quantity,
            'out',
            `Venta en kiosko`,
            currentUser.id,
            currentUser.name
          );
        });

        set({ items: [], notes: '', discount: 0, paymentMethod: null, amountPaid: 0 });
      },
    }),
    {
      name: 'dippy-store-cart',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        notes: state.notes,
        discount: state.discount,
      }),
    }
  )
);
