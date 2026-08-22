import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/utils/uuid';
import { CartItem, SalesChannel, PaymentMethod } from '@/types';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'sold' | 'cancelled';

export interface DeliveryOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  amountPaid?: number;           // Monto que entrega el cliente
  paymentReceived: boolean;
  source: 'menu' | 'whatsapp' | 'phone' | 'presencial';
  notes?: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  deliveredAt?: string;
  soldAt?: string;
  paidAt?: string;               // Cuándo se registró el pago
}

interface OrderState {
  orders: DeliveryOrder[];
  currentOrder: DeliveryOrder | null;

  // Crear pedido
  createOrder: (data: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    items: CartItem[];
    source: 'menu' | 'whatsapp' | 'phone' | 'presencial';
    userName: string;
    notes?: string;
    discount?: number;
    deliveryFee?: number;
  }) => DeliveryOrder;

  // Importar desde WhatsApp
  importFromWhatsApp: (message: string, userName: string) => DeliveryOrder | null;

  // Actualizar estado del pedido
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;

  // Registrar pago
  markAsPaid: (orderId: string, method: PaymentMethod, amount?: number) => void;

  // Marcar como entregado
  markAsDelivered: (orderId: string) => void;

  // Marcar como vendido (post-entrega, registra en turno)
  markAsSold: (orderId: string) => void;

  // Cancelar pedido
  cancelOrder: (orderId: string) => void;

  // Obtener pedidos
  getPendingOrders: () => DeliveryOrder[];
  getActiveOrders: () => DeliveryOrder[];
  getSoldOrders: () => DeliveryOrder[];
  getOrderById: (id: string) => DeliveryOrder | undefined;

  // Importar pedido rápido de cliente frecuente
  reorderFromCustomer: (phone: string) => DeliveryOrder | null;

  // Limpiar
  clearCurrentOrder: () => void;
}

// Parser simple de mensajes de WhatsApp
const parseWhatsAppMessage = (message: string): Array<{ name: string; quantity: number }> => {
  const items: Array<{ name: string; quantity: number }> = [];
  const lines = message.split('\n').filter(l => l.trim());

  for (const line of lines) {
    // Buscar patrones como "2x salame", "1 pizza", "3 coca", "x2 sandwich"
    const patterns = [
      /(\d+)\s*x\s*(.+)/i,      // 2x salame
      /(\d+)\s+(.+)/i,          // 2 salame
      /x(\d+)\s+(.+)/i,         // x2 salame
      /(.+)\s*x\s*(\d+)/i,     // salame x2
    ];

    for (const pattern of patterns) {
      const match = line.trim().match(pattern);
      if (match) {
        const qty = parseInt(match[1]) || 1;
        const name = match[2]?.trim() || match[1]?.trim();
        if (name && name.length > 1) {
          items.push({ name, quantity: qty });
          break;
        }
      }
    }
  }

  return items;
};

// Fuzzy match contra productos del catálogo
const fuzzyMatchProduct = (searchName: string, catalogProducts: Array<{ name: string; id: string }>): string | null => {
  const search = searchName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  for (const product of catalogProducts) {
    const productName = product.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (productName.includes(search) || search.includes(productName)) {
      return product.id;
    }
  }
  return null;
};

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      currentOrder: null,

      createOrder: (data) => {
        const subtotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
        const discount = data.discount || 0;
        const deliveryFee = data.deliveryFee || 0;

        const order: DeliveryOrder = {
          id: generateId(),
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerAddress: data.customerAddress,
          items: data.items,
          subtotal,
          discount: subtotal * (discount / 100),
          deliveryFee,
          total: subtotal - (subtotal * (discount / 100)) + deliveryFee,
          status: 'pending',
          source: data.source,
          notes: data.notes,
          userName: data.userName,
          paymentReceived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set(state => ({
          orders: [order, ...state.orders],
          currentOrder: order,
        }));

        return order;
      },

      importFromWhatsApp: (message, userName) => {
        const parsedItems = parseWhatsAppMessage(message);

        if (parsedItems.length === 0) return null;

        // Crear items con precios default (se ajustarán manualmente)
        const items: CartItem[] = parsedItems.map(parsed => ({
          id: generateId(),
          productId: 'pending-match',
          productName: parsed.name,
          quantity: parsed.quantity,
          unitPrice: 0,
          costPrice: 0,
          totalPrice: 0,
        }));

        const subtotal = 0; // Se ajustará al confirmar

        const order: DeliveryOrder = {
          id: generateId(),
          customerName: 'Cliente WhatsApp',
          customerPhone: '',
          customerAddress: '',
          items,
          subtotal,
          discount: 0,
          deliveryFee: 0,
          total: subtotal,
          status: 'pending',
          source: 'whatsapp',
          notes: `Pedido importado de WhatsApp:\n${message}`,
          userName,
          paymentReceived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set(state => ({
          orders: [order, ...state.orders],
          currentOrder: order,
        }));

        return order;
      },

      updateOrderStatus: (orderId, status) => {
        const now = new Date().toISOString();
        const updates: Partial<DeliveryOrder> = { status, updatedAt: now };

        if (status === 'confirmed') updates.confirmedAt = now;
        if (status === 'delivered') updates.deliveredAt = now;

        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId ? { ...o, ...updates } : o
          ),
          currentOrder: state.currentOrder?.id === orderId
            ? { ...state.currentOrder, ...updates }
            : state.currentOrder,
        }));
      },

      markAsPaid: (orderId, method, amount) => {
        const now = new Date().toISOString();
        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId ? { 
              ...o, 
              paymentMethod: method, 
              paymentReceived: true, 
              amountPaid: amount,
              paidAt: now,
              updatedAt: now 
            } : o
          ),
          currentOrder: state.currentOrder?.id === orderId
            ? { 
                ...state.currentOrder, 
                paymentMethod: method, 
                paymentReceived: true,
                amountPaid: amount,
                paidAt: now,
              }
            : state.currentOrder,
        }));
      },

      markAsDelivered: (orderId) => {
        get().updateOrderStatus(orderId, 'delivered');
      },

      markAsSold: (orderId) => {
        const now = new Date().toISOString();
        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId ? { ...o, status: 'sold', soldAt: now, updatedAt: now } : o
          ),
          currentOrder: state.currentOrder?.id === orderId
            ? { ...state.currentOrder, status: 'sold', soldAt: now }
            : null,
        }));
      },

      cancelOrder: (orderId) => {
        get().updateOrderStatus(orderId, 'cancelled');
      },

      getPendingOrders: () =>
        get().orders.filter(o => o.status === 'pending'),

      getActiveOrders: () =>
        get().orders.filter(o =>
          ['pending', 'confirmed', 'preparing', 'ready', 'delivering'].includes(o.status)
        ),

      getSoldOrders: () =>
        get().orders.filter(o => o.status === 'sold'),

      getOrderById: (id) =>
        get().orders.find(o => o.id === id),

      reorderFromCustomer: (phone) => {
        const lastOrder = get().orders.find(o =>
          o.customerPhone === phone && o.status === 'sold'
        );

        if (!lastOrder) return null;

        return {
          ...lastOrder,
          id: generateId(),
          status: 'pending',
          items: lastOrder.items.map(item => ({ ...item, id: generateId() })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      },

      clearCurrentOrder: () => set({ currentOrder: null }),
    }),
    {
      name: 'dippy-orders',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        orders: state.orders.slice(0, 500),
      }),
    }
  )
);