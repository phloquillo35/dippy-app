import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useProviderStore } from '@/store/providerStore';
import { useUserStore } from '@/store/userStore';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Provider, PaymentMethod } from '@/types';
import { formatCurrency } from '@/utils/uuid';

const RATING_EMOJIS = ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'];

const PAYMENT_METHODS: Array<{ key: PaymentMethod; label: string; emoji: string }> = [
  { key: 'efectivo', label: 'Efectivo', emoji: '💵' },
  { key: 'transferencia', label: 'Transferencia', emoji: '🏦' },
  { key: 'tarjeta', label: 'Tarjeta', emoji: '💳' },
  { key: 'mercadopago', label: 'MercadoPago', emoji: '📱' },
];

export default function ProvidersScreen() {
  const colors = useColors();
  const providers = useProviderStore(s => s.getProviders());
  const addPayment = useProviderStore(s => s.addPayment);
  const currentUser = useUserStore(s => s.currentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Payment modal state
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [paymentReason, setPaymentReason] = useState('');

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

  const handleOpenPayment = (provider: Provider) => {
    setSelectedProvider(provider);
    setPaymentAmount('');
    setPaymentMethod('efectivo');
    setPaymentReason('');
    setPaymentModalVisible(true);
  };

  const handleConfirmPayment = () => {
    if (!selectedProvider) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Ingresá un monto válido');
      return;
    }

    addPayment(selectedProvider.id, amount, paymentMethod, currentUser?.id || 'unknown', paymentReason || undefined);

    Alert.alert(
      '✅ Pago Registrado',
      `Se registró un pago de ${formatCurrency(amount)} a ${selectedProvider.name}`
    );

    setPaymentModalVisible(false);
    setSelectedProvider(null);
  };

  const getTotalPaid = (provider: Provider): number => {
    if (!provider.payments) return 0;
    return provider.payments.reduce((sum, p) => sum + p.amount, 0);
  };

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
        renderItem={({ item }) => {
          const totalPaid = getTotalPaid(item);
          return (
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

              {/* Payment Summary */}
              <View style={[styles.paymentSummary, { backgroundColor: totalPaid > 0 ? `${Colors.exito}10` : `${Colors.grisClaro}30` }]}>
                <View style={styles.paymentSummaryLeft}>
                  <Text style={[styles.paymentSummaryLabel, { color: colors.textSecondary }]}>
                    💸 Total pagado:
                  </Text>
                  <Text style={[styles.paymentSummaryValue, { color: totalPaid > 0 ? Colors.exito : colors.textSecondary }]}>
                    {formatCurrency(totalPaid)}
                  </Text>
                  {item.payments && item.payments.length > 0 && (
                    <Text style={[styles.paymentSummaryCount, { color: colors.textSecondary }]}>
                      {item.payments.length} pago{item.payments.length !== 1 ? 's' : ''}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.payButton, { backgroundColor: Colors.celesteBandera }]}
                  onPress={() => handleOpenPayment(item)}
                >
                  <Text style={styles.payButtonText}>Registrar Pago</Text>
                </TouchableOpacity>
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
          );
        }}
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

      {/* Payment Modal */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              💸 Registrar Pago
            </Text>
            {selectedProvider && (
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Proveedor: {selectedProvider.name}
              </Text>
            )}

            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Monto ($)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="0.00"
                placeholderTextColor={colors.placeholder}
                keyboardType="numeric"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
              />
            </View>

            {/* Payment Method */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Método de Pago</Text>
              <View style={styles.paymentMethodsGrid}>
                {PAYMENT_METHODS.map((method) => (
                  <TouchableOpacity
                    key={method.key}
                    style={[
                      styles.paymentMethodChip,
                      {
                        backgroundColor: paymentMethod === method.key ? colors.primary : colors.surfaceVariant,
                        borderColor: paymentMethod === method.key ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setPaymentMethod(method.key)}
                  >
                    <Text style={styles.paymentMethodEmoji}>{method.emoji}</Text>
                    <Text
                      style={[
                        styles.paymentMethodLabel,
                        { color: paymentMethod === method.key ? '#FFFFFF' : colors.textPrimary },
                      ]}
                    >
                      {method.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Reason */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Concepto (opcional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceVariant, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder="Ej: Pago factura mayo"
                placeholderTextColor={colors.placeholder}
                value={paymentReason}
                onChangeText={setPaymentReason}
              />
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { borderColor: colors.border }]}
                onPress={() => setPaymentModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textPrimary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, { backgroundColor: Colors.exito }]}
                onPress={handleConfirmPayment}
              >
                <Text style={styles.modalConfirmText}>✅ Confirmar Pago</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  paymentSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  paymentSummaryLeft: {
    flex: 1,
  },
  paymentSummaryLabel: {
    fontSize: 12,
  },
  paymentSummaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  paymentSummaryCount: {
    fontSize: 11,
    marginTop: 2,
  },
  payButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  paymentMethodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  paymentMethodEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  paymentMethodLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
