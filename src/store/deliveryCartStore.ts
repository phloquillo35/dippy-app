import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, Product, ProductVariant } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOrderStore } from './orderStore';
import { useCustomerStore } from './customerStore';
import { useAuditStore } from './auditStore';

interface DeliveryCartState {
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes: string;
  discount: number;
  deliveryFee: number;

  // Actions
  addItem: (product: Product, variant?: ProductVariant, quantity?: number) => 'ok' | 'no_stock' | 'capped';
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setCustomerInfo: (info: Partial<{ name: string; phone: string; address: string }>) => void;
  setNotes: (notes: string) => void;
  setDiscount: (discount: number) => void;
  setDeliveryFee: (fee: number) => void;

  // Computed
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;

  // Confirmar pedido de delivery
  confirmOrder: (userName: string, source?: 'menu' | 'whatsapp' | 'phone') => string | null;
}

const generateItemId = (productId: string, variantId?: string) =>
  `del-${productId}-${variantId || 'default'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useDeliveryCartStore = create<DeliveryCartState>()(
  persist(
    (set, get) => ({
      items: [],
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      notes: '',
      discount: 0,
      deliveryFee: 500,

      addItem: (product, variant, quantity = 1) => {
        // Validación de stock considerando lo ya agregado al carrito
        const available = Math.floor(product.stock ?? 0) - get()
          .items.filter(item => item.productId === product.id)
          .reduce((sum, item) => sum + item.quantity, 0);

        if (available <= 0) return 'no_stock';

        const addQty = Math.min(quantity, available);
        const capped = addQty < quantity;

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
            quantity: newItems[existingIndex].quantity + addQty,
            totalPrice: (newItems[existingIndex].quantity + addQty) * unitPrice,
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
            quantity: addQty,
            unitPrice,
            costPrice,
            totalPrice: unitPrice * addQty,
            emoji: product.emoji,
          };
          set({ items: [...get().items, newItem] });
        }

        return capped ? 'capped' : 'ok';
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
          customerName: '',
          customerPhone: '',
          customerAddress: '',
          notes: '',
          discount: 0,
          deliveryFee: 500,
        });
      },

      // Los callers pasan { name, phone, address }; mapear a las claves reales del estado
      setCustomerInfo: (info) => set(state => ({
        customerName: info.name ?? state.customerName,
        customerPhone: info.phone ?? state.customerPhone,
        customerAddress: info.address ?? state.customerAddress,
      })),

      setNotes: (notes) => set({ notes }),

      setDiscount: (discount) => set({ discount: Math.max(0, Math.min(100, discount)) }),

      setDeliveryFee: (fee) => set({ deliveryFee: Math.max(0, fee) }),

      getSubtotal: () => get().items.reduce((sum, item) => sum + item.totalPrice, 0),

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().discount;
        const deliveryFee = get().deliveryFee;
        return subtotal * (1 - discount / 100) + deliveryFee;
      },

      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      confirmOrder: (userName, source = 'menu') => {
        const state = get();
        if (state.items.length === 0) return null;

        const orderStore = useOrderStore.getState();
        const order = orderStore.createOrder(
          'delivery',
          [...state.items],
          state.customerName || 'Cliente',
          state.customerPhone,
          state.customerAddress,
          state.notes,
          userName,
          source,
          state.deliveryFee,
          state.discount,
        );

        // Registrar cliente automáticamente (si tiene teléfono)
        if (order && state.customerPhone.trim()) {
          const customerStore = useCustomerStore.getState();
          let customer = customerStore.getCustomerByPhone(state.customerPhone.trim());
          if (customer) {
            customerStore.updateCustomer(customer.id, {
              name: state.customerName || customer.name,
              address: state.customerAddress || customer.address,
            });
          } else {
            customer = customerStore.addCustomer({
              name: state.customerName || 'Cliente',
              phone: state.customerPhone.trim(),
              address: state.customerAddress,
              businessIds: ['delivery'],
            });
          }
          customerStore.recordOrder(customer.id, order.total);
        }

        useAuditStore.getState().log({
          action: 'order_created',
          userId: '',
          userName,
          businessId: 'delivery',
          description: `Pedido delivery #${order?.id.slice(-6).toUpperCase()} confirmado en caja`,
        });

        get().clearCart();
        return order ? order.id : null;
      },
    }),
    {
      name: 'dippy-delivery-cart',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        customerName: state.customerName,
        customerPhone: state.customerPhone,
        customerAddress: state.customerAddress,
        notes: state.notes,
        discount: state.discount,
        deliveryFee: state.deliveryFee,
      }),
    }
  )
);
