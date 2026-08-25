import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, PaymentMethod, BusinessType } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/utils/uuid';
import { useUserStore } from './userStore';
import { useCashStore } from './cashStore';
import { useProductStore } from './productStore';
import { useOrderStore } from './orderStore';
import { useAuditStore } from './auditStore';
import { SplitPayment } from '@/components/SplitPaymentPicker';

interface CartState {
  items: CartItem[];
  notes: string;
  discount: number;
  paymentMethod: PaymentMethod | null;
  amountPaid: number;

  addItem: (product: any, variantId?: string, quantity?: number) => 'ok' | 'no_stock' | 'capped';
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

  confirmStoreOrder: (businessId?: BusinessType, splitPayments?: SplitPayment[]) => string | null;
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
        // Validación de stock considerando lo ya agregado al carrito
        const available = Math.floor(product.stock ?? 0) - get()
          .items.filter(i => i.productId === product.id)
          .reduce((sum, i) => sum + i.quantity, 0);

        if (available <= 0) return 'no_stock';

        const addQty = Math.min(quantity, available);
        const capped = addQty < quantity;

        const existingItem = get().items.find(
          i => i.productId === product.id && i.variantId === variantId
        );

        if (existingItem) {
          set(state => ({
            items: state.items.map(i =>
              i.id === existingItem.id
                ? {
                    ...i,
                    quantity: i.quantity + addQty,
                    totalPrice: (i.quantity + addQty) * i.unitPrice,
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
            quantity: addQty,
            unitPrice: product.salePrice,
            costPrice: product.costPrice,
            totalPrice: product.salePrice * addQty,
            emoji: product.emoji,
          };
          set(state => ({ items: [...state.items, newItem] }));
        }

        return capped ? 'capped' : 'ok';
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

      confirmStoreOrder: (businessId = 'kiosko', splitPayments) => {
        const { items, notes, discount, paymentMethod } = get();
        if (items.length === 0) return null;

        const total = get().getTotal();
        const currentUser = useUserStore.getState().currentUser;
        if (!currentUser) return null;

        const payMethod = splitPayments?.length
          ? splitPayments[0].method
          : paymentMethod || 'efectivo';

        // Crear orden de venta (canal store)
        const order = useOrderStore.getState().createStoreOrder(
          businessId,
          items,
          notes,
          currentUser.name,
          payMethod as PaymentMethod,
          total,
          Math.max(0, get().getSubtotal() - total)
        );

        // Registrar venta en turno
        useUserStore.getState().recordSale(total, items.length, 'store');

        // Registrar movimientos en caja (uno por método si es pago dividido)
        const cashRegister = useCashStore.getState().getOpenRegister(businessId);
        if (cashRegister) {
          const movements: Array<{ method: PaymentMethod; amount: number }> = splitPayments?.length
            ? splitPayments.map(p => ({ method: p.method, amount: p.amount }))
            : [{ method: payMethod as PaymentMethod, amount: total }];

          movements.forEach(m => {
            useCashStore.getState().addMovement(cashRegister.id, {
              type: 'sale',
              amount: m.amount,
              description: `Venta #${order?.id.slice(-6).toUpperCase() || Date.now().toString(36).toUpperCase()} - ${items.length} items`,
              paymentMethod: m.method,
              userId: currentUser.id,
              userName: currentUser.name,
            });
          });
        }

        // Registrar stock
        items.forEach(item => {
          useProductStore.getState().updateStock(
            item.productId,
            item.quantity,
            'out',
            businessId === 'delivery' ? 'Venta en delivery' : 'Venta en kiosko',
            currentUser.id,
            currentUser.name
          );
        });

        useAuditStore.getState().log({
          action: 'sale',
          userId: currentUser.id,
          userName: currentUser.name,
          businessId,
          description: `Venta #${order?.id.slice(-6).toUpperCase()} registrada${splitPayments?.length ? ' (pago dividido)' : ''}`,
          metadata: { total, items: items.length },
        });

        set({ items: [], notes: '', discount: 0, paymentMethod: null, amountPaid: 0 });
        return order?.id || null;
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
