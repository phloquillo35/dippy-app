import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useProviderStore } from '@/store/providerStore';
import { useCashStore } from '@/store/cashStore';
import { useAuditStore } from '@/store/auditStore';
import { useUserStore } from '@/store/userStore';
import { Provider, PaymentMethod, ProductCategory } from '@/types';
import { formatCurrency } from '@/utils/uuid';

const RATING_EMOJIS = ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'];

const PAYMENT_METHODS: Array<{ key: PaymentMethod; label: string; emoji: string }> = [
  { key: 'efectivo', label: 'Efectivo', emoji: '💵' },
  { key: 'transferencia', label: 'Transferencia', emoji: '🏦' },
  { key: 'tarjeta', label: 'Tarjeta', emoji: '💳' },
  { key: 'mercadopago', label: 'MercadoPago', emoji: '📱' },
];

const CATEGORIES: Array<{ key: ProductCategory | 'all'; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'limpieza', label: 'Limpieza' },
  { key: 'cocina', label: 'Cocina' },
  { key: 'fiambres', label: 'Fiambres' },
  { key: 'gaseosas', label: 'Gaseosas' },
  { key: 'panaderia', label: 'Panadería' },
  { key: 'comida_preparada', label: 'Comida' },
];

interface Props {
  businessId: 'kiosko' | 'delivery';
  accentColor?: string;
}

export function ProvidersList({ businessId, accentColor = Colors.celesteInstitucional }: Props) {
  const colors = useColors();
  const providers = useProviderStore(s => s.getProviders());
  const addPayment = useProviderStore(s => s.addPayment);
  const currentUser = useUserStore(s => s.currentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [paymentReason, setPaymentReason] = useState('');

  const filteredProviders = providers.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categories.includes(selectedCategory as any);
    return matchesSearch && matchesCategory;
  });

  const handleConfirmPayment = () => {
    if (!selectedProvider) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return Alert.alert('Error', 'Monto inválido');
    addPayment(selectedProvider.id, amount, paymentMethod, currentUser?.id || 'unknown', paymentReason || undefined);

    // Registrar egreso en la caja abierta del negocio
    const register = useCashStore.getState().getOpenRegister(businessId);
    if (register) {
      useCashStore.getState().addMovement(register.id, {
        type: 'supplier_payment',
        amount,
        description: `Pago a proveedor: ${selectedProvider.name}`,
        paymentMethod,
        userId: currentUser?.id || '',
        userName: currentUser?.name || '',
      });
    }

    useAuditStore.getState().log({
      action: 'supplier_payment',
      userId: currentUser?.id || '',
      userName: currentUser?.name || 'unknown',
      businessId,
      description: `Pago de $${amount.toLocaleString()} a ${selectedProvider.name}`,
      metadata: { providerId: selectedProvider.id },
    });

    Alert.alert('✅', `Pago de $${amount.toLocaleString()} registrado a ${selectedProvider.name}${register ? '' : ' (sin caja abierta: no se descontó de caja)'}`);
    setPaymentModalVisible(false);
    setSelectedProvider(null);
  };

  const getTotalPaid = (provider: Provider) => provider.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.searchEmoji}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Buscar proveedores..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={item => item.key}
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryChip, { backgroundColor: selectedCategory === item.key ? accentColor : colors.card }]}
            onPress={() => setSelectedCategory(item.key)}
          >
            <Text style={[styles.categoryLabel, { color: selectedCategory === item.key ? colors.textOnPrimary : colors.textPrimary }]}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filteredProviders}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const totalPaid = getTotalPaid(item);
          return (
            <View style={[styles.providerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.providerHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.providerName, { color: colors.textPrimary }]}>{item.name}</Text>
                  {item.contactPerson && <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{item.contactPerson}</Text>}
                </View>
                <Text style={styles.ratingText}>{RATING_EMOJIS[item.rating - 1]}</Text>
              </View>

              <View style={styles.providerInfo}>
                {item.phone && <Text style={{ color: colors.textSecondary }}>📞 {item.phone}</Text>}
                <Text style={{ color: colors.textSecondary }}>📦 {item.categories.join(', ')}</Text>
                {totalPaid > 0 && (
                  <Text style={{ color: Colors.exito, fontSize: 12 }}>Pagos registrados: ${totalPaid.toLocaleString()}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.payBtn, { backgroundColor: accentColor }]}
                onPress={() => { setSelectedProvider(item); setPaymentModalVisible(true); }}
              >
                  <Text style={styles.payBtnText}>💰 Registrar pago</Text>
                </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏢</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay proveedores</Text>
          </View>
        }
      />

      <Modal visible={paymentModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Registrar pago a {selectedProvider?.name}</Text>
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Monto</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="$ 0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={paymentAmount}
              onChangeText={setPaymentAmount}
            />
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Motivo</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Motivo del pago..."
              placeholderTextColor={colors.textSecondary}
              value={paymentReason}
              onChangeText={setPaymentReason}
            />
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Método</Text>
            <View style={styles.paymentMethodsRow}>
              {PAYMENT_METHODS.map(p => (
                <TouchableOpacity key={p.key} style={[styles.methodPill, paymentMethod === p.key && { backgroundColor: accentColor }]} onPress={() => setPaymentMethod(p.key)}>
                  <Text style={styles.methodEmoji}>{p.emoji}</Text>
                  <Text style={[styles.methodLabel, paymentMethod === p.key && { color: colors.textOnPrimary }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.border }]} onPress={() => setPaymentModalVisible(false)}>
                <Text>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: accentColor }]} onPress={handleConfirmPayment}>
                <Text style={{ color: colors.textOnPrimary, fontWeight: 'bold' }}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function KioskoProvidersScreen() {
  return <ProvidersList businessId="kiosko" accentColor={Colors.celesteInstitucional} />;
}

export function DeliveryProvidersScreen() {
  return <ProvidersList businessId="delivery" accentColor={Colors.azulInstitucional} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 8 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1 },
  searchEmoji: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 16 },
  categoriesContainer: { maxHeight: 50, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginRight: 8 },
  categoryLabel: { fontSize: 13 },
  list: { padding: Spacing.md },
  providerCard: { padding: Spacing.lg, borderRadius: BorderRadius.lg, marginBottom: 12, borderWidth: 1 },
  providerHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  providerName: { fontSize: 18, fontWeight: 'bold' },
  ratingText: { fontSize: 14 },
  providerInfo: { gap: 4 },
  payBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, marginTop: 12, alignSelf: 'flex-start' },
  payBtnText: { color: Colors.blanco, fontWeight: 'bold' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { borderRadius: BorderRadius.xl, padding: Spacing.lg },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  modalLabel: { fontSize: 13, marginBottom: 4, marginTop: 8 },
  modalInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 4 },
  paymentMethodsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  methodPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.grisClaro, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  methodEmoji: { fontSize: 14, marginRight: 4 },
  methodLabel: { fontSize: 13 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  modalBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
});
