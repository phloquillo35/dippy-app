import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useProviderStore } from '@/store/providerStore';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Provider } from '@/types';

const RATING_EMOJIS = ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'];

export default function ProvidersScreen() {
  const colors = useColors();
  const providers = useProviderStore(s => s.getProviders());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredProviders = providers.filter((provider) => {
    const matchesSearch =
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      provider.categories.includes(selectedCategory as any);

    return matchesSearch && matchesCategory;
  });

  const categories = [
    { key: 'all', label: 'Todos' },
    { key: 'limpieza', label: 'Limpieza' },
    { key: 'cocina', label: 'Cocina' },
    { key: 'fiambres', label: 'Fiambres' },
    { key: 'gaseosas', label: 'Gaseosas' },
    { key: 'panaderia', label: 'Panadería' },
    { key: 'comida_preparada', label: 'Comida' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          <Text style={styles.searchEmoji}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Buscar proveedores..."
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
          onPress={() => router.push('/providers/add')}
        >
          <Text style={styles.addButtonText}>➕</Text>
        </TouchableOpacity>
      </View>

      {/* Categories Filter */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              {
                backgroundColor: selectedCategory === item.key
                  ? colors.primary
                  : colors.surfaceVariant,
              },
            ]}
            onPress={() => setSelectedCategory(item.key)}
          >
            <Text
              style={[
                styles.categoryLabel,
                {
                  color: selectedCategory === item.key
                    ? '#FFFFFF'
                    : colors.textPrimary,
                },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesList}
      />

      {/* Providers Count */}
      <View style={styles.countContainer}>
        <Text style={[styles.countText, { color: colors.textSecondary }]}>
          🏢 {filteredProviders.length} proveedores
        </Text>
      </View>

      {/* Providers List */}
      <FlatList
        data={filteredProviders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card
            variant="elevated"
            padding="md"
            style={styles.providerCard}
            onPress={() => router.push(`/providers/${item.id}`)}
          >
            <View style={styles.providerHeader}>
              <View style={styles.providerInfo}>
                <View style={styles.providerNameRow}>
                  <Text style={[styles.providerName, { color: colors.textPrimary }]}>
                    {item.name}
                  </Text>
                  {item.isPreferred && (
                    <View style={[styles.preferredBadge, { backgroundColor: `${Colors.amarilloAcento}20` }]}>
                      <Text style={styles.preferredEmoji}>⭐</Text>
                    </View>
                  )}
                </View>
                {item.contactPerson && (
                  <Text style={[styles.providerContact, { color: colors.textSecondary }]}>
                    🧑 {item.contactPerson}
                  </Text>
                )}
              </View>
              <Text style={styles.providerRating}>
                {RATING_EMOJIS[item.rating - 1] || '⭐'}
              </Text>
            </View>

            <View style={styles.providerDetails}>
              {item.phone && (
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  📞 {item.phone}
                </Text>
              )}
              {item.email && (
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  📧 {item.email}
                </Text>
              )}
              {item.paymentTerms && (
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  💳 {item.paymentTerms}
                </Text>
              )}
            </View>

            <View style={styles.categoriesContainer}>
              {item.categories.map((cat) => (
                <View
                  key={cat}
                  style={[styles.categoryTag, { backgroundColor: `${colors.primary}20` }]}
                >
                  <Text style={[styles.categoryTagText, { color: colors.primary }]}>
                    {cat}
                  </Text>
                </View>
              ))}
            </View>

            {item.notes && (
              <Text style={[styles.providerNotes, { color: colors.textSecondary }]} numberOfLines={2}>
                📝 {item.notes}
              </Text>
            )}
          </Card>
        )}
        contentContainerStyle={styles.providersList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🏢</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No se encontraron proveedores
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {searchQuery ? 'Probá con otra búsqueda' : 'Agregá tu primer proveedor'}
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
  categoriesList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
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
  providersList: {
    padding: Spacing.md,
  },
  providerCard: {
    marginBottom: Spacing.sm,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  providerInfo: {
    flex: 1,
  },
  providerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  preferredBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  preferredEmoji: {
    fontSize: 12,
  },
  providerContact: {
    fontSize: 14,
    marginTop: 4,
  },
  providerRating: {
    fontSize: 16,
  },
  providerDetails: {
    marginBottom: Spacing.sm,
  },
  detailText: {
    fontSize: 13,
    marginBottom: 2,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  providerNotes: {
    fontSize: 12,
    fontStyle: 'italic',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: Spacing.sm,
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