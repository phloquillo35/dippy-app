// Tipos principales del sistema Dippy

export type SalesChannel = 'store' | 'delivery';

export type UserRole = 'cajero' | 'ayudante' | 'supervisor' | 'admin';

export type ProductCategory = 
  | 'limpieza' 
  | 'cocina' 
  | 'comestibles' 
  | 'caramelos' 
  | 'fiambres' 
  | 'gaseosas' 
  | 'panaderia' 
  | 'comida_preparada';

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'qr' | 'transferencia' | 'mercadopago';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export type TurnShift = 'manana' | 'tarde' | 'noche';

// Usuario del sistema
export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

// Turno de trabajo
export interface WorkTurn {
  id: string;
  userId: string;
  userName: string;
  shift: TurnShift;
  startTime: string;
  endTime?: string;
  totalSales: number;
  totalItems: number;
  totalOrders: number;
  averageTicket: number;
  isActive: boolean;
}

// Producto base
export interface Product {
  id: string;
  name: string;
  description?: string;
  barcode: string;
  imageUrl?: string;
  category: ProductCategory;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  unit: 'unidad' | 'kg' | 'g' | 'l' | 'ml';
  isWeightBased: boolean;
  weightOptions?: WeightOption[];
  providerId?: string;
  salesChannels: SalesChannel[];
  tags: string[];
  emoji?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Opciones de peso para productos por peso
export interface WeightOption {
  id: string;
  label: string;        // ej: "100g", "200g", "500g", "1kg"
  weightInGrams: number;
  price: number;
  costPrice: number;
}

// Variante de producto (para peso, tamaño, etc)
export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  barcode?: string;
  weightInGrams?: number;
  price: number;
  costPrice: number;
  stock: number;
  isDefault: boolean;
}

// Item en carrito/orden
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  totalPrice: number;
  emoji?: string;
  notes?: string;       // ej: "sin sal", "bien cocido"
}

// Orden de venta
export interface Order {
  id: string;
  channel: SalesChannel;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  userId: string;
  userName: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  notes?: string;
  turnId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// Proveedor
export interface Provider {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  cuit?: string;
  paymentTerms?: string;      // ej: "30 días", "contado"
  categories: ProductCategory[];
  rating: number;             // 1-5
  isPreferred: boolean;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Producto del proveedor (catálogo)
export interface ProviderProduct {
  id: string;
  providerId: string;
  providerName: string;
  productName: string;
  providerSku?: string;
  costPrice: number;
  suggestedSalePrice: number;
  minOrderQuantity: number;
  unit: string;
  lastUpdated: string;
}

// Configuración del negocio
export interface BusinessConfig {
  name: string;
  address: string;
  phone: string;
  email: string;
  cuit: string;
  ivaCondition: 'responsable_inscripto' | 'monotributo' | 'exento';
  printerIp?: string;
  whatsappNumber?: string;
  deliveryRadiusKm: number;
  deliveryFee: number;
  minDeliveryOrder: number;
  taxRate: number;
  currency: 'ARS';
}

// Reporte de turno
export interface TurnReport {
  turnId: string;
  userId: string;
  userName: string;
  shift: TurnShift;
  date: string;
  startTime: string;
  endTime: string;
  totalSales: number;
  totalOrders: number;
  totalItems: number;
  averageTicket: number;
  salesByChannel: Record<SalesChannel, number>;
  salesByCategory: Record<ProductCategory, number>;
  salesByPaymentMethod: Record<PaymentMethod, number>;
  topProducts: Array<{ productId: string; name: string; quantity: number; revenue: number }>;
}

// Movimiento de stock
export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment' | 'return' | 'waste';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  userId: string;
  userName: string;
  orderId?: string;
  providerId?: string;
  createdAt: string;
}

// Cliente para delivery
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  neighborhood?: string;
  notes?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string;
  isActive: boolean;
  createdAt: string;
}

// Configuración de escaneo
export interface ScanResult {
  barcode: string;
  product?: Product;
  variant?: ProductVariant;
  isNew: boolean;
}

// Notificación toast
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}