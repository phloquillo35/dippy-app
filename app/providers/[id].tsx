import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useProviderStore } from '@/store/providerStore';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

const RATING_LABELS = ['⭐ Regular', '⭐⭐ Bueno', '⭐⭐⭐ Muy Bueno', '⭐⭐⭐⭐ Excelente', '⭐⭐⭐⭐⭐ Premium'];

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const getProviderById = useProviderStore(s => s.getProviderById);
  const getProviderProducts = useProviderStore(s => s.getProviderProducts);

  const provider = getProviderById(id!);
  const providerProducts = getProviderProducts(id!);

  if (!provider) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.notFoundEmoji}>🏢</Text>
        <Text style={[styles.notFoundText, { color: colors.textPrimary }]}>Proveedor no encontrado</Text>
        <Button title="Volver" onPress={() => router.back()} />
      </View>
    );
  }

  const handleCall = () => {
    if (provider.phone) {
      Linking.openURL(`tel:${provider.phone}`);
    }
  };

  const handleEmail = () => {
    if (provider.email) {
      Linking.openURL(`mailto:${provider.email}`);
    }
  };

  const handleWhatsApp = () => {
    if (provider.phone) {
      const phone = provider.phone.replace(/[^0-9]/g, '');
      Linking.openURL(`https://wa.me/549${phone}`);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Card variant="elevated" padding="lg" style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={[styles.providerAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarEmoji}>🏢</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.providerName, { color: colors.textPrimary }]}>
              {provider.name}
            </Text>
            {provider.contactPerson && (
              <Text style={[styles.contactPerson, { color: colors.textSecondary }]}>
                🧑 {provider.contactPerson}
              </Text>
            )}
            <Text style={[styles.rating, { color: colors.textPrimary }]}>
              {RATING_LABELS[provider.rating - 1] || '⭐'}
            </Text>
            {provider.isPreferred && (
              <View style={[styles.preferredBadge, { backgroundColor: `${Colors.amarilloAcento}20` }]}>
                <Text style={styles.preferredText}>⭐ Proveedor Preferido</Text>
              </View>
            )}
          </View>
        </View>
      </Card>

      {/* Contact Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: Colors.exito }]}
          onPress={handleWhatsApp}
        >
          <Text style={styles.actionEmoji}>📱</Text>
          <Text style={styles.actionText}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleCall}
        >
          <Text style={styles.actionEmoji}>📞</Text>
          <Text style={styles.actionText}>Llamar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: Colors.amarilloAcento }]}
          onPress={handleEmail}
        >
          <Text style={styles.actionEmoji}>📧</Text>
          <Text style={styles.actionText}>Email</Text>
        </TouchableOpacity>
      </View>

      {/* Details */}
      <Card variant="default" padding="lg" style={styles.detailsCard}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📋 Información</Text>

        {provider.phone && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>📞 Teléfono</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{provider.phone}</Text>
          </View>
        )}

        {provider.email && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>📧 Email</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{provider.email}</Text>
          </View>
        )}

        {provider.address && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>📍 Dirección</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{provider.address}</Text>
          </View>
        )}

        {provider.cuit && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>🔢 CUIT</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{provider.cuit}</Text>
          </View>
        )}

        {provider.paymentTerms && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>💳 Condiciones de Pago</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{provider.paymentTerms}</Text>
          </View>
        )}
      </Card>

      {/* Categories */}
      <Card variant="default" padding="lg" style={styles.categoriesCard}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🏷️ Categorías</Text>
        <View style={styles.categoriesGrid}>
          {provider.categories.map((cat) => (
            <View
              key={cat}
              style={[styles.categoryChip, { backgroundColor: `${colors.primary}20` }]}
            >
              <Text style={[styles.categoryText, { color: colors.primary }]}>{cat}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Notes */}
      {provider.notes && (
        <Card variant="default" padding="lg" style={styles.notesCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📝 Notas</Text>
          <Text style={[styles.notesText, { color: colors.textSecondary }]}>{provider.notes}</Text>
        </Card>
      )}

      {/* Provider Products */}
      {providerProducts.length > 0 && (
        <Card variant="default" padding="lg" style={styles.productsCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            📦 Productos ({providerProducts.length})
          </Text>
          {providerProducts.map((product) => (
            <View key={product.id} style={[styles.productItem, { borderBottomColor: colors.border }]}>
              <View style={styles.productItemInfo}>
                <Text style={[styles.productItemName, { color: colors.textPrimary }]}>
                  {product.productName}
                </Text>
                <Text style={[styles.productItemSku, { color: colors.textSecondary }]}>
                  SKU: {product.providerSku || 'N/A'}
                </Text>
              </View>
              <View style={styles.productItemPrices}>
                <Text style={[styles.productItemCost, { color: colors.primary }]}>
                  ${product.costPrice.toLocaleString('es-AR')}
                </Text>
                <Text style={[styles.productItemUnit, { color: colors.textSecondary }]}>
                  / {product.unit}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notFoundEmoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacing.lg,
  },
  headerCard: {
    margin: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerAvatar: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  providerName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  contactPerson: {
    fontSize: 14,
    marginTop: 4,
  },
  rating: {
    fontSize: 14,
    marginTop: 4,
  },
  preferredBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginTop: 8,
  },
  preferredText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gold,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  actionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionText: {
    color: Colors.blanco,
    fontSize: 12,
    fontWeight: '600',
  },
  detailsCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grisClaro,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  categoriesCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  notesCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  productsCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  productItemInfo: {
    flex: 1,
  },
  productItemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  productItemSku: {
    fontSize: 12,
    marginTop: 2,
  },
  productItemPrices: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  productItemCost: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productItemUnit: {
    fontSize: 12,
    marginLeft: 4,
  },
});