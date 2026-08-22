import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '@/theme';
import { useColors, useShadow } from '@/theme/ThemeProvider';
import { useProductStore } from '@/store/productStore';
import { useCartStore } from '@/store/cartStore';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { formatCurrency } from '@/utils/uuid';
import { Product, ProductVariant, WeightOption } from '@/types';

export default function ScannerScreen() {
  const colors = useColors();
  const getProductByBarcode = useProductStore(s => s.getProductByBarcode);
  const addItem = useCartStore(s => s.addItem);

  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<WeightOption | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [scanActive, setScanActive] = useState(true);

  const handleBarcodeScanned = (barcode: string) => {
    const product = getProductByBarcode(barcode);

    if (product) {
      setScannedProduct(product);
      setScanActive(false);
      setSelectedWeight(undefined);
      setQuantity(1);
    } else {
      Alert.alert(
        '❓ Producto no encontrado',
        `Código: ${barcode}\n\n¿Querés agregar este producto nuevo?`,
        [
          { text: 'Cancelar', onPress: () => setScanActive(true) },
          {
            text: 'Agregar',
            onPress: () => {
              // Navigate to add product with barcode pre-filled
              router.push(`/products/add?barcode=${barcode}`);
            },
          },
        ]
      );
    }
  };

  const handleManualSearch = () => {
    if (manualBarcode.trim()) {
      handleBarcodeScanned(manualBarcode.trim());
    }
  };

  const handleAddToCart = () => {
    if (!scannedProduct) return;

    addItem(scannedProduct, undefined, quantity);

    Alert.alert(
      '✅ Agregado al carrito',
      `${quantity}x ${scannedProduct.name}${selectedWeight ? ` (${selectedWeight.label})` : ''}`,
      [
        {
          text: '📱 Escanear otro',
          onPress: () => {
            setScannedProduct(null);
            setSelectedWeight(undefined);
            setQuantity(1);
            setScanActive(true);
          },
        },
        {
          text: '🛒 Ver carrito',
          onPress: () => router.push('/(tabs)/cart'),
        },
      ]
    );
  };

  const handleRescan = () => {
    setScannedProduct(null);
    setSelectedWeight(undefined);
    setQuantity(1);
    setScanActive(true);
  };

  // Product found view
  if (scannedProduct) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Product Card */}
        <Card variant="elevated" padding="lg" style={styles.productCard}>
          <View style={styles.productHeader}>
            <View style={[styles.productEmoji, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={styles.emojiText}>{scannedProduct.emoji || '📦'}</Text>
            </View>
            <View style={styles.productInfo}>
              <Text style={[styles.productName, { color: colors.textPrimary }]}>
                {scannedProduct.name}
              </Text>
              <Text style={[styles.productBarcode, { color: colors.textSecondary }]}>
                📊 {scannedProduct.barcode}
              </Text>
              <Text style={[styles.productCategory, { color: colors.primary }]}>
                {scannedProduct.category}
              </Text>
            </View>
          </View>

          {scannedProduct.description && (
            <Text style={[styles.productDescription, { color: colors.textSecondary }]}>
              {scannedProduct.description}
            </Text>
          )}

          <View style={styles.priceSection}>
            <View style={styles.priceItem}>
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Precio Venta</Text>
              <Text style={[styles.priceValue, { color: colors.primary }]}>
                {formatCurrency(scannedProduct.salePrice)}
              </Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Precio Costo</Text>
              <Text style={[styles.priceValue, { color: colors.textSecondary }]}>
                {formatCurrency(scannedProduct.costPrice)}
              </Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Stock</Text>
              <Text style={[
                styles.priceValue,
                { color: scannedProduct.stock <= scannedProduct.minStock ? Colors.error : Colors.exito }
              ]}>
                {scannedProduct.stock} {scannedProduct.unit}
              </Text>
            </View>
          </View>

          {/* Weight Options */}
          {scannedProduct.isWeightBased && scannedProduct.weightOptions && (
            <View style={styles.variantSection}>
              <Text style={[styles.variantTitle, { color: colors.textPrimary }]}>
                ⚖️ Seleccionar peso:
              </Text>
              <View style={styles.variantGrid}>
                {scannedProduct.weightOptions.map((variant) => (
                  <Button
                    key={variant.id}
                    title={`${variant.label} - ${formatCurrency(variant.price)}`}
                    variant={selectedWeight?.id === variant.id ? 'primary' : 'outline'}
                    size="sm"
                    onPress={() => setSelectedWeight(variant)}
                    style={styles.variantButton}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Quantity */}
          <View style={styles.quantitySection}>
            <Text style={[styles.quantityLabel, { color: colors.textPrimary }]}>
              📦 Cantidad:
            </Text>
            <View style={styles.quantityControls}>
              <Button
                title="−"
                variant="outline"
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                style={styles.qtyButton}
              />
              <Text style={[styles.quantityValue, { color: colors.textPrimary }]}>{quantity}</Text>
              <Button
                title="+"
                variant="outline"
                onPress={() => setQuantity(quantity + 1)}
                style={styles.qtyButton}
              />
            </View>
          </View>

          {/* Total */}
          <View style={[styles.totalSection, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>TOTAL:</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              {formatCurrency(
                (selectedWeight?.price ?? scannedProduct.salePrice) * quantity
              )}
            </Text>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="🛒 Agregar al Carrito"
            onPress={handleAddToCart}
            icon="🛒"
            style={styles.addButton}
          />
          <Button
            title="📱 Escanear Otro"
            variant="outline"
            onPress={handleRescan}
            icon="📱"
            style={styles.rescanButton}
          />
        </View>
      </ScrollView>
    );
  }

  // Scanner View
  return (
    <View style={styles.scannerContainer}>
      <BarcodeScanner
        onScan={handleBarcodeScanned}
        onClose={() => router.back()}
        isActive={scanActive}
      />

      {/* Manual Input Toggle */}
      <View style={styles.manualInputToggle}>
        <Button
          title="⌨️ Ingresar código manual"
          variant="ghost"
          onPress={() => setShowManualInput(!showManualInput)}
        />
      </View>

      {/* Manual Input */}
      {showManualInput && (
        <View style={[styles.manualInputContainer, { backgroundColor: colors.background }]}>
          <TextInput
            style={[styles.manualInput, { borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Ingresá el código de barras"
            placeholderTextColor={colors.placeholder}
            value={manualBarcode}
            onChangeText={setManualBarcode}
            keyboardType="numeric"
            autoFocus
          />
          <Button
            title="🔍 Buscar"
            onPress={handleManualSearch}
            icon="🔍"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scannerContainer: {
    flex: 1,
  },
  productCard: {
    margin: Spacing.md,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  productEmoji: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 48,
  },
  productInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  productBarcode: {
    fontSize: 12,
    marginTop: 4,
  },
  productCategory: {
    fontSize: 12,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  productDescription: {
    fontSize: 14,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  variantSection: {
    marginTop: Spacing.md,
  },
  variantTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  variantGrid: {
    gap: Spacing.sm,
  },
  variantButton: {
    marginBottom: Spacing.sm,
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  qtyButton: {
    width: 40,
    height: 40,
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'center',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  actions: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  addButton: {
    marginBottom: Spacing.sm,
  },
  rescanButton: {
    marginBottom: Spacing.lg,
  },
  manualInputToggle: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  manualInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    ...Shadows.lg,
  },
  manualInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 18,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
});