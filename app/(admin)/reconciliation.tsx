import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useCashStore } from '@/store/cashStore';
import { formatCurrency } from '@/utils/uuid';

const PAYMENT_METHODS = [
  { key: 'cash', label: 'Efectivo', emoji: '💵', storeKey: 'cashIn' as const },
  { key: 'card', label: 'Tarjeta', emoji: '💳', storeKey: 'cardIn' as const },
  { key: 'transfer', label: 'Transferencia', emoji: '🏦', storeKey: 'transfersIn' as const },
  { key: 'mp', label: 'MercadoPago', emoji: '📱', storeKey: 'mercadopagoIn' as const },
];

export default function AdminReconciliationScreen() {
  const colors = useColors();
  const [selectedBusiness, setSelectedBusiness] = useState<'kiosko' | 'delivery'>('kiosko');
  const today = new Date().toISOString().split('T')[0];
  const register = useCashStore(s => s.getBusinessReport(selectedBusiness, today));

  const totalIncome = register
    ? register.cashIn + register.transfersIn + register.cardIn + register.mercadopagoIn
    : 0;

  const salesByMethod = register
    ? register.movements.filter(m => m.type === 'sale')
    : [];

  const methodTotals = PAYMENT_METHODS.map(pm => ({
    ...pm,
    recorded: register ? (register as any)[pm.storeKey] : 0,
    count: salesByMethod.filter(m => {
      if (pm.key === 'cash') return m.paymentMethod === 'efectivo';
      if (pm.key === 'card') return m.paymentMethod === 'tarjeta';
      if (pm.key === 'transfer') return m.paymentMethod === 'transferencia';
      if (pm.key === 'mp') return m.paymentMethod === 'mercadopago' || m.paymentMethod === 'qr';
      return false;
    }).length,
  }));

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.businessRow}>
        {(['kiosko', 'delivery'] as const).map(b => (
          <TouchableOpacity
            key={b}
            style={[styles.businessBtn, { backgroundColor: selectedBusiness === b ? Colors.celesteInstitucional : colors.card, borderColor: colors.border }]}
            onPress={() => setSelectedBusiness(b)}
          >
            <Text style={{ color: selectedBusiness === b ? '#FFF' : colors.textPrimary, fontWeight: '600' }}>
              {b === 'kiosko' ? '🏪 Kiosko' : '🍕 Delivery'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.totalCard, { backgroundColor: '#1A1A2E' }]}>
        <Text style={styles.totalLabel}>Total registrado hoy</Text>
        <Text style={styles.totalValue}>{formatCurrency(totalIncome)}</Text>
        <Text style={styles.totalSub}>{salesByMethod.length} ventas · {register?.movements.length || 0} movimientos</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>💳 Por método de pago</Text>
        {methodTotals.map(m => (
          <View key={m.key} style={[styles.methodCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.methodHeader}>
              <Text style={styles.methodEmoji}>{m.emoji}</Text>
              <Text style={[styles.methodName, { color: colors.textPrimary }]}>{m.label}</Text>
              <Text style={[styles.methodAmount, { color: Colors.exito }]}>{formatCurrency(m.recorded)}</Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 36 }}>{m.count} ventas</Text>
          </View>
        ))}
      </View>

      {register?.movements && register.movements.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📋 Últimos movimientos</Text>
          {register.movements.slice(-10).reverse().map((m, i) => (
            <View key={i} style={[styles.movementRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 13 }}>{m.description}</Text>
                <Text style={{ color: '#999', fontSize: 11 }}>{m.userName} · {new Date(m.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              <Text style={{ color: m.type === 'sale' || m.type === 'deposit' ? Colors.exito : Colors.error, fontWeight: 'bold', fontSize: 14 }}>
                {m.type === 'sale' || m.type === 'deposit' ? '+' : '-'}{formatCurrency(m.amount)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  businessRow: { flexDirection: 'row', padding: Spacing.md, gap: 8 },
  businessBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  totalCard: { margin: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.xl, alignItems: 'center' },
  totalLabel: { color: '#AAA', fontSize: 14 },
  totalValue: { color: Colors.exito, fontSize: 32, fontWeight: 'bold', marginVertical: 4 },
  totalSub: { color: '#888', fontSize: 12 },
  section: { padding: Spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  methodCard: { padding: Spacing.sm, borderRadius: BorderRadius.lg, marginBottom: 8, borderWidth: 1 },
  methodHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  methodEmoji: { fontSize: 20 },
  methodName: { flex: 1, fontSize: 14, fontWeight: '600' },
  methodAmount: { fontSize: 16, fontWeight: 'bold' },
  movementRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, alignItems: 'center' },
});
