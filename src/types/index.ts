// Tipos principales del sistema Dippy

export type BusinessType = 'kiosko' | 'delivery';

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
  | 'comida_preparada'
  | 'bebidas'
  | 'snacks'
  | 'lacteos'
  | 'carnes'
  | 'postres';

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'qr' | 'transferencia' | 'mercadopago';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'sold' | 'cancelled';

export type TurnShift = 'manana' | 'tarde' | 'noche';

// ============================================================
// USUARIO
// ============================================================
export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  avatar?: string;
  pin?: string;
  businesses: BusinessType[];  // Negocios donde puede trabajar
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  pinAttempts?: number;
  isLocked?: boolean;
}

// ============================================================
// TURNO DE TRABAJO
// ============================================================
export interface WorkTurn {
  id: string;
  businessId: BusinessType;
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

// ============================================================
// PRODUCTO
// ============================================================
export interface Product {
  id: string;
  businessId: BusinessType;
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

export interface WeightOption {
  id: string;
  label: string;
  weightInGrams: number;
  price: number;
  costPrice: number;
}

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

// ============================================================
// CARRITO / ITEMS
// ============================================================
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
  notes?: string;
}

// ============================================================
// ORDEN / PEDIDO
// ============================================================
export interface Order {
  id: string;
  businessId: BusinessType;
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
  // Delivery
  amountPaid?: number;
  paymentReceived?: boolean;
  deliveryFee?: number;
  source?: 'menu' | 'whatsapp' | 'phone';
  soldAt?: string;
}

// ============================================================
// PROVEEDOR (compartido entre ambos negocios)
// ============================================================
export interface Provider {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  cuit?: string;
  paymentTerms?: string;
  categories: ProductCategory[];
  rating: number;
  isPreferred: boolean;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  payments?: PaymentSupplier[];
}

export interface PaymentSupplier {
  id: string;
  providerId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  reason?: string;
  userId: string;
}

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

// ============================================================
// CAJA DIARIA (por negocio)
// ============================================================
export interface CashRegister {
  id: string;
  businessId: BusinessType;
  date: string;
  openingAmount: number;
  cashIn: number;
  cashOut: number;
  transfersIn: number;
  cardIn: number;
  mercadopagoIn: number;
  closingAmount: number | null;
  status: 'open' | 'closed';
  openedBy: string;
  openedByName: string;
  closedBy?: string;
  closedByName?: string;
  closedAt?: string;
  notes?: string;
  movements: CashMovement[];
}

export interface CashMovement {
  id: string;
  type: 'sale' | 'expense' | 'withdrawal' | 'deposit' | 'adjustment' | 'supplier_payment';
  amount: number;
  description: string;
  paymentMethod: PaymentMethod;
  orderId?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

// ============================================================
// CONFIGURACIÓN DEL NEGOCIO
// ============================================================
export interface BusinessConfig {
  kiosko: {
    name: string;
    address: string;
    phone: string;
    cuit: string;
    whatsappNumber?: string;
  };
  delivery: {
    name: string;
    address: string;
    phone: string;
    cuit: string;
    whatsappNumber?: string;
    deliveryRadiusKm: number;
    deliveryFee: number;
    minDeliveryOrder: number;
  };
  taxRate: number;
  currency: 'ARS';
}

// ============================================================
// REPORTES
// ============================================================
export interface TurnReport {
  turnId: string;
  businessId: BusinessType;
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

export interface CashReport {
  businessId: BusinessType;
  date: string;
  openingAmount: number;
  totalCashIn: number;
  totalCashOut: number;
  totalTransfers: number;
  totalCard: number;
  totalMercadopago: number;
  netCash: number;
  closingAmount: number | null;
  movementsCount: number;
  salesCount: number;
}

export interface DailyReport {
  date: string;
  kiosko: CashReport | null;
  delivery: CashReport | null;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

// ============================================================
// MOVIMIENTOS Y UTILIDADES
// ============================================================
export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  businessId: BusinessType;
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

export interface ScanResult {
  barcode: string;
  product?: Product;
  variant?: ProductVariant;
  isNew: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}
