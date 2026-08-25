import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useProductStore } from '@/store/productStore';
import { useUserStore } from '@/store/userStore';
import { Product, StockMovement } from '@/types';
import { scaleService, ScaleReading } from '@/services/scale';
import { formatDateTime } from '@/utils/uuid';

export default function KioskoStockScreen() {
  const colors = useColors();
  const products = useProductStore(s => s.getProducts('kiosko'));
  const updateStock = useProductStore(s => s.updateStock);
  const stockMovements = useProductStore(s => s.stockMovements);
  const { currentUser } = useUserStore();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [reason, setReason] = useState('');
  const [scaleWeight, setScaleWeight] = useState<ScaleReading | null>(null);
  const [scaleConnected, setScaleConnected] = useState(false);

  useEffect(() => {
    // Try to connect to scale (if configured)
    // scaleService.connect('ws://balanza-local:8080', (reading) => {
    //   setScaleWeight(reading);
    //   setScaleConnected(true);
    // });
    return () => scaleService.disconnect();
  }, []);

  const handleAdjust = () => {
    if (!selectedProduct || !currentUser) return;
    const qty = parseFloat(adjustQty);
    if (isNaN(qty) || qty <= 0) return Alert.alert('Error', 'Ingresá una cantidad válida');

    const finalQty = adjustType === 'adjustment' ? qty : qty;

    Alert.alert(
      'Confirmar ajuste',
      `${adjustType === 'in' ? ' +' : adjustType === 'out' ? ' -' : ' = '}${qty} ${selectedProduct.unit}\n${selectedProduct.name}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            updateStock(
              selectedProduct.id,
              finalQty,
              adjustType,
              reason || `Ajuste manual`,
              currentUser.id,
              currentUser.name
            );
            Alert.alert('✅', 'Stock actualizado');
            setAdjustQty('');
            setReason('');
            setSelectedProduct(null);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Scale indicator */}
      {scaleConnected && scaleWeight && (
        <View style={[styles.scaleBar, { backgroundColor: scaleWeight.stable ? `${Colors.exito}20` : `${Colors.advertencia}20` }]}>
          <Text style={{ fontSize: 16 }}>⚖️</Text>
          <Text style={{ color: scaleWeight.stable ? Colors.exito : Colors.advertencia, fontWeight: 'bold' }}>
            {scaleService.formatWeight(scaleWeight)}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            {scaleWeight.stable ? 'Estable' : 'Cargando...'}
          </Text>
        </View>
      )}

      {/* Product selector */}
      <FlatList
        data={products}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.productRow,
              { backgroundColor: colors.card, borderColor: colors.border },
              selectedProduct?.id === item.id && { borderColor: Colors.celesteInstitucional, borderWidth: 2 },
            ]}
            onPress={() => setSelectedProduct(item)}
          >
            <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{item.name}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                Stock actual: {item.stock} {item.unit}
              </Text>
            </View>
            {item.stock <= item.minStock && (
              <View style={[styles.lowStockBadge, { backgroundColor: `${Colors.advertencia}20` }]}>
                <Text style={{ color: Colors.advertencia, fontSize: 11, fontWeight: '600' }}>Bajo</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📦 Seleccionar producto</Text>
        }
      />

      {/* Adjustment panel */}
      {selectedProduct && (
        <View style={[styles.adjustPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.adjustHeader}>
            <Text style={{ fontSize: 20 }}>{selectedProduct.emoji}</Text>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>{selectedProduct.name}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Stock: {selectedProduct.stock}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedProduct(null)}>
              <Text style={{ fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.typeRow}>
            {[
              { key: 'in', label: 'Entrada', emoji: '📥', color: Colors.exito },
              { key: 'out', label: 'Salida', emoji: '📤', color: Colors.error },
              { key: 'adjustment', label: 'Ajuste', emoji: '🔧', color: Colors.celesteInstitucional },
            ].map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeBtn, adjustType === t.key && { backgroundColor: t.color }]}
                onPress={() => setAdjustType(t.key as any)}
              >
                <Text>{t.emoji}</Text>
                <Text style={[styles.typeBtnText, adjustType === t.key && { color: '#FFF' }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Cantidad ({selectedProduct.unit})</Text>
          <TextInput
            style={[styles.qtyInput, { color: colors.textPrimary, borderColor: colors.border }]}
            placeholder={scaleConnected ? 'Usar balanza' : '0'}
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={adjustQty || (scaleWeight ? String(scaleWeight.weight) : '')}
            onChangeText={setAdjustQty}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Motivo</Text>
          <TextInput
            style={[styles.reasonInput, { color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="Ej: Recepción de mercadería..."
            placeholderTextColor={colors.textSecondary}
            value={reason}
            onChangeText={setReason}
          />

          <TouchableOpacity style={[styles.adjustBtn, { backgroundColor: Colors.celesteInstitucional }]} onPress={handleAdjust}>
            <Text style={styles.adjustBtnText}>Confirmar ajuste</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Recent movements */}
      <View style={styles.movementsSection}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📋 Últimos movimientos</Text>
        {stockMovements.slice(0, 10).map((m, i) => (
          <View key={i} style={[styles.movementRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ fontSize: 16 }}>{m.type === 'in' ? '📥' : m.type === 'out' ? '📤' : '🔧'}</Text>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '500' }}>{m.productName}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
                {m.userName} · {formatDateTime(m.createdAt)}
              </Text>
            </View>
            <Text style={{ color: m.type === 'in' ? Colors.exito : Colors.error, fontWeight: 'bold' }}>
              {m.type === 'in' ? '+' : m.type === 'out' ? '-' : '='}{m.quantity}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scaleBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, marginHorizontal: 16, marginTop: 8, borderRadius: 12 },
  list: { padding: Spacing.md, paddingBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  productRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1 },
  lowStockBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  adjustPanel: { padding: Spacing.md, borderTopWidth: 2, borderTopColor: '#E0E0E0' },
  adjustHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 10, borderRadius: 10, backgroundColor: '#F0F0F0' },
  typeBtnText: { fontSize: 13, fontWeight: '600' },
  inputLabel: { fontSize: 12, marginBottom: 4 },
  qtyInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  reasonInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 12 },
  adjustBtn: { padding: 14, borderRadius: 12, alignItems: 'center' },
  adjustBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  movementsSection: { padding: Spacing.md },
  movementRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, marginBottom: 6, borderWidth: 1 },
});
