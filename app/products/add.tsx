import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useProductStore } from '@/store/productStore';
import { Button } from '@/components/Button';
import { ProductCategory } from '@/types';

const CATS: ProductCategory[] = ['limpieza','cocina','comestibles','caramelos','fiambres','gaseosas','panaderia','comida_preparada'];
const CAT_LABELS: Record<string, string> = { limpieza:'Limpieza', cocina:'Cocina', comestibles:'Comestibles', caramelos:'Caramelos', fiambres:'Fiambres', gaseosas:'Gaseosas', panaderia:'Panaderia', comida_preparada:'Comida' };
const CAT_EMOJIS: Record<string, string> = { limpieza:'🧴', cocina:'🍳', comestibles:'🛒', caramelos:'🍬', fiambres:'🥩', gaseosas:'🥤', panaderia:'🥐', comida_preparada:'🍝' };
const EMOJIS = ['📦','🧴','🍳','🛒','🍬','🥩','🥤','🥐','🍝','🧹','🧽','🪣','🧻','🫧'];

export default function AddProductScreen() {
  const { barcode: preBarcode } = useLocalSearchParams<{ barcode?: string }>();
  const colors = useColors();
  const addProduct = useProductStore(s => s.addProduct);

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [barcode, setBarcode] = useState(preBarcode || '');
  const [cat, setCat] = useState<ProductCategory>('comestibles');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('5');
  const [unit, setUnit] = useState<'unidad' | 'kg' | 'g' | 'l' | 'ml'>('unidad');
  const [emoji, setEmoji] = useState('📦');
  const [isWeight, setIsWeight] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);

  const inputStyle = [styles.input, { borderColor: colors.border, color: colors.textPrimary }];

  const save = () => {
    if (!name.trim()) return Alert.alert('Error', 'Nombre obligatorio');
    if (!salePrice) return Alert.alert('Error', 'Precio de venta obligatorio');

    addProduct({
      businessId: 'kiosko',
      name: name.trim(),
      description: desc.trim() || undefined,
      barcode: barcode.trim() || `GEN-${Date.now()}`,
      category: cat,
      costPrice: parseInt(costPrice) || 0,
      salePrice: parseInt(salePrice) || 0,
      stock: parseInt(stock) || 0,
      minStock: parseInt(minStock) || 5,
      unit,
      isWeightBased: isWeight,
      salesChannels: ['store', 'delivery'],
      tags: [cat],
      emoji,
      isActive: true,
    });

    Alert.alert('Producto Agregado', `${name} fue agregado correctamente`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Emoji Picker */}
      <View style={styles.emojiSection}>
        <TouchableOpacity style={[styles.emojiBox, { backgroundColor: colors.surfaceVariant }]} onPress={() => setShowEmojis(!showEmojis)}>
          <Text style={styles.emojiText}>{emoji}</Text>
        </TouchableOpacity>
        {showEmojis && (
          <View style={styles.emojiGrid}>
            {EMOJIS.map(e => (
              <TouchableOpacity key={e} style={[styles.emojiOption, { backgroundColor: emoji === e ? colors.primary : colors.surfaceVariant }]} onPress={() => { setEmoji(e); setShowEmojis(false); }}>
                <Text style={styles.emojiOptionText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>Nombre *</Text>
        <TextInput style={inputStyle} placeholder="Nombre del producto" placeholderTextColor={colors.placeholder} value={name} onChangeText={setName} />

        <Text style={[styles.label, { color: colors.textPrimary }]}>Descripcion</Text>
        <TextInput style={inputStyle} placeholder="Descripcion breve" placeholderTextColor={colors.placeholder} value={desc} onChangeText={setDesc} />

        <Text style={[styles.label, { color: colors.textPrimary }]}>Codigo de Barras</Text>
        <TextInput style={inputStyle} placeholder="EAN-13 o EAN-8" placeholderTextColor={colors.placeholder} value={barcode} onChangeText={setBarcode} keyboardType="numeric" />

        <Text style={[styles.label, { color: colors.textPrimary }]}>Precio Costo ($)</Text>
        <TextInput style={inputStyle} placeholder="0" placeholderTextColor={colors.placeholder} value={costPrice} onChangeText={setCostPrice} keyboardType="numeric" />

        <Text style={[styles.label, { color: colors.textPrimary }]}>Precio Venta ($) *</Text>
        <TextInput style={inputStyle} placeholder="0" placeholderTextColor={colors.placeholder} value={salePrice} onChangeText={setSalePrice} keyboardType="numeric" />

        <Text style={[styles.label, { color: colors.textPrimary }]}>Stock Inicial</Text>
        <TextInput style={inputStyle} placeholder="0" placeholderTextColor={colors.placeholder} value={stock} onChangeText={setStock} keyboardType="numeric" />

        <Text style={[styles.label, { color: colors.textPrimary }]}>Stock Minimo</Text>
        <TextInput style={inputStyle} placeholder="5" placeholderTextColor={colors.placeholder} value={minStock} onChangeText={setMinStock} keyboardType="numeric" />
      </View>

      {/* Category */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Categoria</Text>
        <View style={styles.chips}>
          {CATS.map(c => (
            <TouchableOpacity key={c} style={[styles.chip, { backgroundColor: cat === c ? colors.primary : colors.surfaceVariant }]} onPress={() => setCat(c)}>
              <Text>{CAT_EMOJIS[c]}</Text>
              <Text style={[styles.chipLabel, { color: cat === c ? colors.textOnPrimary : colors.textPrimary }]}>{CAT_LABELS[c]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Unit */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Unidad</Text>
        <View style={styles.chips}>
          {(['unidad','kg','g','l','ml'] as const).map(u => (
            <TouchableOpacity key={u} style={[styles.chip, { backgroundColor: unit === u ? colors.primary : colors.surfaceVariant }]} onPress={() => setUnit(u)}>
              <Text style={[styles.chipLabel, { color: unit === u ? colors.textOnPrimary : colors.textPrimary }]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Weight toggle */}
      <View style={[styles.toggleRow, { marginHorizontal: 16 }]}>
        <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>⚖️ Producto por peso (100g, 200g...)</Text>
        <TouchableOpacity style={[styles.toggle, { backgroundColor: isWeight ? colors.primary : colors.surfaceVariant }]} onPress={() => setIsWeight(!isWeight)}>
          <Text style={[styles.toggleText, { color: colors.textOnPrimary }]}>{isWeight ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <Button title="Guardar Producto" onPress={save} />
        <Button title="Cancelar" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emojiSection: { alignItems: 'center', paddingVertical: 16 },
  emojiBox: { width: 72, height: 72, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  emojiText: { fontSize: 44 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 12 },
  emojiOption: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  emojiOptionText: { fontSize: 24 },
  form: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  section: { padding: 16, paddingTop: 0 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4 },
  chipLabel: { fontSize: 13, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  toggleLabel: { fontSize: 14, fontWeight: '500', flex: 1 },
  toggle: { width: 56, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  toggleText: { fontSize: 12, fontWeight: 'bold' },
  actions: { padding: 16, gap: 12, paddingBottom: 40 },
});