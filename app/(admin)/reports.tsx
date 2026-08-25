import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useCashStore } from '@/store/cashStore';
import { useOrderStore } from '@/store/orderStore';
import { useProductStore } from '@/store/productStore';
import { useReturnStore } from '@/store/storesIndex';
import { formatCurrency } from '@/utils/uuid';

export default function AdminReportsScreen() {
  const colors = useColors();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const today = new Date().toISOString().split('T')[0];

  const getDateRange = () => {
    const now = new Date();
    if (period === 'today') {
      return { from: today, label: 'Hoy' };
    } else if (period === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { from: weekAgo.toISOString().split('T')[0], label: 'Últimos 7 días' };
    } else {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return { from: monthAgo.toISOString().split('T')[0], label: 'Último mes' };
    }
  };

  const { from, label } = getDateRange();

  const kioskoReport = useCashStore.getState().getBusinessReport('kiosko', from);
  const deliveryReport = useCashStore.getState().getBusinessReport('delivery', from);
  const kioskoOrders = useOrderStore.getState().getAllOrders('kiosko').filter(o => o.createdAt >= from);
  const deliveryOrders = useOrderStore.getState().getAllOrders('delivery').filter(o => o.createdAt >= from);
  const kioskoReturns = useReturnStore.getState().getReturns('kiosko').filter(r => r.createdAt >= from);
  const deliveryReturns = useReturnStore.getState().getReturns('delivery').filter(r => r.createdAt >= from);

  const kioskoIncome = kioskoReport ? kioskoReport.cashIn + kioskoReport.transfersIn + kioskoReport.cardIn + kioskoReport.mercadopagoIn : 0;
  const deliveryIncome = deliveryReport ? deliveryReport.cashIn + deliveryReport.transfersIn + deliveryReport.cardIn + deliveryReport.mercadopagoIn : 0;
  const kioskoExpenses = kioskoReport ? kioskoReport.cashOut : 0;
  const deliveryExpenses = deliveryReport ? deliveryReport.cashOut : 0;
  const kioskoRefunds = kioskoReturns.reduce((s, r) => s + r.totalRefund, 0);
  const deliveryRefunds = deliveryReturns.reduce((s, r) => s + r.totalRefund, 0);

  const totalIncome = kioskoIncome + deliveryIncome;
  const totalExpenses = kioskoExpenses + deliveryExpenses;
  const totalRefunds = kioskoRefunds + deliveryRefunds;
  const netProfit = totalIncome - totalExpenses - totalRefunds;

  const avgTicketKiosko = kioskoOrders.length > 0 ? kioskoOrders.reduce((s, o) => s + o.total, 0) / kioskoOrders.length : 0;
  const avgTicketDelivery = deliveryOrders.length > 0 ? deliveryOrders.reduce((s, o) => s + o.total, 0) / deliveryOrders.length : 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.periodRow}>
        {(['today', 'week', 'month'] as const).map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, { backgroundColor: period === p ? Colors.celesteInstitucional : colors.card, borderColor: colors.border }]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, { color: period === p ? '#FFF' : colors.textPrimary }]}>
              {p === 'today' ? 'Hoy' : p === 'week' ? '7 días' : 'Mes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.summaryCard, { backgroundColor: '#1A1A2E' }]}>
        <Text style={styles.summaryTitle}>📊 Resumen {label}</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Ingresos</Text>
          <Text style={[styles.summaryValue, { color: Colors.exito }]}>{formatCurrency(totalIncome)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Egresos</Text>
          <Text style={[styles.summaryValue, { color: Colors.error }]}>{formatCurrency(totalExpenses)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Devoluciones</Text>
          <Text style={[styles.summaryValue, { color: Colors.advertencia }]}>{formatCurrency(totalRefunds)}</Text>
        </View>
        <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#444', paddingTop: 8, marginTop: 4 }]}>
          <Text style={[styles.summaryLabel, { color: '#FFF', fontWeight: 'bold' }]}>Ganancia Neta</Text>
          <Text style={[styles.summaryValue, { color: netProfit >= 0 ? Colors.exito : Colors.error, fontSize: 22 }]}>
            {formatCurrency(netProfit)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🏪 Kiosko</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.statValue}>{formatCurrency(kioskoIncome)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ingresos</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.statValue}>{kioskoOrders.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ventas</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.statValue}>{formatCurrency(avgTicketKiosko)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ticket prom.</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🍕 Delivery</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.statValue}>{formatCurrency(deliveryIncome)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ingresos</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.statValue}>{deliveryOrders.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pedidos</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.statValue}>{formatCurrency(avgTicketDelivery)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ticket prom.</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  periodRow: { flexDirection: 'row', padding: Spacing.md, gap: 8 },
  periodBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  periodText: { fontWeight: '600', fontSize: 13 },
  summaryCard: { margin: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.xl },
  summaryTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { color: '#AAA', fontSize: 14 },
  summaryValue: { fontSize: 16, fontWeight: 'bold' },
  section: { padding: Spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.lg, alignItems: 'center', borderWidth: 1 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: Colors.exito },
  statLabel: { fontSize: 11, marginTop: 2 },
});
