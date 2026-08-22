import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TextInput } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';
import { CartItemCard } from '@/components/Card';
import { Button } from '@/components/Button';
import { sendReceiptWhatsApp } from '@/utils/whatsapp';
import { formatCurrency } from '@/utils/uuid';

export default function CartScreen() {
  const colors = useColors();
  const {
    items,
    notes,
    discount,
    setNotes,
    setDiscount,
    removeItem,
    updateQuantity,
    getSubtotal,
    getTotal,
    getItemCount,
    clearCart,
  } = useCartStore();

  const currentUser = useUserStore(s => s.currentUser);
  const currentTurn = useUserStore(s => s.currentTurn);
  const recordSale = useUserStore(s => s.recordSale);

  const [showCheckout, setShowCheckout] = useState(false);

  const subtotal = getSubtotal();
  const total = getTotal();
  const itemCount = getItemCount();
  const discountAmount = subtotal * (discount / 100);

  const handleCompleteSale = async () => {
    if (items.length === 0) {
      Alert.alert('Carrito vacío', 'Agregá productos antes de cobrar');
      return;
    }

    const orderData = {
      orderId: `ORD-${Date.now().toString(36).toUpperCase()}`,
      items,
      subtotal,
      discount: discountAmount,
      total,
      channel: 'store' as const,
      userName: currentUser?.name,
    };

    Alert.alert(
      '✅ Venta Completada',
      `Total: ${formatCurrency(total)}\n🏪 Local`,
      [
        {
          text: '📱 Enviar por WhatsApp',
          onPress: async () => {
            await sendReceiptWhatsApp(orderData, undefined);
            finalizeSale();
          },
        },
        {
          text: '🧾 Solo cobrar',
          onPress: finalizeSale,
        },
      ]
    );
  };

  const finalizeSale = () => {
    if (currentTurn) {
      recordSale(total, itemCount, 'store');
    }
    clearCart();
    setShowCheckout(false);
    Alert.alert('🎉 Éxito', 'Venta registrada correctamente');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, ...Shadows.sm }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>🛒 Carrito de Tienda</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {itemCount > 0 ? `${itemCount} items en tu carrito` : 'Agregá productos desde la pestaña Productos'}
        </Text>
      </View>

      {/* Cart Items */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CartItemCard
            name={item.productName}
            emoji={item.emoji}
            quantity={item.quantity}
            unitPrice={item.unitPrice}
            totalPrice={item.totalPrice}
            variantName={item.variantName}
            notes={item.notes}
            onQuantityChange={(qty) => updateQuantity(item.id, qty)}
            onRemove={() => removeItem(item.id)}
          />
        )}
        contentContainerStyle={styles.itemsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              Tu carrito está vacío
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Agregá productos desde la pestaña Productos
            </Text>
          </View>
        }
      />

      {/* Cart Summary */}
      {items.length > 0 && (
        <View style={[styles.summary, { backgroundColor: colors.card, ...Shadows.lg }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Subtotal ({itemCount} items)
            </Text>
            <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
              {formatCurrency(subtotal)}
            </Text>
          </View>

          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: Colors.exito }]}>
                🏷️ Descuento ({discount}%)
              </Text>
              <Text style={[styles.summaryValue, { color: Colors.exito }]}>
                -{formatCurrency(discountAmount)}
              </Text>
            </View>
          )}

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>TOTAL</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>{formatCurrency(total)}</Text>
          </View>

          {/* Discount Input */}
          <View style={styles.discountRow}>
            <Text style={[styles.discountLabel, { color: colors.textSecondary }]}>🏷️ Descuento %</Text>
            <TextInput
              style={[styles.discountInput, { borderColor: colors.border, color: colors.textPrimary }]}
              value={discount.toString()}
              onChangeText={(text) => setDiscount(parseInt(text) || 0)}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>

          {/* Notes */}
          <View style={styles.notesSection}>
            <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>📝 Notas</Text>
            <TextInput
              style={[styles.input, styles.notesInput, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Ej: sin sal, bien cocido..."
              placeholderTextColor={colors.placeholder}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              title="🧾 Cobrar"
              onPress={handleCompleteSale}
              icon="💰"
              style={styles.checkoutButton}
            />
            <Button
              title="📱 WhatsApp"
              variant="success"
              onPress={handleCompleteSale}
              icon="📱"
              style={styles.whatsappButton}
            />
            <Button
              title="🗑️ Vaciar"
              variant="danger"
              onPress={() => {
                Alert.alert('Vaciar carrito', '¿Estás seguro?', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Vaciar', style: 'destructive', onPress: clearCart },
                ]);
              }}
              icon="🗑️"
              style={styles.clearButton}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  itemsList: {
    padding: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  summary: {
    padding: Spacing.lg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  discountLabel: {
    fontSize: 14,
  },
  discountInput: {
    width: 60,
    height: 36,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    textAlign: 'center',
    fontSize: 14,
  },
  notesSection: {
    marginTop: Spacing.md,
  },
  notesLabel: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  checkoutButton: {
    flex: 2,
  },
  whatsappButton: {
    flex: 1,
  },
  clearButton: {
    flex: 1,
  },
});
