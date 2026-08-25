import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useProductStore } from '@/store/productStore';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/utils/uuid';

export default function KioskoProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const product = useProductStore(s => s.getProductById(id!));
  const addItem = useCartStore(s => s.addItem);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!product) {
      Alert.alert('Producto no disponible', 'Ese producto ya no existe.', [{ text: 'OK' }]);
      router.replace('/(kiosko)/cart');
    }
  }, [product]);

  if (!product) return null;

  const maxQty = product.stock;
  const canAdd = product.stock > 0;

  const handleAdd = () => {
    if (!canAdd) {
      Alert.alert('Sin stock', `${product.name} no tiene stock disponible`);
      return;
    }
    if (qty > maxQty) {
      Alert.alert('Stock insuficiente', `Solo quedan ${maxQty} unidades de ${product.name}`);
      return;
    }
    addItem(product, undefined, qty);
    Alert.alert('Agregado', `${qty}x ${product.name} en el carrito`, [
      { text: 'Seguir', onPress: () => router.back() },
      { text: 'Ir al carrito', onPress: () => router.push('/(kiosko)/cart') },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={styles.emoji}>{product.emoji || '📦'}</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{product.name}</Text>
        <Text style={[styles.desc, { color: colors.textSecondary }]}>{product.description}</Text>

        <View style={[styles.priceRow, { borderColor: colors.border }]}>
          <View>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Precio</Text>
            <Text style={[styles.price, { color: Colors.exito }]}>{formatCurrency(product.salePrice)}</Text>
          </View>
          <View>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Stock</Text>
            <Text style={[styles.price, { color: product.stock <= product.minStock ? Colors.advertencia : colors.textPrimary }]}>
              {product.stock} {product.unit}
            </Text>
          </View>
        </View>

        {product.isWeightBased && product.weightOptions && (
          <View style={styles.weightSection}>
            <Text style={[styles.weightTitle, { color: colors.textPrimary }]}>⚖️ Opciones de peso</Text>
            {product.weightOptions.map((w, i) => (
              <View key={i} style={[styles.weightRow, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textPrimary }}>{w.label}</Text>
                <Text style={{ color: Colors.exito, fontWeight: 'bold' }}>${w.price.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.qtySection}>
          <Text style={[styles.qtyLabel, { color: colors.textSecondary }]}>Cantidad (max: {maxQty})</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: colors.border }]} onPress={() => setQty(Math.max(1, qty - 1))}>
              <Text style={{ fontSize: 18 }}>-</Text>
            </TouchableOpacity>
            <Text style={[styles.qtyValue, { color: colors.textPrimary }]}>{qty}</Text>
            <TouchableOpacity
              style={[styles.qtyBtn, { backgroundColor: colors.border }]}
              onPress={() => { if (qty < maxQty) setQty(qty + 1); }}
            >
              <Text style={{ fontSize: 18 }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!canAdd ? (
          <View style={[styles.outOfStockBtn]}>
            <Text style={styles.outOfStockText}>❌ Sin stock</Text>
          </View>
        ) : (
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: Colors.celesteInstitucional }]} onPress={handleAdd}>
            <Text style={styles.addBtnText}>Agregar {qty}x al carrito — {formatCurrency(product.salePrice * qty)}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { margin: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.xl, borderWidth: 1 },
  emoji: { fontSize: 64, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  desc: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, marginBottom: 16 },
  priceLabel: { fontSize: 12, textAlign: 'center' },
  price: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  weightSection: { marginBottom: 16 },
  weightTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  weightRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1 },
  qtySection: { alignItems: 'center', marginBottom: 16 },
  qtyLabel: { fontSize: 13, marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { fontSize: 24, fontWeight: 'bold', minWidth: 40, textAlign: 'center' },
  addBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  addBtnText: { color: Colors.blanco, fontSize: 16, fontWeight: 'bold' },
  outOfStockBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: Colors.grisClaro },
  outOfStockText: { color: Colors.grisMedio, fontSize: 16, fontWeight: 'bold' },
});
