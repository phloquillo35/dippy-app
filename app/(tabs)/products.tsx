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
  { key: 'comida_preparada', label: 'Comida', emoji: '🍝' },
];

export default function ProductsScreen() {
  const colors = useColors();
  const products = useProductStore(s => s.getProducts());
  const searchProducts = useProductStore(s => s.searchProducts);
  const getProductsByCategory = useProductStore(s => s.getProductsByCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');

  const getFilteredProducts = (): Product[] => {
    if (searchQuery.trim()) {
      return searchProducts(searchQuery);
    }
    if (selectedCategory !== 'all') {
      return getProductsByCategory(selectedCategory);
    }
    return products;
  };

  const filteredProducts = getFilteredProducts();

  const handleProductPress = (product: Product) => {
    router.push(`/products/${product.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          <Text style={styles.searchEmoji}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Buscar productos..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearEmoji}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/products/add')}
        >
          <Text style={styles.addButtonText}>➕</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.categoryChip,
              {
                backgroundColor: selectedCategory === cat.key
                  ? colors.primary
                  : colors.surfaceVariant,
              },
            ]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
            <Text
              style={[
                styles.categoryLabel,
                {
                  color: selectedCategory === cat.key
                    ? '#FFFFFF'
                    : colors.textPrimary,
                },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products Count */}
      <View style={styles.countContainer}>
        <Text style={[styles.countText, { color: colors.textSecondary }]}>
          📦 {filteredProducts.length} productos
        </Text>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard
            name={item.name}
            emoji={item.emoji}
            price={item.salePrice}
            stock={item.stock}
            category={item.category}
            isLowStock={item.stock <= item.minStock}
            onPress={() => handleProductPress(item)}
          />
        )}
        contentContainerStyle={styles.productsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No se encontraron productos
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {searchQuery ? 'Probá con otra búsqueda' : 'Agregá tu primer producto'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
  },
  searchEmoji: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  clearEmoji: {
    fontSize: 16,
    color: Colors.grisMedio,
    marginLeft: Spacing.sm,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
  },
  categoriesContainer: {
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  categoryEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  countContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  countText: {
    fontSize: 13,
  },
  productsList: {
    padding: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
  },
});