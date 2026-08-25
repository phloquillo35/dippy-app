import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useCartStore } from '@/store/cartStore';
import { useProductStore } from '@/store/productStore';
import { useCouponStore } from '@/store/couponStore';
import { PaymentMethod } from '@/types';
import { formatCurrency } from '@/utils/uuid';
import { hapticMedium, hapticSuccess, hapticError } from '@/utils/haptics';

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
  const searchProducts = useProductStore(s => s.searchProducts);
  const { validateCoupon, applyCoupon } = useCouponStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const filteredProducts = searchQuery ? searchProducts(searchQuery, 'kiosko') : [];
  const subtotal = getSubtotal();
  const total = getTotal();

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
        <Text>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Escanear o buscar producto..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {filteredProducts.length > 0 && (
        <View style={[styles.productList, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <FlatList
            data={filteredProducts}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.productItem}
                onPress={() => {
                  if (item.stock <= 0) {
                    Alert.alert('Sin stock', `${item.name} no tiene stock disponible`);
                    return;
                  }
                  addItem(item);
                  hapticMedium();
                  setSearchQuery('');
                }}
              >
                <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{item.name}</Text>
                  <Text style={{ color: Colors.exito, fontSize: 13 }}>${item.salePrice.toLocaleString()}</Text>
                </View>
                <Text style={{ color: item.stock <= 0 ? Colors.error : colors.textSecondary }}>
                  Stock: {item.stock}
                </Text>
              </TouchableOpacity>
            )}
            style={{ maxHeight: 200 }}
          />
        </View>
      )}

      <Text style={[styles.cartTitle, { color: colors.textPrimary }]}>🛒 Carrito ({getItemCount()})</Text>

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
              <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: '#E0E0E0' }]} onPress={() => { updateQuantity(item.id, item.quantity - 1); hapticMedium(); }}>
                <Text>-</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.textPrimary, marginHorizontal: 12, fontWeight: 'bold' }}>{item.quantity}</Text>
              <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: '#E0E0E0' }]} onPress={() => { updateQuantity(item.id, item.quantity + 1); hapticMedium(); }}>
                <Text>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: Colors.exito, fontWeight: 'bold', marginLeft: 12 }}>${item.totalPrice.toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Agregá productos para vender</Text>
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
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{appliedCoupon ? '✓' : 'OK'}</Text>
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
            style={[styles.sellBtn, { backgroundColor: !paymentMethod ? '#CCC' : Colors.exito }]}
            disabled={!paymentMethod}
            onPress={() => {
              if (!paymentMethod) return;
              hapticMedium();
              const payLabel = PAYMENT_OPTIONS.find(o => o.method === paymentMethod)?.label || paymentMethod;
              Alert.alert('Confirmar venta', `Total: $${total.toLocaleString()}\nPago: ${payLabel}${appliedCoupon ? `\nCupón: ${appliedCoupon}` : ''}`, [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Vender',
                  onPress: () => {
                    useCartStore.getState().confirmStoreOrder('kiosko');
                    if (appliedCoupon) applyCoupon(appliedCoupon);
                    hapticSuccess();
                    setAppliedCoupon(null);
                    setCouponCode('');
                    Alert.alert('✅', 'Venta registrada');
                  },
                },
              ]);
            }}
          >
            <Text style={styles.sellBtnText}>Cobrar ${total.toLocaleString()}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', margin: Spacing.md, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 16 },
  productList: { marginHorizontal: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden' },
  productItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  cartTitle: { fontSize: 18, fontWeight: 'bold', marginHorizontal: Spacing.md, marginBottom: 8 },
  cartList: { padding: Spacing.md, paddingBottom: 300 },
  cartItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: 8, borderWidth: 1 },
  quantityRow: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 14, marginTop: 8 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, borderTopWidth: 2, borderTopColor: '#E0E0E0' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  couponRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  couponInput: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13 },
  couponBtn: { paddingHorizontal: 14, borderRadius: 8, justifyContent: 'center' },
  payLabel: { fontSize: 12, marginTop: 6, marginBottom: 4 },
  payRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  payBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, gap: 4 },
  payEmoji: { fontSize: 14 },
  sellBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  sellBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
