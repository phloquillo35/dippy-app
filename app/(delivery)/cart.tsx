import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useDeliveryCartStore } from '@/store/deliveryCartStore';
import { useUserStore } from '@/store/userStore';
import { formatCurrency } from '@/utils/uuid';

export default function DeliveryCartScreen() {
  const colors = useColors();
  const {
    items, customerName, customerPhone, customerAddress, notes, discount, deliveryFee,
    addItem, removeItem, updateQuantity, clearCart, setCustomerInfo, setNotes, setDiscount,
    setDeliveryFee, getSubtotal, getTotal, getItemCount, confirmOrder,
  } = useDeliveryCartStore();
  const { currentUser } = useUserStore();
  const [step, setStep] = useState<'items' | 'customer' | 'confirm'>('items');

  const handleConfirm = () => {
    if (!currentUser) return Alert.alert('Error', 'Iniciá sesión');
    if (items.length === 0) return Alert.alert('Error', 'Agregá items');
    if (!customerName.trim()) return Alert.alert('Error', 'Ingresá el nombre del cliente');
    if (!customerAddress.trim()) return Alert.alert('Error', 'Ingresá la dirección de entrega');

    Alert.alert(
      'Confirmar pedido',
      `Cliente: ${customerName}\nTotal: $${getTotal().toLocaleString()}\nEnvío: $${deliveryFee}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            const orderId = confirmOrder(currentUser.name);
            if (orderId) {
              Alert.alert('✅', `Pedido #${orderId.slice(-6).toUpperCase()} creado`);
              setStep('items');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Step indicator */}
      <View style={styles.steps}>
        {['items', 'customer', 'confirm'].map((s, i) => (
          <TouchableOpacity key={s} style={[styles.stepDot, step === s && { backgroundColor: Colors.azulInstitucional }]} onPress={() => setStep(s as any)}>
            <Text style={[styles.stepNum, step === s && { color: colors.textOnPrimary }]}>{i + 1}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {step === 'items' && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🛒 Items ({getItemCount()})</Text>
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
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Agregá platos del menú</Text>
              </View>
            }
          />
          {items.length > 0 && (
            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: Colors.azulInstitucional }]} onPress={() => setStep('customer')}>
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

          <Text style={[styles.label, { color: colors.textSecondary }]}>Teléfono</Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="WhatsApp / Teléfono"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            value={customerPhone}
            onChangeText={v => setCustomerInfo({ phone: v })}
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
            <TouchableOpacity style={[styles.navBtn, { backgroundColor: Colors.azulInstitucional }]} onPress={() => setStep('confirm')}>
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

          <View style={[styles.totalCard, { backgroundColor: Colors.negroSuave }]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(getTotal())}</Text>
          </View>

          {notes ? (
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>📝 Notas</Text>
              <Text style={{ color: colors.textSecondary }}>{notes}</Text>
            </View>
          ) : null}

          <View style={styles.navBtns}>
            <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.border }]} onPress={() => setStep('customer')}>
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
  steps: { flexDirection: 'row', justifyContent: 'center', padding: Spacing.md, gap: 12 },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.grisClaro, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontWeight: 'bold', color: Colors.grisOscuro },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginHorizontal: Spacing.md, marginBottom: 8 },
  list: { padding: Spacing.md, paddingBottom: 80 },
  cartItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: 8, borderWidth: 1 },
  qtyRow: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 14, marginTop: 8 },
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
});
