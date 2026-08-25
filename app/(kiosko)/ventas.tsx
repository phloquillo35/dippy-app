import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useOrderStore } from '@/store/orderStore';
import { formatCurrency, formatDateTime } from '@/utils/uuid';

const BUSINESS_ID = 'kiosko' as const;

type Period = 'today' | '7d' | 'month';

const PERIODS: Array<{ key: Period; label: string }> = [
  { key: 'today', label: 'Hoy' },
  { key: '7d', label: '7 días' },
  { key: 'month', label: 'Mes' },
];

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export default function KioskoVentasScreen() {
  const colors = useColors();
  const getSoldOrders = useOrderStore(s => s.getSoldOrders);
  const [period, setPeriod] = useState<Period>('today');

  const now = new Date();
  const fromDate =
    period === 'today'
      ? startOfDay(now)
      : period === '7d'
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getFullYear(), now.getMonth(), 1);

  const all = getSoldOrders(BUSINESS_ID).filter(o => new Date(o.soldAt || o.createdAt) >= fromDate);
  const sorted = [...all].sort((a, b) => (b.soldAt || b.createdAt).localeCompare(a.soldAt || a.createdAt));

  const totalRevenue = sorted.reduce((s, o) => s + o.total, 0);
  const totalItems = sorted.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.quantity, 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.key}
            style={[styles.periodPill, period === p.key && { backgroundColor: Colors.celesteInstitucional }]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[styles.periodText, period === p.key && { color: colors.textOnPrimary }]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.exito }]}>{formatCurrency(totalRevenue)}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Ingresos</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{sorted.length}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Ventas</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{totalItems}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Items</Text>
        </View>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.rowHeader}>
              <Text style={[styles.orderNumber, { color: colors.textPrimary }]}>#{item.id.slice(-6).toUpperCase()}</Text>
              <Text style={[styles.rowTotal, { color: Colors.exito }]}>{formatCurrency(item.total)}</Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              {formatDateTime(item.soldAt || item.createdAt)} · {item.paymentMethod}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
              {item.items.slice(0, 3).map(i => `${i.quantity}x ${i.productName}`).join(', ')}
              {item.items.length > 3 ? ` +${item.items.length - 3} más` : ''}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay ventas en este período</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  periodRow: { flexDirection: 'row', gap: 8, padding: Spacing.md },
  periodPill: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.grisClaro, alignItems: 'center' },
  periodText: { fontSize: 14, fontWeight: '600', color: Colors.grisOscuro },
  summary: { flexDirection: 'row', margin: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: 'bold' },
  summaryLabel: { fontSize: 12, marginTop: 4 },
  list: { padding: Spacing.md, paddingTop: 0 },
  row: { padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: 12, borderWidth: 1 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  orderNumber: { fontSize: 18, fontWeight: 'bold' },
  rowTotal: { fontSize: 18, fontWeight: 'bold' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 14 },
});
