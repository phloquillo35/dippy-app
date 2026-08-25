import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useProductStore } from '@/store/productStore';
import { ProductCard } from '@/components/Card';
import { Product, ProductCategory } from '@/types';

const CATEGORIES: Array<{ key: ProductCategory | 'all'; label: string; emoji: string }> = [
  { key: 'all', label: 'Todos', emoji: '📦' },
  { key: 'limpieza', label: 'Limpieza', emoji: '🧴' },
  { key: 'cocina', label: 'Cocina', emoji: '🍳' },
  { key: 'comestibles', label: 'Comestibles', emoji: '🛒' },
  { key: 'caramelos', label: 'Caramelos', emoji: '🍬' },
  { key: 'fiambres', label: 'Fiambres', emoji: '🥩' },
  { key: 'gaseosas', label: 'Gaseosas', emoji: '🥤' },
  { key: 'panaderia', label: 'Panadería', emoji: '🥐' },
];

export default function KioskoProductsScreen() {
  const colors = useColors();
  const allProducts = useProductStore(s => s.getProducts('kiosko'));
  const searchProducts = useProductStore(s => s.searchProducts);
  const getProductsByCategory = useProductStore(s => s.getProductsByCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');

  const filteredProducts = searchQuery
    ? searchProducts(searchQuery, 'kiosko')
    : selectedCategory === 'all'
    ? allProducts
    : getProductsByCategory(selectedCategory, 'kiosko');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.searchEmoji}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Buscar producto..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.categoryPill, selectedCategory === cat.key && { backgroundColor: Colors.celesteInstitucional }]}
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
            onPress={() => router.push({ pathname: '/(kiosko)/product-detail', params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay productos</Text>
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
