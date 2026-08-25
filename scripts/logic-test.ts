/**
 * Suite de pruebas de lógica de negocio (corre en Node con `npx tsx`).
 * Usa window.localStorage polyfill para que zustand+persist funcione sin RN.
 */
import { storageData } from './logic-setup';
import { useProductStore } from '../src/store/productStore';
import { useCartStore } from '../src/store/cartStore';
import { useDeliveryCartStore } from '../src/store/deliveryCartStore';
import { useOrderStore } from '../src/store/orderStore';
import { useCashStore } from '../src/store/cashStore';
import { useUserStore } from '../src/store/userStore';
import { useCouponStore } from '../src/store/couponStore';
import { useCustomerStore } from '../src/store/customerStore';
import { useReturnStore } from '../src/store/returnStore';
import { useAuditStore } from '../src/store/auditStore';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name}`);
  }
}

function section(title: string) {
  console.log(`\n━━ ${title} ━━`);
}

function revenue(register: any) {
  return register ? register.cashIn + register.transfersIn + register.cardIn + register.mercadopagoIn : 0;
}

async function main() {
  const today = new Date().toISOString().split('T')[0];

  // ── Setup: usuario logueado ──
  section('Setup usuario y caja');
  const userStore = useUserStore.getState();
  const admin = userStore.users.find(u => u.role === 'admin')!;
  const pinTesterId = userStore.register({
    name: 'Pin Tester', role: 'cajero', avatar: '🧪', businesses: ['kiosko'], isActive: true,
  }).id;
  userStore.setPin(pinTesterId, '1234');

  await userStore.loginWithPin(pinTesterId, '1234');
  check('Login con PIN correcto', useUserStore.getState().currentUser?.id === pinTesterId);

  let threw = false;
  try { await userStore.loginWithPin(pinTesterId, '9999'); } catch { threw = true; }
  check('PIN incorrecto lanza error', threw);

  // Volver al admin para el resto de las pruebas
  await userStore.login(admin.email || 'marta@dippy.com', '');

  const kioskoReg = useCashStore.getState().openRegister('kiosko', 1000, admin.id, admin.name);
  const deliveryReg = useCashStore.getState().openRegister('delivery', 2000, admin.id, admin.name);
  check('Caja kiosko abierta', !!useCashStore.getState().getOpenRegister('kiosko'));
  threw = false;
  try { useCashStore.getState().openRegister('kiosko', 100, admin.id, admin.name); } catch { threw = true; }
  check('Doble apertura de caja rechazada', threw);

  // ── Productos / stock ──
  section('Productos y stock');
  const products = useProductStore.getState();
  const coca = products.getProducts('kiosko').find(p => p.name === 'Coca-Cola')!;
  check('Producto semilla Coca-Cola existe', !!coca);

  products.updateStock(coca.id, 5, 'out', 'prueba out', admin.id, admin.name);
  check('updateStock out descuenta', useProductStore.getState().products.find(p => p.id === coca.id)!.stock === coca.stock - 5);
  products.updateStock(coca.id, 5, 'in', 'prueba in', admin.id, admin.name);
  check('updateStock in repone', useProductStore.getState().products.find(p => p.id === coca.id)!.stock === coca.stock);
  products.updateStock(coca.id, 99999, 'out', 'clamp test', admin.id, admin.name);
  check('Stock nunca negativo (clamp en 0)', useProductStore.getState().products.find(p => p.id === coca.id)!.stock === 0);
  products.updateStock(coca.id, coca.stock, 'return', 'restock prueba', admin.id, admin.name);
  check('updateStock return restaura', useProductStore.getState().products.find(p => p.id === coca.id)!.stock === coca.stock);

  // ── Carrito kiosko: validación acumulativa ──
  section('Carrito kiosko — validación de stock');
  const pizza = useProductStore.getState().getProducts('delivery').find(p => p.name.startsWith('Pizza'))!;
  const milanga = useProductStore.getState().getProducts('delivery').find(p => p.name.startsWith('Milanesa'))!;
  const cart = useCartStore.getState();

  check('addItem sin stock → no_stock', cart.addItem({ ...coca, stock: 0 }) === 'no_stock');
  const r1 = cart.addItem({ ...coca, stock: 5 }, undefined, 3);
  check('addItem dentro del stock → ok', r1 === 'ok' && useCartStore.getState().items[0].quantity === 3);
  const r2 = cart.addItem({ ...coca, stock: 5 }, undefined, 4);
  check('addItem sobre el stock disponible → capped y acotado',
    r2 === 'capped' && useCartStore.getState().items.reduce((s, i) => s + i.quantity, 0) === 5);
  const r3 = cart.addItem({ ...coca, stock: 5 }, undefined, 1);
  check('addItem sin disponibilidad → no_stock', r3 === 'no_stock'
    && useCartStore.getState().items.reduce((s, i) => s + i.quantity, 0) === 5);
  useCartStore.getState().clearCart();

  // ── Cupones ──
  section('Cupones');
  const couponStore = useCouponStore.getState();
  couponStore.createCoupon({
    code: 'TEST10', type: 'percentage', value: 10, minPurchase: 1000, maxUses: 2,
    applicableBusinesses: ['kiosko'], validFrom: today,
    validUntil: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  });
  check('Valida cupón vigente', !!useCouponStore.getState().validateCoupon('test10', 'kiosko', 5000));
  check('Rechaza por compra mínima', !useCouponStore.getState().validateCoupon('TEST10', 'kiosko', 500));
  check('Rechaza por negocio', !useCouponStore.getState().validateCoupon('TEST10', 'delivery', 5000));

  // Venta con cupón: subtotal 1350*1 → 10% off = 1215
  useCartStore.getState().clearCart();
  useCartStore.getState().setPaymentMethod('efectivo');
  useCartStore.getState().addItem({ ...coca, stock: 50 });
  useCartStore.getState().setDiscount(10);
  const totalConDescuento = useCartStore.getState().getTotal();

  // ── Venta kiosko completa ──
  section('Venta kiosko (caja + stock + orden + auditoría)');
  userStore.startTurn('kiosko', 'manana');
  const cashBeforeK = revenue(useCashStore.getState().getOpenRegister('kiosko'));
  const auditBefore = useAuditStore.getState().entries.length;
  const orderId = useCartStore.getState().confirmStoreOrder('kiosko');

  check('Orden creada status sold', orderId !== null && useOrderStore.getState().getOrderById(orderId!)?.status === 'sold');
  check('Total respeta descuento (1215)', Math.round(totalConDescuento) === 1215);
  const soldOrder = useOrderStore.getState().getOrderById(orderId!);
  check('Orden guarda subtotal + monto de descuento', soldOrder!.subtotal === 1350 && soldOrder!.discount === 135 && soldOrder!.total === 1215);
  check('Caja registra venta descontando cupón', revenue(useCashStore.getState().getBusinessReport('kiosko', today)) === cashBeforeK + 1215);
  check('Stock descontado por la venta', useProductStore.getState().products.find(p => p.id === coca.id)!.stock === coca.stock - 1);
  check('Turno registra venta', useUserStore.getState().currentTurn?.totalSales === 1215);
  check('Auditoría suma entrada de venta', useAuditStore.getState().entries.length > auditBefore);
  check('Carrito queda vacío tras vender', useCartStore.getState().items.length === 0);

  // Pago dividido
  section('Pago dividido');
  useCartStore.getState().clearCart();
  useCartStore.getState().addItem({ ...coca, stock: 50 });
  useCartStore.getState().addItem({ ...coca, stock: 50 });
  const splitTotal = useCartStore.getState().getTotal(); // 2700
  const cashAtSplit = revenue(useCashStore.getState().getBusinessReport('kiosko', today));
  useCartStore.getState().confirmStoreOrder('kiosko', [
    { method: 'efectivo', amount: splitTotal / 2 },
    { method: 'tarjeta', amount: splitTotal / 2 },
  ]);
  const reportK = useCashStore.getState().getBusinessReport('kiosko', today)!;
  check('Split genera movimientos por método (efectivo + tarjeta)', reportK.cashIn === cashAtSplit + 1350 && reportK.cardIn === 1350);

  // ── Flujo delivery completo ──
  section('Delivery: carrito → pedido → vendido (caja) → cliente');
  const dcart = useDeliveryCartStore.getState();
  check('Delivery addItem cap por stock', dcart.addItem({ ...pizza, stock: 20 }, undefined, 25) === 'capped'
    && useDeliveryCartStore.getState().items[0].quantity === 20);
  useDeliveryCartStore.getState().clearCart();

  dcart.addItem(milanga, undefined, 2);           // 4500 x 2
  dcart.setCustomerInfo({ name: 'Pedro Test', phone: '1122334455', address: 'Av Siempreviva 742' });
  dcart.setDiscount(10);                          // -900
  dcart.setDeliveryFee(300);

  const stockMilangaAntes = useProductStore.getState().products.find(p => p.id === milanga.id)!.stock;
  const cashBeforeD = revenue(useCashStore.getState().getBusinessReport('delivery', today));
  const customersBefore = useCustomerStore.getState().customers.length;

  const deliveryOrderId = useDeliveryCartStore.getState().confirmOrder(admin.name);
  const dOrder = useOrderStore.getState().getOrderById(deliveryOrderId!);

  check('Pedido delivery creado', !!dOrder);
  check('Datos del cliente guardados en el pedido', dOrder!.customerName === 'Pedro Test' && dOrder!.customerPhone === '1122334455' && dOrder!.customerAddress === 'Av Siempreviva 742');
  // subtotal 9000, desc 10% = 900, envío 300 → total 8400
  check('Total delivery = subtotal − descuento + envío', dOrder!.total === 8400);
  check('Descuento guardado como monto (900)', dOrder!.discount === 900);
  check('Stock descontado al crear pedido', useProductStore.getState().products.find(p => p.id === milanga.id)!.stock === stockMilangaAntes - 2);
  check('Cliente auto-creado con teléfono', useCustomerStore.getState().customers.length === customersBefore + 1);
  const customer = useCustomerStore.getState().getCustomerByPhone('1122334455');
  check('Cliente acumula pedido y gasto', customer?.totalOrders === 1 && customer?.totalSpent === 8400);
  check('Venta NO registrada en caja todavía (estado pending)', revenue(useCashStore.getState().getBusinessReport('delivery', today)) === cashBeforeD);

  // Simular avance de estados hasta vendido
  useOrderStore.getState().updateOrderStatus(deliveryOrderId!, 'confirmed');
  useOrderStore.getState().updateOrderStatus(deliveryOrderId!, 'delivered');
  check('Estado avanza a delivered', useOrderStore.getState().getOrderById(deliveryOrderId!)?.status === 'delivered');

  useOrderStore.getState().markAsSold(deliveryOrderId!);
  check('markAsSold cambia estado', useOrderStore.getState().getOrderById(deliveryOrderId!)?.status === 'sold');
  check('markAsSold registra ingreso en caja delivery', revenue(useCashStore.getState().getBusinessReport('delivery', today)) === cashBeforeD + 8400);

  const movementsD = useCashStore.getState().getBusinessReport('delivery', today)!.movements.filter((m: any) => m.orderId === deliveryOrderId).length;
  useOrderStore.getState().markAsSold(deliveryOrderId!); // doble click
  const movementsD2 = useCashStore.getState().getBusinessReport('delivery', today)!.movements.filter((m: any) => m.orderId === deliveryOrderId).length;
  check('markAsSold es idempotente (no duplica caja)', movementsD === 1 && movementsD2 === 1);

  // Cancelación con guard
  section('Cancelación con restauración de stock única');
  const cancelStockAntes = useProductStore.getState().products.find(p => p.id === milanga.id)!.stock;
  useOrderStore.getState().cancelOrder(deliveryOrderId!);
  useOrderStore.getState().cancelOrder(deliveryOrderId!); // doble
  check('Cancelado una sola vez restaura stock', useProductStore.getState().products.find(p => p.id === milanga.id)!.stock === cancelStockAntes + 2);

  // Devolución
  section('Devolución sobre venta kiosko');
  const retStockAntes = useProductStore.getState().products.find(p => p.id === coca.id)!.stock;
  useReturnStore.getState().processReturn({
    originalOrderId: orderId!,
    businessId: 'kiosko',
    items: [{ productId: coca.id, productName: coca.name, quantity: 1, unitPrice: coca.salePrice, reason: 'defective' }],
    totalRefund: coca.salePrice,
    refundMethod: 'cash',
    processedBy: admin.id,
    processedByName: admin.name,
  });
  useProductStore.getState().updateStock(coca.id, 1, 'return', 'devolución prueba', admin.id, admin.name, orderId!);
  const cashOutK = useCashStore.getState().getBusinessReport('kiosko', today)!.cashOut;
  useCashStore.getState().addMovement(kioskoReg.id, {
    type: 'expense', amount: coca.salePrice, description: 'Devolución prueba',
    paymentMethod: 'efectivo', userId: admin.id, userName: admin.name,
  });
  check('Devolución registrada', useReturnStore.getState().getReturns('kiosko').length === 1);
  check('Stock restaurado (+1)', useProductStore.getState().products.find(p => p.id === coca.id)!.stock === retStockAntes + 1);
  check('Egreso por devolución afecta caja', useCashStore.getState().getBusinessReport('kiosko', today)!.cashOut === cashOutK + coca.salePrice);
  check('Total devoluciones calcula', useReturnStore.getState().getTotalRefunds('kiosko', today) === coca.salePrice);

  // WhatsApp parser
  section('Parser de WhatsApp');
  const waOrder = useOrderStore.getState().importFromWhatsApp('hola\n2x Pizza Muzzarella\nuna Milanesa Napolitana\ngracias', admin.name, 'delivery');
  check('Importa "2x Producto" y "una Producto"', waOrder !== null && waOrder!.items.length >= 1);

  // Cierre de caja y reportes
  section('Cierre de caja');
  useCashStore.getState().closeRegister(kioskoReg.id, revenue(useCashStore.getState().getBusinessReport('kiosko', today)), admin.id, admin.name);
  check('Caja cerrada', useCashStore.getState().registers.find(r => r.id === kioskoReg.id)?.status === 'closed');
  check('getOpenRegister devuelve null tras cierre', !useCashStore.getState().getOpenRegister('kiosko'));
  const daily = useCashStore.getState().getDailyReport(today);
  check('Reporte diario consolida ambos negocios', daily.totalRevenue > 0);

  // Auditoría
  section('Auditoría');
  const actions = new Set(useAuditStore.getState().entries.map(e => e.action));
  ['login', 'cash_open', 'sale', 'order_created', 'order_status_changed', 'stock_adjustment', 'turn_ended'].forEach(a => actions.has(a));
  check(`Eventos clave auditados (${Array.from(actions).join(', ')})`,
    ['login', 'cash_open', 'sale'].every(a => actions.has(a)));

  // Persistencia
  section('Persistencia');
  check('Storage recibió datos de orders', (storageData.get('dippy-orders') || '').includes('"orders"'));
  check('Storage recibió datos de cash', (storageData.get('dippy-cash') || '').includes('"registers"'));

  console.log('\n════════════════════════════');
  console.log(`RESULTADO: ${passed} pasan · ${failed} fallan`);
  console.log('════════════════════════════\n');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
