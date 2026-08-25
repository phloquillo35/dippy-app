import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useCashStore } from '@/store/cashStore';
import { useOrderStore } from '@/store/orderStore';
import { useProductStore } from '@/store/productStore';
import { useUserStore } from '@/store/userStore';
import { useCustomerStore } from '@/store/customerStore';
import { useAuditStore } from '@/store/auditStore';
import { BusinessType, PaymentMethod } from '@/types';
import { formatCurrency } from '@/utils/uuid';

type Period = 'today' | 'week' | 'month';

const PAY_LABELS: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  mercadopago: 'MercadoPago',
  qr: 'QR',
};

const getRange = (period: Period) => {
  const now = new Date();
  if (period === 'today') return { from: now.toISOString().split('T')[0], label: 'Hoy' };
  if (period === 'week') {
    const w = new Date(now); w.setDate(w.getDate() - 7);
    return { from: w.toISOString().split('T')[0], label: 'Últimos 7 días' };
  }
  const m = new Date(now); m.setMonth(m.getMonth() - 1);
  return { from: m.toISOString().split('T')[0], label: 'Último mes' };
};

const computeBusiness = (business: BusinessType, from: string) => {
  const orders = useOrderStore.getState().getAllOrders(business).filter(o => o.createdAt >= from);
  const sold = orders.filter(o => o.status === 'sold');
  const income = sold.reduce((s, o) => s + o.total, 0);
  const avgTicket = sold.length ? income / sold.length : 0;
  const itemsSold = sold.reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0);

  const prodMap: Record<string, { qty: number; rev: number }> = {};
  const payMap: Record<string, number> = {};
  sold.forEach(o => {
    o.items.forEach(i => {
      prodMap[i.productName] = prodMap[i.productName] || { qty: 0, rev: 0 };
      prodMap[i.productName].qty += i.quantity;
      prodMap[i.productName].rev += i.totalPrice;
    });
    const m = (o.paymentMethod || 'efectivo') as PaymentMethod;
    payMap[m] = (payMap[m] || 0) + o.total;
  });
  const topProducts = Object.entries(prodMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.rev - a.rev)
    .slice(0, 5);

  const regs = useCashStore.getState().registers.filter(r => r.businessId === business && r.date >= from);
  const expenses = regs.reduce((s, r) => s + (r.cashOut || 0), 0);

  return { orders: orders.length, sold: sold.length, income, avgTicket, itemsSold, topProducts, payMap, expenses };
};

