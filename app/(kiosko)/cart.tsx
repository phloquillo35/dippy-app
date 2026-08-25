import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useCartStore } from '@/store/cartStore';
import { useProductStore } from '@/store/productStore';
import { useCouponStore } from '@/store/couponStore';
import { PaymentMethod } from '@/types';
import { formatCurrency } from '@/utils/uuid';
import { hapticMedium, hapticSuccess, hapticError } from '@/utils/haptics';
import { SplitPaymentPicker, SplitPayment } from '@/components/SplitPaymentPicker';
import { useOrderStore } from '@/store/orderStore';

const PAYMENT_OPTIONS: { method: PaymentMethod; label: string; emoji: string }[] = [
  { method: 'efectivo', label: 'Efectivo', emoji: '💵' },
  { method: 'tarjeta', label: 'Tarjeta', emoji: '💳' },
  { method: 'transferencia', label: 'Transferencia', emoji: '🏦' },
  { method: 'mercadopago', label: 'MercadoPago', emoji: '📱' },
  { method: 'qr', label: 'QR', emoji: '📷' },
];

export default function KioskoCartScreen() {
  const colors = useColors();
  const { items, addItem, updateQuantity, getTotal, getItemCount, getSubtotal, paymentMethod, setPaymentMethod, discount, setDiscount } = useCartStore();
  const allProducts = useProductStore(s => s.products);
  const { validateCoupon, applyCoupon } = useCouponStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState(false);

  const catalog = allProducts.filter(
    p => p.businessId === 'kiosko' &&
      (!searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
  );
  const subtotal = getSubtotal();
  const total = getTotal();

  const addToCart = (product: any) => {
    const result = addItem(product);
    if (result === 'no_stock') {
      hapticError();
      Alert.alert('Sin stock', `${product.name} no tiene stock disponible`);
      return;
    }
    if (result === 'capped') {
      hapticError();
      Alert.alert('Stock limitado', `Solo podés agregar hasta ${product.stock} unidades de ${product.name}`);
      return;
    }
    hapticSuccess();
  };

  const executeSale = (split?: SplitPayment[]) => {
    hapticMedium();
    const orderId = useCartStore.getState().confirmStoreOrder('kiosko', split);
    if (orderId && appliedCoupon) applyCoupon(appliedCoupon);

    hapticSuccess();
    setAppliedCoupon(null);
    setCouponCode('');
    setSplitMode(false);

    Alert.alert('✅', 'Venta registrada', [
      { text: 'OK', style: 'cancel' },
      ...(orderId
        ? [{
            text: '🧾 Imprimir recibo',
            onPress: () => {
              const order = useOrderStore.getState().getOrderById(orderId);
              if (!order) return;
              import('@/services/receipt').then(({ generateReceipt }) =>
                generateReceipt({
                  businessName: '🏪 Dippy Kiosko',
                  businessSubtitle: 'Venta directa',
                  orderId: order.id,
                  items: order.items,
                  subtotal: order.subtotal,
                  discount: order.discount,
                  total: order.total,
                  paymentMethod: order.paymentMethod,
                  cashierName: order.userName,
                  date: order.createdAt,
                  accentColor: '#00C8FF',
                }).catch(() => Alert.alert('Error', 'No se pudo generar el recibo'))
              );
            },
          }]
        : []),
    ]);
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    const coupon = validateCoupon(couponCode, 'kiosko', subtotal);
    if (coupon) {
      const couponDiscount = useCouponStore.getState().calculateDiscount(coupon, subtotal);
      const discountPercent = (couponDiscount / subtotal) * 100;
      setDiscount(discountPercent);
      setAppliedCoupon(coupon.code);
      hapticSuccess();
      Alert.alert('Cupón aplicado', `${coupon.type === 'percentage' ? coupon.value + '%' : formatCurrency(coupon.value)} de descuento`);
    } else {
      hapticError();
      Alert.alert('Cupón inválido', 'El código no es válido o ya expiró');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={{ fontSize: 18, marginRight: 6 }}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Buscar producto..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={[styles.scanBtn, { backgroundColor: Colors.celesteInstitucional }]}
          onPress={() => router.push('/scanner')}
        >
          <Text style={styles.scanBtnText}>📷 Escanear</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Catálogo</Text>
      <FlatList
        data={catalog}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catalogList}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.catalogCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => addToCart(item)}>
            <Text style={styles.catalogEmoji}>{item.emoji}</Text>
            <Text style={[styles.catalogName, { color: colors.textPrimary }]} numberOfLines={2}>{item.name}</Text>
            <Text style={[styles.catalogPrice, { color: Colors.exito }]}>${item.salePrice.toLocaleString()}</Text>
            <View style={[styles.catalogStock, { backgroundColor: item.stock <= 0 ? `${Colors.error}20` : `${Colors.exito}20` }]}>
              <Text style={{ color: item.stock <= 0 ? Colors.error : Colors.exito, fontSize: 11 }}>
                {item.stock <= 0 ? 'Sin stock' : `Stock ${item.stock}`}
              </Text>
            </View>
            <View style={[styles.catalogAdd, { backgroundColor: Colors.exito }]}>
              <Text style={{ color: colors.textOnPrimary, fontSize: 22, fontWeight: 'bold' }}>+</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.catalogEmpty}>
            <Text style={{ color: colors.textSecondary }}>Sin productos</Text>
          </View>
        }
      />

      <View style={styles.cartHeader}>
        <Text style={[styles.cartTitle, { color: colors.textPrimary }]}>🛒 Carrito ({getItemCount()})</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.cartList}
        renderItem={({ item }) => (
          <View style={[styles.cartItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ fontSize: 24 }}>{item.emoji || '📦'}</Text>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{item.productName}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>${item.unitPrice.toLocaleString()} c/u</Text>
            </View>
            <View style={styles.quantityRow}>
              <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: colors.border }]} onPress={() => { updateQuantity(item.id, item.quantity - 1); hapticMedium(); }}>
                <Text>-</Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.qtyInput, { color: colors.textPrimary, borderColor: colors.border }]}
                keyboardType="number-pad"
                value={String(item.quantity)}
                onChangeText={v => {
                  const n = parseInt(v.replace(/\D/g, ''), 10);
                  if (!isNaN(n)) { updateQuantity(item.id, n); hapticMedium(); }
                }}
              />
              <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: colors.border }]} onPress={() => { updateQuantity(item.id, item.quantity + 1); hapticMedium(); }}>
                <Text>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: Colors.exito, fontWeight: 'bold', marginLeft: 12 }}>${item.totalPrice.toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Tocá un producto del catálogo para agregarlo</Text>
          </View>
        }
      />

      {items.length > 0 && (
        <View style={[styles.footer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.couponRow}>
            <TextInput
              style={[styles.couponInput, { color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Cupón de descuento"
              placeholderTextColor={colors.textSecondary}
              value={couponCode}
              onChangeText={setCouponCode}
            />
            <TouchableOpacity style={[styles.couponBtn, { backgroundColor: appliedCoupon ? Colors.exito : Colors.celesteInstitucional }]} onPress={handleApplyCoupon}>
              <Text style={{ color: colors.textOnPrimary, fontWeight: 'bold' }}>{appliedCoupon ? '✓' : 'OK'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.totalRow}>
            <Text style={{ color: colors.textSecondary }}>Subtotal</Text>
            <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>${subtotal.toLocaleString()}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ color: Colors.exito }}>Descuento ({discount.toFixed(0)}%)</Text>
              <Text style={{ color: Colors.exito }}>-{(subtotal * discount / 100).toFixed(0)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>Total</Text>
            <Text style={{ color: Colors.exito, fontSize: 22, fontWeight: 'bold' }}>${total.toLocaleString()}</Text>
          </View>

          <Text style={[styles.payLabel, { color: colors.textSecondary }]}>Método de pago</Text>
          <View style={styles.payRow}>
            {PAYMENT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.method}
                style={[styles.payBtn, { backgroundColor: paymentMethod === opt.method ? `${Colors.celesteInstitucional}20` : colors.background, borderColor: paymentMethod === opt.method ? Colors.celesteInstitucional : colors.border }]}
                onPress={() => { setPaymentMethod(opt.method); hapticMedium(); }}
              >
                <Text style={styles.payEmoji}>{opt.emoji}</Text>
                <Text style={[styles.payLabel, { color: paymentMethod === opt.method ? Colors.celesteInstitucional : colors.textSecondary }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.splitToggle, { borderColor: splitMode ? Colors.exito : colors.border }]}
            onPress={() => setSplitMode(!splitMode)}
          >
            <Text style={{ color: splitMode ? Colors.exito : colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
              💳 Pago dividido {splitMode ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>

          {splitMode ? (
            <SplitPaymentPicker total={total} onConfirm={payments => executeSale(payments)} />
          ) : (
            <TouchableOpacity
              style={[styles.sellBtn, { backgroundColor: !paymentMethod ? Colors.grisMedio : Colors.exito }]}
              disabled={!paymentMethod}
              onPress={() => {
                if (!paymentMethod) return;
                const payLabel = PAYMENT_OPTIONS.find(o => o.method === paymentMethod)?.label || paymentMethod;
                Alert.alert('Confirmar venta', `Total: $${total.toLocaleString()}\nPago: ${payLabel}${appliedCoupon ? `\nCupón: ${appliedCoupon}` : ''}`, [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Vender', onPress: () => executeSale() },
                ]);
              }}
            >
              <Text style={styles.sellBtnText}>Cobrar ${total.toLocaleString()}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', margin: Spacing.md, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 16 },
  scanBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 40, borderRadius: 10, gap: 6 },
  scanBtnText: { color: Colors.blanco, fontWeight: 'bold', fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginHorizontal: Spacing.md, marginTop: 4, marginBottom: 8 },
  catalogList: { paddingHorizontal: Spacing.md, gap: 10 },
  catalogCard: { width: 130, borderRadius: BorderRadius.lg, borderWidth: 1, padding: 10, alignItems: 'center', position: 'relative' },
  catalogEmoji: { fontSize: 40, marginBottom: 4 },
  catalogName: { fontSize: 13, fontWeight: '600', textAlign: 'center', minHeight: 34 },
  catalogPrice: { fontSize: 15, fontWeight: 'bold', marginTop: 2 },
  catalogStock: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  catalogAdd: { position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  catalogEmpty: { padding: 20 },
  cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  cartTitle: { fontSize: 18, fontWeight: 'bold', marginHorizontal: Spacing.md, marginBottom: 8 },
  cartList: { padding: Spacing.md, paddingBottom: 280 },
  cartItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: 8, borderWidth: 1 },
  quantityRow: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  qtyInput: { width: 40, height: 32, borderWidth: 1, borderRadius: 8, textAlign: 'center', fontSize: 15 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, borderTopWidth: 2, borderTopColor: Colors.grisClaro },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  couponRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  couponInput: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13 },
  couponBtn: { paddingHorizontal: 14, borderRadius: 8, justifyContent: 'center' },
  payLabel: { fontSize: 12, marginTop: 6, marginBottom: 4 },
  payRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  payBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, gap: 4 },
  payEmoji: { fontSize: 14 },
  sellBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  splitToggle: { borderWidth: 1, borderRadius: 10, alignItems: 'center', paddingVertical: 8, marginTop: 8 },
  sellBtnText: { color: Colors.blanco, fontSize: 18, fontWeight: 'bold' },
});
