import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';

import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useProductStore } from '@/store/productStore';
import { useDeliveryCartStore } from '@/store/deliveryCartStore';

export default function DeliveryMenuScreen() {
  const colors = useColors();
  const products = useProductStore(s => s.getProducts('delivery'));
  const searchProducts = useProductStore(s => s.searchProducts);
  const addItem = useDeliveryCartStore(s => s.addItem);
  const items = useDeliveryCartStore(s => s.items);
  const getTotal = useDeliveryCartStore(s => s.getTotal);
  const getItemCount = useDeliveryCartStore(s => s.getItemCount);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = searchQuery ? searchProducts(searchQuery, 'delivery') : products;

  const handleAdd = (item: any) => {
    const result = addItem(item);
    if (result === 'no_stock') {
      Alert.alert('Sin stock', `${item.name} no está disponible`);
      return;
    }
    if (result === 'capped') {
      Alert.alert('Stock limitado', `Solo podés agregar hasta ${item.stock} unidades de ${item.name}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={{ fontSize: 18, marginRight: 6 }}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Buscar plato..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: Colors.azulInstitucional }]}
          onPress={() => router.push('/(delivery)/add-product')}
        >
          <Text style={{ color: colors.textOnPrimary, fontSize: 18, fontWeight: 'bold' }}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: '/(delivery)/product-detail' as any, params: { id: item.id } })}
          >
            <Text style={styles.itemEmoji}>{item.emoji}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }} numberOfLines={1}>{item.description}</Text>
              <Text style={{ color: item.stock <= 0 ? Colors.error : colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                {item.stock > 0 ? `Stock: ${item.stock}` : 'Agotado'}
              </Text>
            </View>
            <Text style={[styles.itemPrice, { color: item.stock > 0 ? Colors.exito : colors.placeholder }]}>${item.salePrice.toLocaleString()}</Text>
            <TouchableOpacity
              style={[styles.addCircle, { backgroundColor: Colors.exito }]}
              onPress={(e) => { e.stopPropagation(); handleAdd(item); }}
            >
              <Text style={{ color: colors.textOnPrimary, fontSize: 20, fontWeight: 'bold' }}>+</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      {items.length > 0 && (
        <TouchableOpacity
          style={[styles.footer, { backgroundColor: Colors.azulInstitucional }]}
          onPress={() => router.push('/(delivery)/cart')}
        >
          <Text style={styles.footerText}>
            🛒 Ver pedido ({getItemCount()}) — ${getTotal().toLocaleString()} →
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', margin: Spacing.md, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 16 },
  addBtn: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.md },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: 10, borderWidth: 1 },
  itemEmoji: { fontSize: 36 },
  itemName: { fontSize: 16, fontWeight: '600' },
  itemPrice: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 8 },
  addCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, borderTopWidth: 2, borderTopColor: Colors.grisClaro, alignItems: 'center' },
  footerText: { color: Colors.blanco, fontWeight: 'bold', fontSize: 16 },
});