function BusinessPanel({ business, title, emoji, from }: { business: BusinessType; title: string; emoji: string; from: string }) {
  const colors = useColors();
  const m = computeBusiness(business, from);
  const lowStock = useProductStore(s => s.getLowStockProducts(business));
  const net = m.income - m.expenses;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{emoji} {title}</Text>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.statEmoji}>💰</Text>
          <Text style={[styles.statValue, { color: Colors.exito }]}>{formatCurrency(m.income)}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ingresos</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.statEmoji}>🧾</Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{m.sold}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ventas</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.statEmoji}>📦</Text>
          <Text style={[styles.statValue, { color: colors.textPrimary }]}>{m.itemsSold}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Items</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.statEmoji}>🎫</Text>
          <Text style={[styles.statValue, { color: Colors.celesteInstitucional }]}>{formatCurrency(m.avgTicket)}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ticket prom.</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.statEmoji}>📉</Text>
          <Text style={[styles.statValue, { color: Colors.error }]}>{formatCurrency(m.expenses)}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Gastos</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.statEmoji}>📈</Text>
          <Text style={[styles.statValue, { color: net >= 0 ? Colors.exito : Colors.error }]}>{formatCurrency(net)}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ganancia</Text>
        </View>
      </View>

      {m.topProducts.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>🏆 Top productos</Text>
          {m.topProducts.map((p, i) => (
            <View key={i} style={styles.row}>
              <Text style={{ color: colors.textPrimary, flex: 1 }} numberOfLines={1}>{p.name}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{p.qty}u</Text>
              <Text style={{ color: Colors.exito, fontWeight: '600', marginLeft: 12 }}>{formatCurrency(p.rev)}</Text>
            </View>
          ))}
        </View>
      )}

      {Object.keys(m.payMap).length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>💳 Por método de pago</Text>
          {Object.entries(m.payMap).map(([k, v], i) => (
            <View key={i} style={styles.row}>
              <Text style={{ color: colors.textPrimary, flex: 1 }}>{PAY_LABELS[k as PaymentMethod] || k}</Text>
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>{formatCurrency(v)}</Text>
            </View>
          ))}
        </View>
      )}

      {lowStock.length > 0 && (
        <View style={[styles.card, { backgroundColor: `${Colors.advertencia}15` }]}>
          <Text style={[styles.cardTitle, { color: Colors.advertencia }]}>⚠️ Stock bajo ({lowStock.length})</Text>
          {lowStock.slice(0, 5).map((p, i) => (
            <View key={i} style={styles.row}>
              <Text style={{ color: colors.textPrimary, flex: 1 }} numberOfLines={1}>{p.emoji} {p.name}</Text>
              <Text style={{ color: Colors.advertencia }}>{p.stock} uds</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function AdminDashboard() {
  const colors = useColors();
  const [period, setPeriod] = useState<Period>('today');
  const { from, label } = getRange(period);

  const users = useUserStore(s => s.getUsers());
  const topCustomers = useCustomerStore.getState().getTopCustomers(5);
  const currentUser = useUserStore(s => s.currentUser);

  const k = computeBusiness('kiosko', from);
  const d = computeBusiness('delivery', from);
  const totalIncome = k.income + d.income;
  const totalExpenses = k.expenses + d.expenses;
  const totalNet = totalIncome - totalExpenses;

  const quick = (route: string) => router.push(route as any);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerCard, { backgroundColor: Colors.negroSuave }]}>
        <Text style={styles.headerTitle}>👑 Panel de Marta</Text>
        <Text style={styles.headerSub}>{label} · {currentUser?.name}</Text>
        <View style={styles.consolidatedRow}>
          <View style={styles.consolidatedStat}>
            <Text style={styles.consolidatedLabel}>Ingresos</Text>
            <Text style={[styles.consolidatedValue, { color: Colors.exito }]}>{formatCurrency(totalIncome)}</Text>
          </View>
          <View style={styles.consolidatedStat}>
            <Text style={styles.consolidatedLabel}>Ganancia</Text>
            <Text style={[styles.consolidatedValue, { color: totalNet >= 0 ? Colors.celesteInstitucional : Colors.error }]}>{formatCurrency(totalNet)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.periodRow}>
        {(['today', 'week', 'month'] as const).map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, { backgroundColor: period === p ? Colors.azulInstitucional : colors.card, borderColor: colors.border }]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, { color: period === p ? colors.textOnPrimary : colors.textPrimary }]}>
              {p === 'today' ? 'Hoy' : p === 'week' ? '7 días' : 'Mes'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <BusinessPanel business="kiosko" title="Kiosko" emoji="🏪" from={from} />
      <BusinessPanel business="delivery" title="Delivery" emoji="🍕" from={from} />

      {topCustomers.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>👥 Top clientes</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {topCustomers.map((c: any, i) => (
              <View key={i} style={styles.row}>
                <Text style={{ color: colors.textPrimary, flex: 1 }} numberOfLines={1}>{c.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{c.totalOrders || 0} pedidos</Text>
                <Text style={{ color: Colors.exito, fontWeight: '600', marginLeft: 12 }}>{formatCurrency(c.totalSpent || 0)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>👷 Equipo</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {users.map((u: any, i) => (
            <View key={i} style={styles.row}>
              <Text style={{ fontSize: 18 }}>{u.avatar}</Text>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{u.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{u.businesses?.join(' · ') || 'Sin asignar'}</Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{u.role}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🔗 Accesos rápidos</Text>
        <View style={styles.statsRow}>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => quick('/(admin)/reports')}>
            <Text style={styles.statEmoji}>📈</Text>
            <Text style={[styles.statValue, { color: Colors.celesteInstitucional }]}>Reportes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => quick('/(admin)/margins')}>
            <Text style={styles.statEmoji}>💰</Text>
            <Text style={[styles.statValue, { color: Colors.exito }]}>Márgenes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => quick('/(admin)/customers')}>
            <Text style={styles.statEmoji}>👥</Text>
            <Text style={[styles.statValue, { color: Colors.advertencia }]}>Clientes</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => quick('/(admin)/team')}>
            <Text style={styles.statEmoji}>👷</Text>
            <Text style={[styles.statValue, { color: Colors.advertencia }]}>Equipo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => quick('/(admin)/reconciliation')}>
            <Text style={styles.statEmoji}>💳</Text>
            <Text style={[styles.statValue, { color: Colors.azulInstitucional }]}>Conciliación</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => quick('/(admin)/coupons')}>
            <Text style={styles.statEmoji}>🎫</Text>
            <Text style={[styles.statValue, { color: Colors.exito }]}>Cupones</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <TouchableOpacity style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => quick('/(admin)/returns')}>
            <Text style={styles.statEmoji}>↩︎</Text>
            <Text style={[styles.statValue, { color: Colors.error }]}>Devoluciones</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              import('@/services/backup').then(({ exportFullBackup }) =>
                exportFullBackup()
                  .then(() => {
                    useAuditStore.getState().log({
                      action: 'backup_exported',
                      userId: '',
                      userName: '',
                      description: 'Backup completo exportado',
                    });
                    Alert.alert('✅', 'Backup exportado y compartido');
                  })
                  .catch((e: Error) => Alert.alert('Error', e.message))
              );
            }}
          >
            <Text style={styles.statEmoji}>💾</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>Backup</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerCard: { margin: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.xl },
  headerTitle: { color: Colors.blanco, fontSize: 20, fontWeight: 'bold' },
  headerSub: { color: Colors.grisMedio, fontSize: 13, marginTop: 2, marginBottom: 12 },
  consolidatedRow: { flexDirection: 'row', gap: 12 },
  consolidatedStat: { flex: 1, alignItems: 'center' },
  consolidatedLabel: { color: Colors.grisMedio, fontSize: 12, marginBottom: 4 },
  consolidatedValue: { fontSize: 20, fontWeight: 'bold' },
  periodRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.md, marginBottom: 8 },
  periodBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  periodText: { fontWeight: '600' },
  section: { padding: Spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center', borderWidth: 1 },
  statEmoji: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: 15, fontWeight: 'bold' },
  statLabel: { fontSize: 11, marginTop: 2 },
  card: { marginTop: 12, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, gap: 8 },
});
