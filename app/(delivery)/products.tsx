import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useProductStore } from '@/store/productStore';
import { ProductCard } from '@/components/Card';
import { Product, ProductCategory } from '@/types';

const CATEGORIES: Array<{ key: ProductCategory | 'all'; label: string; emoji: string }> = [
  { key: 'all', label: 'Todos', emoji: '🍽️' },
  { key: 'comida_preparada', label: 'Comida', emoji: '🍝' },
  { key: 'gaseosas', label: 'Bebidas', emoji: '🥤' },
];

export default function DeliveryProductsScreen() {
  const colors = useColors();
  const allProducts = useProductStore(s => s.getProducts('delivery'));
  const searchProducts = useProductStore(s => s.searchProducts);
  const getProductsByCategory = useProductStore(s => s.getProductsByCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');

  const filteredProducts = searchQuery
    ? searchProducts(searchQuery, 'delivery')
    : selectedCategory === 'all'
    ? allProducts
    : getProductsByCategory(selectedCategory, 'delivery');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.searchEmoji}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Buscar plato..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.categoryPill, selectedCategory === cat.key && { backgroundColor: Colors.azulInstitucional }]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
            <Text style={[styles.categoryLabel, selectedCategory === cat.key && styles.categoryLabelActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ProductCard
            name={item.name}
            emoji={item.emoji}
            price={item.salePrice}
            stock={item.stock}
            category={item.category}
            isLowStock={item.stock <= item.minStock}
            onPress={() => router.push({ pathname: '/(delivery)/product-detail', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay platos</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', margin: Spacing.md, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1 },
  searchEmoji: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 16 },
  categoriesContainer: { maxHeight: 50, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  categoryPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8,
  },
  categoryEmoji: { fontSize: 14, marginRight: 4 },
  categoryLabel: { fontSize: 13, color: '#333' },
  categoryLabelActive: { color: '#FFF', fontWeight: '600' },
  list: { padding: Spacing.md },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, marginTop: 12 },
});
