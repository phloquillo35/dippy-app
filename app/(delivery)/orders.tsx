import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useOrderStore } from '@/store/orderStore';
import { formatDateTime } from '@/utils/uuid';
import { OrderStatus } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  pending: { label: 'Pendiente', emoji: '⏳', color: Colors.advertencia },
  confirmed: { label: 'Confirmado', emoji: '✅', color: Colors.celesteInstitucional },
  preparing: { label: 'Preparando', emoji: '👨‍🍳', color: Colors.advertencia },
  ready: { label: 'Listo', emoji: '📦', color: Colors.exito },
  delivering: { label: 'En camino', emoji: '🛵', color: Colors.celesteInstitucional },
  delivered: { label: 'Entregado', emoji: '✅', color: Colors.exito },
  sold: { label: 'Vendido', emoji: '💰', color: Colors.exito },
  cancelled: { label: 'Cancelado', emoji: '❌', color: Colors.error },
};

export default function DeliveryOrdersScreen() {
  const colors = useColors();
  const getActiveOrders = useOrderStore(s => s.getActiveOrders);
  const getPendingOrders = useOrderStore(s => s.getPendingOrders);
  const getSoldOrders = useOrderStore(s => s.getSoldOrders);
  const updateStatus = useOrderStore(s => s.updateOrderStatus);
  const markAsPaid = useOrderStore(s => s.markAsPaid);
  const markAsDelivered = useOrderStore(s => s.markAsDelivered);
  const markAsSold = useOrderStore(s => s.markAsSold);
  const cancelOrder = useOrderStore(s => s.cancelOrder);

  const [activeTab, setActiveTab] = useState<'active' | 'sold'>('active');
  const activeOrders = getActiveOrders('delivery');
  const pendingOrders = getPendingOrders('delivery');
  const soldOrders = getSoldOrders('delivery');
  const displayOrders = activeTab === 'active' ? [...pendingOrders, ...activeOrders.filter(o => o.status !== 'pending')] : soldOrders;

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const order = displayOrders.find(o => o.id === orderId);
    if (!order) return;

    if (newStatus === 'sold') {
      Alert.alert('Confirmar', `Marcar #${orderId.slice(-6).toUpperCase()} como vendido`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Vender', onPress: () => markAsSold(orderId) },
      ]);
    } else {
      updateStatus(orderId, newStatus);
    }
  };

  const getAvailableStatuses = (currentStatus: string): OrderStatus[] => {
    const flow: Record<string, OrderStatus[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready'],
      ready: ['delivering'],
      delivering: ['delivered'],
      delivered: ['sold'],
    };
    return flow[currentStatus] || [];
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'active' && { borderBottomColor: Colors.azulInstitucional }]} onPress={() => setActiveTab('active')}>
          <Text style={[styles.tabText, activeTab === 'active' && { color: Colors.azulInstitucional }]}>
            Activos ({activeOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'sold' && { borderBottomColor: Colors.exito }]} onPress={() => setActiveTab('sold')}>
          <Text style={[styles.tabText, activeTab === 'sold' && { color: Colors.exito }]}>
            Vendidos ({soldOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayOrders}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
          const availableStatuses = getAvailableStatuses(item.status);

          return (
            <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.orderHeader}>
                <View style={styles.orderId}>
                  <Text style={[styles.orderNumber, { color: colors.textPrimary }]}>
                    #{item.id.slice(-6).toUpperCase()}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{formatDateTime(item.createdAt)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}20` }]}>
                  <Text>{statusConfig.emoji}</Text>
                  <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                </View>
              </View>

              <Text style={[styles.customerName, { color: colors.textPrimary }]}>👤 {item.customerName || 'Sin nombre'}</Text>

              <View style={styles.itemsSummary}>
                {item.items.slice(0, 3).map((itm, idx) => (
                  <Text key={idx} style={{ color: colors.textSecondary, fontSize: 13 }}>
                    {itm.quantity}x {itm.productName}
                  </Text>
                ))}
                {item.items.length > 3 && <Text style={{ color: colors.textSecondary }}>+{item.items.length - 3} más</Text>}
              </View>

              <Text style={[styles.orderTotal, { color: Colors.exito }]}>
                Total: ${(item.total + (item.deliveryFee || 0)).toLocaleString()}
                {item.deliveryFee ? ` (+$${item.deliveryFee} envío)` : ''}
              </Text>

              {availableStatuses.length > 0 && (
                <View style={styles.actions}>
                  {availableStatuses.map(s => {
                    const cfg = STATUS_CONFIG[s];
                    return (
                      <TouchableOpacity key={s} style={[styles.actionBtn, { backgroundColor: `${cfg.color}20` }]} onPress={() => handleStatusChange(item.id, s)}>
                        <Text style={[styles.actionText, { color: cfg.color }]}>
                          {cfg.emoji} {cfg.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>{activeTab === 'active' ? '📋' : '💰'}</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {activeTab === 'active' ? 'No hay pedidos activos' : 'No hay pedidos vendidos'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#999' },
  list: { padding: Spacing.md },
  orderCard: { padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: 12, borderWidth: 1 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  orderId: { flex: 1 },
  orderNumber: { fontSize: 18, fontWeight: 'bold' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  customerName: { fontSize: 15, marginBottom: 4 },
  itemsSummary: { marginBottom: 8, gap: 2 },
  orderTotal: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  actionText: { fontWeight: '600', fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 14, marginTop: 8 },
});
