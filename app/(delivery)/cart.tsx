import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useDeliveryCartStore } from '@/store/deliveryCartStore';
import { useUserStore } from '@/store/userStore';
import { useCustomerStore } from '@/store/customerStore';
import { PaymentMethod } from '@/types';
import { formatCurrency } from '@/utils/uuid';

const PAYMENT_OPTIONS: { method: PaymentMethod; label: string; emoji: string }[] = [
  { method: 'efectivo', label: 'Efectivo', emoji: '💵' },
  { method: 'transferencia', label: 'Transferencia', emoji: '🏦' },
  { method: 'tarjeta', label: 'Tarjeta', emoji: '💳' },
  { method: 'mercadopago', label: 'MercadoPago', emoji: '📱' },
];

type Step = 'items' | 'customer' | 'payment' | 'confirm';
const STEPS: { key: Step; label: string }[] = [
  { key: 'items', label: 'Pedido' },
  { key: 'customer', label: 'Cliente' },
  { key: 'payment', label: 'Pago' },
  { key: 'confirm', label: 'Confirmar' },
];

export default function DeliveryCartScreen() {
  const colors = useColors();
  const {
    items, customerName, customerPhone, customerAddress, notes, discount, deliveryFee,
    removeItem, updateQuantity, clearCart, setCustomerInfo, setNotes, setDiscount,
    setDeliveryFee, getSubtotal, getTotal, getItemCount, confirmOrder,
  } = useDeliveryCartStore();
  const { currentUser } = useUserStore();
  const customerStore = useCustomerStore();
  const [step, setStep] = useState<Step>('items');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('efectivo');
  const [payNow, setPayNow] = useState(true);

  const goStep = (s: Step) => {
    if (s === 'customer' && items.length === 0) return;
    if ((s === 'payment' || s === 'confirm') && !customerName.trim()) {
      Alert.alert('Falta el cliente', 'Completá los datos del cliente primero');
      return;
    }
    setStep(s);
  };

  const onPhoneChange = (phone: string) => {
    setCustomerInfo({ phone });
    const existing = customerStore.getCustomerByPhone(phone.trim());
    if (existing) {
      setCustomerInfo({
        name: existing.name || customerName,
        address: existing.address || customerAddress,
      });
    }
  };

  const handleConfirm = () => {
    if (!currentUser) return Alert.alert('Error', 'Iniciá sesión');
    if (items.length === 0) return Alert.alert('Error', 'Agregá items');
    if (!customerName.trim()) return Alert.alert('Error', 'Ingresá el nombre del cliente');
    if (!customerPhone.trim()) return Alert.alert('Error', 'Ingresá el teléfono del cliente');
    if (!customerAddress.trim()) return Alert.alert('Error', 'Ingresá la dirección de entrega');

    const orderId = confirmOrder(currentUser.name, 'menu', payNow ? payMethod : 'efectivo', payNow);
    if (orderId) {
      Alert.alert('✅', `Pedido #${orderId.slice(-6).toUpperCase()} creado${payNow ? ' y cobrado' : ' (contraentrega)'}`);
      setStep('items');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Step indicator */}
      <View style={styles.steps}>
        {STEPS.map((s, i) => {
          const active = step === s.key;
          const done = STEPS.findIndex(x => x.key === step) > i;
          return (
            <React.Fragment key={s.key}>
              <TouchableOpacity style={[styles.stepDot, (active || done) && { backgroundColor: Colors.azulInstitucional }]} onPress={() => goStep(s.key)}>
                <Text style={[styles.stepNum, (active || done) && { color: colors.textOnPrimary }]}>{i + 1}</Text>
              </TouchableOpacity>
              {i < STEPS.length - 1 && <View style={[styles.stepLine, done && { backgroundColor: Colors.azulInstitucional }]} />}
            </React.Fragment>
          );
        })}
      </View>

      {step === 'items' && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🍽️ Tu pedido ({getItemCount()})</Text>
          <FlatList
            data={items}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={[styles.cartItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ fontSize: 24 }}>{item.emoji || '🍽️'}</Text>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{item.productName}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>${item.unitPrice.toLocaleString()} c/u</Text>
                </View>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: colors.border }]} onPress={() => updateQuantity(item.id, item.quantity - 1)}>
                    <Text>-</Text>
                  </TouchableOpacity>
                  <Text style={{ color: colors.textPrimary, marginHorizontal: 10, fontWeight: 'bold' }}>{item.quantity}</Text>
                  <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: colors.border }]} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                    <Text>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ color: Colors.exito, fontWeight: 'bold', marginLeft: 10 }}>${item.totalPrice.toLocaleString()}</Text>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🍽️</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Tu pedido está vacío</Text>
                <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: Colors.azulInstitucional }]} onPress={() => router.push('/(delivery)/menu')}>
                  <Text style={styles.emptyBtnText}>➕ Agregar platos del menú</Text>
                </TouchableOpacity>
              </View>
            }
          />
          {items.length > 0 && (
            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: Colors.azulInstitucional }]} onPress={() => goStep('customer')}>
              <Text style={styles.nextBtnText}>Siguiente: Datos del cliente →</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {step === 'customer' && (
        <ScrollView contentContainerStyle={styles.form}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>👤 Datos del cliente</Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Nombre *</Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="Nombre del cliente"
            placeholderTextColor={colors.textSecondary}
            value={customerName}
            onChangeText={v => setCustomerInfo({ name: v })}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Teléfono *</Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="WhatsApp / Teléfono"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            value={customerPhone}
            onChangeText={onPhoneChange}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Dirección *</Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="Dirección de entrega"
            placeholderTextColor={colors.textSecondary}
            value={customerAddress}
            onChangeText={v => setCustomerInfo({ address: v })}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Costo de envío</Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="$ 500"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={deliveryFee.toString()}
            onChangeText={v => setDeliveryFee(parseInt(v) || 0)}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Notas</Text>
          <TextInput
            style={[styles.input, styles.notesInput, { color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="Ej: sin cebolla, extra queso..."
            placeholderTextColor={colors.textSecondary}
            multiline
            value={notes}
            onChangeText={setNotes}
          />

          <View style={styles.navBtns}>
            <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.border }]} onPress={() => setStep('items')}>
              <Text>← Volver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navBtn, { backgroundColor: Colors.azulInstitucional }]} onPress={() => goStep('payment')}>
              <Text style={styles.navBtnText}>Siguiente →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {step === 'payment' && (
        <ScrollView contentContainerStyle={styles.form}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>💳 Pago</Text>

          <TouchableOpacity
            style={[styles.payMode, { borderColor: payNow ? Colors.exito : colors.border, backgroundColor: payNow ? `${Colors.exito}20` : colors.card }]}
            onPress={() => setPayNow(true)}
          >
            <Text style={[styles.payModeText, { color: payNow ? Colors.exito : colors.textPrimary }]}>💰 Cobrar ahora</Text>
          </TouchableOpacity>

          {payNow && (
            <View style={styles.payRow}>
              {PAYMENT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.method}
                  style={[styles.payBtn, { backgroundColor: payMethod === opt.method ? `${Colors.exito}20` : colors.card, borderColor: payMethod === opt.method ? Colors.exito : colors.border }]}
                  onPress={() => setPayMethod(opt.method)}
                >
                  <Text style={styles.payEmoji}>{opt.emoji}</Text>
                  <Text style={{ color: payMethod === opt.method ? Colors.exito : colors.textSecondary, fontSize: 12 }}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.payMode, { borderColor: !payNow ? Colors.advertencia : colors.border, backgroundColor: !payNow ? `${Colors.advertencia}20` : colors.card, marginTop: 12 }]}
            onPress={() => setPayNow(false)}
          >
            <Text style={[styles.payModeText, { color: !payNow ? Colors.advertencia : colors.textPrimary }]}>📦 Pagar al entregar (contraentrega)</Text>
          </TouchableOpacity>

          <View style={styles.navBtns}>
            <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.border }]} onPress={() => setStep('customer')}>
              <Text>← Volver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navBtn, { backgroundColor: Colors.azulInstitucional }]} onPress={() => goStep('confirm')}>
              <Text style={styles.navBtnText}>Siguiente →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {step === 'confirm' && (
        <ScrollView contentContainerStyle={styles.form}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>✅ Resumen del pedido</Text>

          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>👤 Cliente</Text>
            <Text style={{ color: colors.textPrimary }}>{customerName}</Text>
            {customerPhone ? <Text style={{ color: colors.textSecondary }}>📞 {customerPhone}</Text> : null}
            {customerAddress ? <Text style={{ color: colors.textSecondary }}>📍 {customerAddress}</Text> : null}
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>🍽️ Items</Text>
            {items.map((item, i) => (
              <View key={i} style={styles.summaryRow}>
                <Text style={{ color: colors.textSecondary, flex: 1 }}>{item.quantity}x {item.productName}</Text>
                <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>${item.totalPrice.toLocaleString()}</Text>
              </View>
            ))}
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={{ color: Colors.exito, flex: 1 }}>Descuento ({discount}%)</Text>
                <Text style={{ color: Colors.exito }}>-{formatCurrency(getSubtotal() * discount / 100)}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={{ color: colors.textSecondary, flex: 1 }}>🚗 Envío</Text>
              <Text style={{ color: colors.textSecondary }}>${deliveryFee.toLocaleString()}</Text>
            </View>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>🏷️ Descuento (%)</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={discount ? String(discount) : ''}
              onChangeText={v => setDiscount(parseInt(v.replace(/\D/g, ''), 10) || 0)}
            />
          </View>

          <View style={[styles.totalCard, { backgroundColor: Colors.negroSuave }]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(getTotal())}</Text>
            <Text style={{ color: Colors.grisMedio, fontSize: 12, marginTop: 4 }}>
              {payNow ? `Cobro: ${PAYMENT_OPTIONS.find(o => o.method === payMethod)?.label}` : 'Contraentrega'}
            </Text>
          </View>

          {notes ? (
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>📝 Notas</Text>
              <Text style={{ color: colors.textSecondary }}>{notes}</Text>
            </View>
          ) : null}

          <View style={styles.navBtns}>
            <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.border }]} onPress={() => setStep('payment')}>
              <Text>← Volver</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navBtn, { backgroundColor: Colors.exito }]} onPress={handleConfirm}>
              <Text style={styles.navBtnText}>Crear pedido</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.md },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.grisClaro, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontWeight: 'bold', color: Colors.grisOscuro },
  stepLine: { width: 24, height: 2, backgroundColor: Colors.grisClaro },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginHorizontal: Spacing.md, marginBottom: 8 },
  list: { padding: Spacing.md, paddingBottom: 80 },
  cartItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: 8, borderWidth: 1 },
  qtyRow: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', marginTop: 50 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 14, marginTop: 8, marginBottom: 16 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: Colors.blanco, fontWeight: 'bold' },
  nextBtn: { margin: Spacing.md, padding: 14, borderRadius: 12, alignItems: 'center' },
  nextBtnText: { color: Colors.blanco, fontWeight: 'bold', fontSize: 16 },
  form: { padding: Spacing.md, paddingBottom: 40 },
  label: { fontSize: 13, marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 4 },
  notesInput: { height: 80, textAlignVertical: 'top' },
  navBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  navBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  navBtnText: { color: Colors.blanco, fontWeight: 'bold' },
  summaryCard: { padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: 12, borderWidth: 1 },
  summaryTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 6 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalCard: { padding: Spacing.lg, borderRadius: BorderRadius.xl, alignItems: 'center', marginBottom: 16 },
  totalLabel: { color: Colors.grisMedio, fontSize: 14 },
  totalValue: { color: Colors.blanco, fontSize: 28, fontWeight: 'bold' },
  payMode: { borderWidth: 2, borderRadius: 12, padding: 14, alignItems: 'center' },
  payModeText: { fontSize: 16, fontWeight: 'bold' },
  payRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 12 },
  payBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, gap: 6 },
  payEmoji: { fontSize: 16 },
});
