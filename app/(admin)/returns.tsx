import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useOrderStore } from '@/store/orderStore';
import { useReturnStore, ReturnReason } from '@/store/returnStore';
import { useProductStore } from '@/store/productStore';
import { useCashStore } from '@/store/cashStore';
import { useUserStore } from '@/store/userStore';
import { useAuditStore } from '@/store/auditStore';
import { BusinessType } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/uuid';

const REASONS: { key: ReturnReason; label: string; emoji: string }[] = [
  { key: 'defective', label: 'Defectuoso', emoji: '⚠️' },
  { key: 'wrong_item', label: 'Producto equivocado', emoji: '🔄' },
  { key: 'changed_mind', label: 'Se arrepintió', emoji: '🤷' },
  { key: 'allergic', label: 'Alergia/intolerancia', emoji: '🚫' },
  { key: 'other', label: 'Otro motivo', emoji: '📝' },
];

const REFUND_METHODS = [
  { key: 'cash', label: '💵 Efectivo' },
  { key: 'card', label: '💳 Tarjeta' },
  { key: 'transfer', label: '🏦 Transferencia' },
] as const;

export default function ReturnsScreen() {
  const colors = useColors();
  const currentUser = useUserStore(s => s.currentUser);
  const getAllOrders = useOrderStore(s => s.getAllOrders);
  const processReturn = useReturnStore(s => s.processReturn);
  const getReturns = useReturnStore(s => s.getReturns);

  const [businessFilter, setBusinessFilter] = useState<'all' | BusinessType>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [reason, setReason] = useState<ReturnReason>('changed_mind');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'card' | 'transfer'>('cash');

  const eligibleOrders = getAllOrders().filter(
    o => o.status === 'sold' || o.status === 'delivered'
  );
  const filteredOrders = businessFilter === 'all'
    ? eligibleOrders
    : eligibleOrders.filter(o => o.businessId === businessFilter);

  const selectedOrder = selectedOrderId
    ? getAllOrders().find(o => o.id === selectedOrderId)
    : null;

  const refundTotal = selectedOrder
    ? selectedOrder.items.reduce((sum, item) => sum + (qtys[item.id] || 0) * item.unitPrice, 0)
    : 0;

  const openModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setQtys({});
    setReason('changed_mind');
    setRefundMethod('cash');
  };

  const adjustQty = (itemId: string, delta: number, max: number) => {
    setQtys(prev => {
      const next = Math.max(0, Math.min(max, (prev[itemId] || 0) + delta));
      return { ...prev, [itemId]: next };
    });
  };

  const handleProcessReturn = () => {
    if (!selectedOrder || !currentUser) return;

    const items = selectedOrder.items
      .filter(item => (qtys[item.id] || 0) > 0)
      .map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: qtys[item.id],
        unitPrice: item.unitPrice,
        reason,
      }));

    if (items.length === 0) {
      Alert.alert('Error', 'Seleccioná al menos una unidad para devolver');
      return;
    }

    Alert.alert(
      'Confirmar devolución',
      `Total a reembolsar: ${formatCurrency(refundTotal)} (${refundMethod === 'cash' ? 'efectivo' : refundMethod === 'card' ? 'tarjeta' : 'transferencia'})`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Procesar',
          style: 'destructive',
          onPress: () => {
            processReturn({
              originalOrderId: selectedOrder.id,
              businessId: selectedOrder.businessId,
              items,
              totalRefund: refundTotal,
              refundMethod,
              processedBy: currentUser.id,
              processedByName: currentUser.name,
            });

            // Restaurar stock de los productos devueltos
            items.forEach(item => {
              useProductStore.getState().updateStock(
                item.productId,
                item.quantity,
                'return',
                `Devolución pedido #${selectedOrder.id.slice(-6).toUpperCase()}`,
                currentUser.id,
                currentUser.name,
                selectedOrder.id
              );
            });

            // Si el reembolso es en efectivo y hay caja abierta, registrar egreso
            if (refundMethod === 'cash') {
              const register = useCashStore.getState().getOpenRegister(selectedOrder.businessId);
              if (register) {
                useCashStore.getState().addMovement(register.id, {
                  type: 'expense',
                  amount: refundTotal,
                  description: `Devolución pedido #${selectedOrder.id.slice(-6).toUpperCase()}`,
                  paymentMethod: 'efectivo',
                  orderId: selectedOrder.id,
                  userId: currentUser.id,
                  userName: currentUser.name,
                });
              }
            }

            useAuditStore.getState().log({
              action: 'return_processed',
              userId: currentUser.id,
              userName: currentUser.name,
              businessId: selectedOrder.businessId,
              description: `Devolución de ${formatCurrency(refundTotal)} sobre pedido #${selectedOrder.id.slice(-6).toUpperCase()}`,
              metadata: { orderId: selectedOrder.id, items: items.length },
            });

            Alert.alert('✅', 'Devolución procesada. Stock restaurado.');
            setSelectedOrderId(null);
          },
        },
      ]
    );
  };

  const returnsHistory = getReturns(businessFilter === 'all' ? undefined : businessFilter);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.filters}>
        {(['all', 'kiosko', 'delivery'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, { backgroundColor: businessFilter === f ? Colors.negroSuave : colors.card, borderColor: colors.border }]}
            onPress={() => setBusinessFilter(f)}
          >
            <Text style={{ color: businessFilter === f ? colors.textOnPrimary : colors.textPrimary, fontWeight: '600', fontSize: 13 }}>
              {f === 'all' ? 'Todos' : f === 'kiosko' ? '🏪 Kiosko' : '🍕 Delivery'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🧾 Pedidos elegibles ({filteredOrders.length})</Text>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>Ventas entregadas o vendidas — tocá una para devolver</Text>

      {filteredOrders.length === 0 && (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ color: colors.textSecondary }}>No hay pedidos elegibles para devolución</Text>
        </View>
      )}

      {filteredOrders.map(order => (
        <TouchableOpacity
          key={order.id}
          style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => openModal(order.id)}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>
              #{order.id.slice(-6).toUpperCase()} · {formatCurrency(order.total)}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              {order.businessId === 'kiosko' ? '🏪 Kiosko' : '🍕 Delivery'} · {order.status === 'sold' ? 'Vendido' : 'Entregado'} · {formatDateTime(order.createdAt)}
              {order.customerName ? ` · ${order.customerName}` : ''}
            </Text>
          </View>
          <Text style={{ color: Colors.error, fontWeight: '600', fontSize: 13 }}>↩︎ Devolver</Text>
        </TouchableOpacity>
      ))}

      {returnsHistory.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📋 Devoluciones previas</Text>
          {returnsHistory.slice(0, 10).map(r => (
            <View key={r.id} style={[styles.orderCard, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textPrimary, fontSize: 13 }}>
                  #{r.originalOrderId.slice(-6).toUpperCase()} → {formatCurrency(r.totalRefund)} · {r.refundMethod}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                  {r.processedByName} · {formatDateTime(r.createdAt)}
                </Text>
              </View>
            </View>
          ))}
        </>
      )}

      {/* Modal de devolución */}
      {selectedOrder && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Devolver #{selectedOrder.id.slice(-6).toUpperCase()}
            </Text>

            <ScrollView style={{ maxHeight: 260 }}>
              {selectedOrder.items.map(item => (
                <View key={item.id} style={[styles.itemRow, { borderColor: colors.border }]}>
                  <Text>{item.emoji || '📦'}</Text>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 13 }}>{item.productName}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{formatCurrency(item.unitPrice)} c/u</Text>
                  </View>
                  <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: colors.border }]} onPress={() => adjustQty(item.id, -1, item.quantity)}>
                    <Text>-</Text>
                  </TouchableOpacity>
                  <Text style={{ color: colors.textPrimary, marginHorizontal: 10, fontWeight: 'bold', minWidth: 20, textAlign: 'center' }}>
                    {qtys[item.id] || 0}/{item.quantity}
                  </Text>
                  <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: colors.border }]} onPress={() => adjustQty(item.id, 1, item.quantity)}>
                    <Text>+</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Motivo</Text>
            <View style={styles.chipsWrap}>
              {REASONS.map(r => (
                <TouchableOpacity key={r.key} style={[styles.reasonChip, { backgroundColor: reason === r.key ? Colors.amarilloAcento : colors.surfaceVariant }]} onPress={() => setReason(r.key)}>
                  <Text style={{ fontSize: 12, color: colors.textPrimary }}>{r.emoji} {r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Reembolso en</Text>
            <View style={styles.chipsWrap}>
              {REFUND_METHODS.map(m => (
                <TouchableOpacity key={m.key} style={[styles.reasonChip, { backgroundColor: refundMethod === m.key ? Colors.exito : colors.surfaceVariant }]} onPress={() => setRefundMethod(m.key)}>
                  <Text style={{ fontSize: 12, color: refundMethod === m.key ? colors.textOnPrimary : colors.textPrimary }}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.totalText, { color: Colors.error }]}>Reembolso: {formatCurrency(refundTotal)}</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.border }]} onPress={() => setSelectedOrderId(null)}>
                <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Colors.error }]} onPress={handleProcessReturn}>
                <Text style={{ color: colors.textOnPrimary, fontWeight: 'bold' }}>Procesar devolución</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filters: { flexDirection: 'row', padding: Spacing.md, gap: 8 },
  filterBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginHorizontal: Spacing.md, marginBottom: 4 },
  hint: { fontSize: 12, marginHorizontal: Spacing.md, marginBottom: 8 },
  emptyCard: { marginHorizontal: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1, alignItems: 'center' },
  orderCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.md, marginBottom: 8, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: Spacing.lg },
  modalContent: { borderRadius: BorderRadius.xl, padding: Spacing.lg },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  qtyBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalLabel: { fontSize: 12, marginTop: 10, marginBottom: 4 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  reasonChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  totalText: { fontSize: 18, fontWeight: 'bold', marginTop: 12, textAlign: 'center' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 14 },
  modalBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
});
