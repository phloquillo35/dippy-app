import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useCartStore } from '@/store/cartStore';
import { useProductStore } from '@/store/productStore';
import { useBusinessStore } from '@/store/businessStore';
import { formatCurrency } from '@/utils/uuid';

export default function KioskoCartScreen() {
  const colors = useColors();
  const { activeBusiness } = useBusinessStore();
  const { items, addItem, removeItem, updateQuantity, clearCart, getTotal, getItemCount, getSubtotal } = useCartStore();
  const searchProducts = useProductStore(s => s.searchProducts);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = searchQuery ? searchProducts(searchQuery, 'kiosko') : [];

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
              <TouchableOpacity style={styles.productItem} onPress={() => { addItem(item); setSearchQuery(''); }}>
                <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{item.name}</Text>
                  <Text style={{ color: Colors.exito, fontSize: 13 }}>${item.salePrice.toLocaleString()}</Text>
                </View>
                <Text style={{ color: colors.textSecondary }}>Stock: {item.stock}</Text>
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
              <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: '#E0E0E0' }]} onPress={() => updateQuantity(item.id, item.quantity - 1)}>
                <Text>-</Text>
              </TouchableOpacity>
              <Text style={{ color: colors.textPrimary, marginHorizontal: 12, fontWeight: 'bold' }}>{item.quantity}</Text>
              <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: '#E0E0E0' }]} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
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
          <View style={styles.totalRow}>
            <Text style={{ color: colors.textSecondary }}>Subtotal</Text>
            <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>${getSubtotal().toLocaleString()}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: 'bold' }}>Total</Text>
            <Text style={{ color: Colors.exito, fontSize: 22, fontWeight: 'bold' }}>${getTotal().toLocaleString()}</Text>
          </View>
          <TouchableOpacity
            style={[styles.sellBtn, { backgroundColor: Colors.exito }]}
            onPress={() => {
              Alert.alert('Confirmar venta', `Total: $${getTotal().toLocaleString()}`, [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Vender', onPress: () => { useCartStore.getState().confirmStoreOrder('kiosko'); Alert.alert('✅', 'Venta registrada'); } },
              ]);
            }}
          >
            <Text style={styles.sellBtnText}>Cobrar ${getTotal().toLocaleString()}</Text>
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
  cartList: { padding: Spacing.md, paddingBottom: 200 },
  cartItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: 8, borderWidth: 1 },
  quantityRow: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 14, marginTop: 8 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, borderTopWidth: 2, borderTopColor: '#E0E0E0' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sellBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  sellBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
