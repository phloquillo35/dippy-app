import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useCustomerStore } from '@/store/customerStore';
import { formatCurrency } from '@/utils/uuid';

export default function AdminCustomersScreen() {
  const colors = useColors();
  const { customers, searchCustomers, getTopCustomers } = useCustomerStore();
  const [query, setQuery] = useState('');

  const results = query ? searchCustomers(query) : getTopCustomers(20);
  const totalCustomers = customers.filter(c => c.isActive).length;
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: Colors.celesteInstitucional }]}>{totalCustomers}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Clientes</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: Colors.exito }]}>{formatCurrency(totalRevenue)}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Facturación total</Text>
        </View>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Buscar por nombre, teléfono o dirección..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.customerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.customerHeader}>
              <View>
                <Text style={[styles.customerName, { color: colors.textPrimary }]}>{item.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>📞 {item.phone || 'Sin teléfono'}</Text>
              </View>
              <View style={styles.customerStats}>
                <Text style={[styles.orderCount, { color: Colors.celesteInstitucional }]}>{item.totalOrders} pedidos</Text>
                <Text style={[styles.totalSpent, { color: Colors.exito }]}>{formatCurrency(item.totalSpent)}</Text>
              </View>
            </View>
            {item.address ? (
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>📍 {item.address}</Text>
            ) : null}
            {item.lastOrderAt ? (
              <Text style={{ color: colors.placeholder, fontSize: 11, marginTop: 2 }}>Último pedido: {new Date(item.lastOrderAt).toLocaleDateString('es-AR')}</Text>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {query ? 'No se encontraron clientes' : 'Aún no hay clientes registrados'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statsRow: { flexDirection: 'row', margin: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.md, marginBottom: Spacing.md, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 16 },
  list: { padding: Spacing.md },
  customerCard: { padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: 10, borderWidth: 1 },
  customerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  customerName: { fontSize: 16, fontWeight: '600' },
  customerStats: { alignItems: 'flex-end' },
  orderCount: { fontSize: 12, fontWeight: '600' },
  totalSpent: { fontSize: 14, fontWeight: 'bold' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 14, marginTop: 8 },
});
