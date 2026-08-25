import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useCashStore } from '@/store/cashStore';
import { useOrderStore } from '@/store/orderStore';
import { useProductStore } from '@/store/productStore';
import { useUserStore } from '@/store/userStore';
import { formatCurrency } from '@/utils/uuid';

export default function AdminDashboard() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const kioskoReport = useCashStore.getState().getBusinessReport('kiosko', today);
  const deliveryReport = useCashStore.getState().getBusinessReport('delivery', today);
  const kioskoRegister = useCashStore.getState().getOpenRegister('kiosko');
  const deliveryRegister = useCashStore.getState().getOpenRegister('delivery');

  const kioskoOrders = useOrderStore.getState().getAllOrders('kiosko');
  const deliveryOrders = useOrderStore.getState().getAllOrders('delivery');

  const lowStockKiosko = useProductStore.getState().getLowStockProducts('kiosko');
  const lowStockDelivery = useProductStore.getState().getLowStockProducts('delivery');

  const kioskoSales = kioskoReport ? kioskoReport.cashIn + kioskoReport.transfersIn + kioskoReport.cardIn + kioskoReport.mercadopagoIn : 0;
  const deliverySales = deliveryReport ? deliveryReport.cashIn + deliveryReport.transfersIn + deliveryReport.cardIn + deliveryReport.mercadopagoIn : 0;
  const kioskoExpenses = kioskoReport ? kioskoReport.cashOut : 0;
  const deliveryExpenses = deliveryReport ? deliveryReport.cashOut : 0;

  const totalSales = kioskoSales + deliverySales;
  const totalExpenses = kioskoExpenses + deliveryExpenses;
  const totalProfit = totalSales - totalExpenses;

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles.consolidatedCard, { backgroundColor: '#1A1A2E' }]}>
        <Text style={styles.consolidatedTitle}>📊 Resumen del día</Text>
        <View style={styles.consolidatedRow}>
          <View style={styles.consolidatedStat}>
            <Text style={styles.consolidatedLabel}>Ventas totales</Text>
            <Text style={[styles.consolidatedValue, { color: Colors.exito }]}>
              {formatCurrency(totalSales)}
            </Text>
          </View>
          <View style={styles.consolidatedStat}>
            <Text style={styles.consolidatedLabel}>Gastos totales</Text>
            <Text style={[styles.consolidatedValue, { color: Colors.error }]}>
              {formatCurrency(totalExpenses)}
            </Text>
          </View>
        </View>
        <View style={styles.consolidatedRow}>
          <View style={styles.consolidatedStat}>
            <Text style={styles.consolidatedLabel}>Ganancia neta</Text>
            <Text style={[styles.consolidatedValue, { color: Colors.celesteInstitucional }]}>
              {formatCurrency(totalProfit)}
            </Text>
          </View>
          <View style={styles.consolidatedStat}>
            <Text style={styles.consolidatedLabel}>Pedidos totales</Text>
            <Text style={[styles.consolidatedValue, { color: '#FFF' }]}>
              {kioskoOrders.length + deliveryOrders.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Kiosko */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🏪 Kiosko</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.statEmoji}>💰</Text>
            <Text style={[styles.statValue, { color: Colors.exito }]}>
              {kioskoRegister ? formatCurrency(kioskoSales) : 'Caja cerrada'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ventas</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.statEmoji}>📦</Text>
            <Text style={[styles.statValue, { color: lowStockKiosko.length > 0 ? Colors.advertencia : Colors.exito }]}>
              {lowStockKiosko.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Stock bajo</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.statEmoji}>📋</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{kioskoOrders.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ventas hoy</Text>
          </View>
        </View>
        {kioskoReport?.movements && kioskoReport.movements.length > 0 && (
          <View style={[styles.movementsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.movementsTitle, { color: colors.textPrimary }]}>Últimos movimientos</Text>
            {kioskoReport.movements.slice(0, 5).map((m: any, i: number) => (
              <View key={i} style={styles.movementRow}>
                <Text style={{ color: colors.textSecondary, flex: 1 }}>{m.description}</Text>
                <Text style={{ color: m.type === 'sale' || m.type === 'deposit' ? Colors.exito : Colors.error, fontWeight: 'bold' }}>
                  {m.type === 'sale' || m.type === 'deposit' ? '+' : ''}{formatCurrency(m.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Delivery */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🍕 Delivery</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.statEmoji}>💰</Text>
            <Text style={[styles.statValue, { color: Colors.exito }]}>
              {deliveryRegister ? formatCurrency(deliverySales) : 'Caja cerrada'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ventas</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.statEmoji}>📦</Text>
            <Text style={[styles.statValue, { color: lowStockDelivery.length > 0 ? Colors.advertencia : Colors.exito }]}>
              {lowStockDelivery.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Stock bajo</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.statEmoji}>📋</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{deliveryOrders.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pedidos hoy</Text>
          </View>
        </View>
        {deliveryReport?.movements && deliveryReport.movements.length > 0 && (
          <View style={[styles.movementsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.movementsTitle, { color: colors.textPrimary }]}>Últimos movimientos</Text>
            {deliveryReport.movements.slice(0, 5).map((m: any, i: number) => (
              <View key={i} style={styles.movementRow}>
                <Text style={{ color: colors.textSecondary, flex: 1 }}>{m.description}</Text>
                <Text style={{ color: m.type === 'sale' || m.type === 'deposit' ? Colors.exito : Colors.error, fontWeight: 'bold' }}>
                  {m.type === 'sale' || m.type === 'deposit' ? '+' : ''}{formatCurrency(m.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Equipo */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>👥 Equipo</Text>
        <View style={[styles.teamCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {useUserStore.getState().getUsers().map((u: any, i: number) => (
            <View key={i} style={styles.teamRow}>
              <Text style={{ fontSize: 20 }}>{u.avatar}</Text>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{u.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {u.businesses?.join(' · ') || 'Sin asignar'}
                </Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{u.role}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  consolidatedCard: { margin: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.xl },
  consolidatedTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  consolidatedRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  consolidatedStat: { flex: 1, alignItems: 'center' },
  consolidatedLabel: { color: '#AAA', fontSize: 12, marginBottom: 4 },
  consolidatedValue: { fontSize: 20, fontWeight: 'bold' },
  section: { padding: Spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center', borderWidth: 1 },
  statEmoji: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: 'bold' },
  statLabel: { fontSize: 11, marginTop: 2 },
  movementsCard: { marginTop: 12, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1 },
  movementsTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  movementRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  teamCard: { padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1 },
  teamRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
});
