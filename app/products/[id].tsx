import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useProductStore } from '@/store/productStore';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { formatCurrency } from '@/utils/uuid';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const getProductById = useProductStore(s => s.getProductById);
  const addItem = useCartStore(s => s.addItem);
  const product = getProductById(id!);
  const [qty, setQty] = useState(1);

  if (!product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 64, marginBottom: 16 }}>📦</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Producto no encontrado</Text>
        <Button title="Volver" onPress={() => router.back()} />
      </View>
    );
  }

  const handleAdd = () => {
    addItem(product, undefined, qty);
    Alert.alert('Agregado', `${qty}x ${product.name} en el carrito`, [
      { text: 'Seguir', onPress: () => router.back() },
      { text: 'Ir al carrito', onPress: () => router.push('/(tabs)/cart') },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <Card variant="elevated" padding="lg" style={styles.card}>
        <View style={styles.header}>
          <View style={[styles.emojiBox, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={styles.emoji}>{product.emoji || '📦'}</Text>
          </View>
          <View style={styles.info}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{product.name}</Text>
            <Text style={[styles.barcode, { color: colors.textSecondary }]}>Barcode: {product.barcode}</Text>
            <Text style={[styles.category, { color: colors.primary }]}>{product.category}</Text>
          </View>
        </View>
        {product.description && (
          <Text style={[styles.desc, { color: colors.textSecondary }]}>{product.description}</Text>
        )}
      </Card>

      <Card variant="default" padding="lg" style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Precios</Text>
        <View style={styles.priceRow}>
          <View style={styles.priceItem}>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Venta</Text>
            <Text style={[styles.priceValue, { color: colors.primary }]}>{formatCurrency(product.salePrice)}</Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Costo</Text>
            <Text style={[styles.priceValue, { color: colors.textSecondary }]}>{formatCurrency(product.costPrice)}</Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Stock</Text>
            <Text style={[styles.priceValue, { color: product.stock <= product.minStock ? Colors.error : Colors.exito }]}>
              {product.stock} {product.unit}
            </Text>
          </View>
        </View>
      </Card>

      {product.weightOptions && product.weightOptions.length > 0 && (
        <Card variant="default" padding="lg" style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Opciones de Peso</Text>
          {product.weightOptions.map(w => (
            <View key={w.id} style={[styles.weightRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.weightLabel, { color: colors.textPrimary }]}>{w.label}</Text>
              <Text style={[styles.weightPrice, { color: colors.primary }]}>{formatCurrency(w.price)}</Text>
            </View>
          ))}
        </Card>
      )}

      <Card variant="default" padding="lg" style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Agregar al Carrito</Text>
        <View style={styles.qtyRow}>
          <Button title="-" variant="outline" onPress={() => setQty(Math.max(1, qty - 1))} style={styles.qtyBtn} />
          <Text style={[styles.qtyValue, { color: colors.textPrimary }]}>{qty}</Text>
          <Button title="+" variant="outline" onPress={() => setQty(qty + 1)} style={styles.qtyBtn} />
        </View>
        <Text style={[styles.totalText, { color: colors.primary }]}>
          Total: {formatCurrency(product.salePrice * qty)}
        </Text>
        <Button title="Agregar al Carrito" onPress={handleAdd} />
      </Card>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: { marginHorizontal: 16, marginBottom: 12, marginTop: 4 },
  header: { flexDirection: 'row', alignItems: 'center' },
  emojiBox: { width: 80, height: 80, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 48 },
  info: { flex: 1, marginLeft: 16 },
  title: { fontSize: 22, fontWeight: 'bold' },
  barcode: { fontSize: 12, marginTop: 4 },
  category: { fontSize: 12, marginTop: 4, textTransform: 'capitalize' },
  desc: { fontSize: 14, marginTop: 12, lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12 },
  priceItem: { alignItems: 'center' },
  priceLabel: { fontSize: 12, marginBottom: 4 },
  priceValue: { fontSize: 20, fontWeight: 'bold' },
  weightRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1 },
  weightLabel: { fontSize: 14, fontWeight: '500' },
  weightPrice: { fontSize: 16, fontWeight: 'bold' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 },
  qtyBtn: { width: 48, height: 48 },
  qtyValue: { fontSize: 28, fontWeight: 'bold', minWidth: 48, textAlign: 'center' },
  totalText: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
});