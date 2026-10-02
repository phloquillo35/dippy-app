import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useOrderStore } from '@/store/orderStore';
import { useUserStore } from '@/store/userStore';
import { useCashStore } from '@/store/cashStore';
import { getCashBalance } from '@/utils/cash';
import { useColors } from '@/theme/ThemeProvider';
import { Colors, Spacing, BorderRadius } from '@/theme';

export default function DeliveryHome() {
  const colors = useColors();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);
  const { currentUser, currentTurn } = useUserStore();
  const cashRegister = useCashStore(s => s.getOpenRegister('delivery'));
  const report = useCashStore(s => s.getBusinessReport('delivery', new Date().toISOString().split('T')[0]));
  const pendingOrders = useOrderStore(s => s.getPendingOrders('delivery'));
  const activeOrders = useOrderStore(s => s.getActiveOrders('delivery'));
  const soldOrders = useOrderStore(s => s.getSoldOrders('delivery'));

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const todaySales = soldOrders.reduce((sum, o) => sum + o.total, 0);
  const cashBalance = getCashBalance(report);

  const stats = [
    { emoji: '💰', label: 'Caja', value: cashRegister ? `$${cashBalance.toLocaleString()}` : 'Sin abrir', color: Colors.exito },
    { emoji: '📋', label: 'Pendientes', value: `${pendingOrders.length}`, color: pendingOrders.length > 0 ? Colors.advertencia : Colors.exito },
    { emoji: '🚀', label: 'Activos', value: `${activeOrders.length}`, color: Colors.celesteInstitucional },
    { emoji: '💵', label: 'Ventas', value: `$${todaySales.toLocaleString()}`, color: Colors.exito },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.statsGrid}>
        {stats.map((s, i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.statEmoji}>{s.emoji}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Accesos rápidos</Text>
        {[
          { emoji: '🍽️', label: 'Nuevo pedido', route: '/(delivery)/menu' },
          { emoji: '📋', label: 'Ver pedidos', route: '/(delivery)/orders' },
          { emoji: '🍽️', label: 'Menú', route: '/(delivery)/menu' },
          { emoji: '💰', label: 'Caja', route: '/(delivery)/cash' },
          { emoji: '👥', label: 'Equipo', route: '/(delivery)/users' },
          { emoji: '🏢', label: 'Proveedores', route: '/(delivery)/providers' },
          { emoji: '💬', label: 'Importar WhatsApp', route: '/(delivery)/whatsapp-import' },
        ].map((item, i) => (
          <TouchableOpacity key={i} style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push(item.route)}>
            <Text style={styles.quickEmoji}>{item.emoji}</Text>
            <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.md, gap: Spacing.sm },
  statCard: { width: '47%', padding: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center', borderWidth: 1 },
  statEmoji: { fontSize: 28, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: 'bold' },
  statLabel: { fontSize: 11, marginTop: 2 },
  section: { padding: Spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: Spacing.sm },
  quickBtn: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md,
    borderRadius: BorderRadius.lg, marginBottom: Spacing.sm, borderWidth: 1,
  },
  quickEmoji: { fontSize: 24, marginRight: Spacing.md },
  quickLabel: { fontSize: 16, fontWeight: '500' },
});
