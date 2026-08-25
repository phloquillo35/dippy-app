import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useProductStore } from '@/store/productStore';
import { formatCurrency } from '@/utils/uuid';

export default function AdminMarginsScreen() {
  const colors = useColors();
  const [filter, setFilter] = useState<'all' | 'kiosko' | 'delivery'>('all');

  const products = useProductStore(s => filter === 'all' ? s.getProducts() : s.getProducts(filter as any));

  const productsWithMargin = products
    .filter(p => p.costPrice > 0)
    .map(p => ({
      ...p,
      margin: ((p.salePrice - p.costPrice) / p.costPrice * 100),
      profit: p.salePrice - p.costPrice,
    }))
    .sort((a, b) => b.margin - a.margin);

  const avgMargin = productsWithMargin.length > 0
    ? productsWithMargin.reduce((s, p) => s + p.margin, 0) / productsWithMargin.length
    : 0;

  const topProducts = productsWithMargin.slice(0, 10);
  const worstProducts = productsWithMargin.slice(-5).reverse();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.filterRow}>
        {(['all', 'kiosko', 'delivery'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, { backgroundColor: filter === f ? Colors.celesteInstitucional : colors.card, borderColor: colors.border }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { color: filter === f ? '#FFF' : colors.textPrimary }]}>
              {f === 'all' ? 'Todos' : f === 'kiosko' ? '🏪 Kiosko' : '🍕 Delivery'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.avgCard, { backgroundColor: '#1A1A2E' }]}>
        <Text style={styles.avgLabel}>Margen promedio</Text>
        <Text style={[styles.avgValue, { color: Colors.exito }]}>{avgMargin.toFixed(1)}%</Text>
        <Text style={styles.avgSub}>{productsWithMargin.length} productos con costo definido</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🏆 Top márgenes</Text>
        {topProducts.map((p, i) => (
          <View key={p.id} style={[styles.productRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.rank}>#{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{p.emoji} {p.name}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                Costo: {formatCurrency(p.costPrice)} → Venta: {formatCurrency(p.salePrice)}
              </Text>
            </View>
            <View style={styles.marginCol}>
              <Text style={[styles.marginValue, { color: Colors.exito }]}>{p.margin.toFixed(0)}%</Text>
              <Text style={{ color: Colors.exito, fontSize: 11 }}>+{formatCurrency(p.profit)}</Text>
            </View>
          </View>
        ))}
      </View>

      {worstProducts.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.advertencia }]}>⚠️ Menores márgenes</Text>
          {worstProducts.map((p, i) => (
            <View key={p.id} style={[styles.productRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{p.emoji} {p.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  Costo: {formatCurrency(p.costPrice)} → Venta: {formatCurrency(p.salePrice)}
                </Text>
              </View>
              <View style={styles.marginCol}>
                <Text style={[styles.marginValue, { color: p.margin < 20 ? Colors.error : Colors.advertencia }]}>{p.margin.toFixed(0)}%</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>+{formatCurrency(p.profit)}</Text>
              </View>
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
  filterRow: { flexDirection: 'row', padding: Spacing.md, gap: 8 },
  filterBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  filterText: { fontWeight: '600', fontSize: 13 },
  avgCard: { margin: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.xl, alignItems: 'center' },
  avgLabel: { color: '#AAA', fontSize: 14 },
  avgValue: { fontSize: 36, fontWeight: 'bold', marginVertical: 4 },
  avgSub: { color: '#888', fontSize: 12 },
  section: { padding: Spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  productRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.sm, borderRadius: BorderRadius.lg, marginBottom: 8, borderWidth: 1, gap: 8 },
  rank: { fontSize: 14, fontWeight: 'bold', color: '#999', width: 30 },
  marginCol: { alignItems: 'flex-end' },
  marginValue: { fontSize: 16, fontWeight: 'bold' },
});
