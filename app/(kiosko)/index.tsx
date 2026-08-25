import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useProductStore } from '@/store/productStore';
import { useUserStore } from '@/store/userStore';
import { useCashStore } from '@/store/cashStore';
import { useColors } from '@/theme/ThemeProvider';
import { Colors, Spacing, BorderRadius } from '@/theme';

export default function KioskoHome() {
  const colors = useColors();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);
  const { currentUser, currentTurn } = useUserStore();
  const cashRegister = useCashStore(s => s.getOpenRegister('kiosko'));
  const report = useCashStore(s => s.getBusinessReport('kiosko', new Date().toISOString().split('T')[0]));
  const lowStockProducts = useProductStore(s => s.getLowStockProducts('kiosko'));
  const totalSales = report ? report.cashIn + report.transfersIn + report.cardIn + report.mercadopagoIn : 0;

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const stats = [
    { emoji: '💰', label: 'Caja', value: cashRegister ? `$${totalSales.toLocaleString()}` : 'Sin abrir', color: Colors.exito },
    { emoji: '📦', label: 'Stock bajo', value: `${lowStockProducts.length} items`, color: lowStockProducts.length > 0 ? Colors.advertencia : Colors.exito },
    { emoji: '🟢', label: 'Turno', value: currentTurn ? `${currentUser?.name?.split(' ')[0]}` : 'Sin turno', color: Colors.celesteInstitucional },
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
          { emoji: '🛒', label: 'Vender', route: '/(kiosko)/cart' },
          { emoji: '📦', label: 'Gestionar stock', route: '/(kiosko)/products' },
          { emoji: '💰', label: 'Caja', route: '/(kiosko)/cash' },
          { emoji: '👥', label: 'Equipo', route: '/(kiosko)/users' },
          { emoji: '🏢', label: 'Proveedores', route: '/(kiosko)/providers' },
          { emoji: '⚖️', label: 'Ajustar stock', route: '/(kiosko)/stock' },
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
  statsGrid: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm },
  statCard: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center', borderWidth: 1 },
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
