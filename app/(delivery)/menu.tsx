import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useProductStore } from '@/store/productStore';
import { useDeliveryCartStore } from '@/store/deliveryCartStore';
import { Product } from '@/types';

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Buscar plato..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => addItem(item)}>
            <Text style={styles.itemEmoji}>{item.emoji}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{item.description}</Text>
            </View>
            <Text style={[styles.itemPrice, { color: Colors.exito }]}>${item.salePrice.toLocaleString()}</Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <View style={{ height: 100 }} />
        }
      />

      {items.length > 0 && (
        <View style={[styles.footer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>
            🛒 {getItemCount()} items — ${getTotal().toLocaleString()}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', margin: Spacing.md, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 16 },
  list: { padding: Spacing.md },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: 10, borderWidth: 1 },
  itemEmoji: { fontSize: 36 },
  itemName: { fontSize: 16, fontWeight: '600' },
  itemPrice: { fontSize: 16, fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, borderTopWidth: 2, borderTopColor: '#E0E0E0', alignItems: 'center' },
});
