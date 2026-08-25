import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useProductStore } from '@/store/productStore';
import { ProductCategory, BusinessType } from '@/types';

const BUSINESS_ID: BusinessType = 'delivery';
const CATS: ProductCategory[] = ['comida_preparada', 'gaseosas'];
const CAT_LABELS: Record<string, string> = { comida_preparada:'Comida preparada', gaseosas:'Bebidas' };
const CAT_EMOJIS: Record<string, string> = { comida_preparada:'🍝', gaseosas:'🥤' };
const EMOJIS = ['🍝','🍕','🥪','🥟','🍟','🥗','🍲','🥤','🍺','☕'];

export default function AddDeliveryProductScreen() {
  const colors = useColors();
  const addProduct = useProductStore(s => s.addProduct);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState<ProductCategory>('comida_preparada');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('30');
  const [minStock, setMinStock] = useState('10');
  const [emoji, setEmoji] = useState('🍝');
  const [showEmojis, setShowEmojis] = useState(false);

  const inputStyle = [styles.input, { borderColor: colors.border, color: colors.textPrimary }];

  const save = () => {
    if (!name.trim()) return Alert.alert('Error', 'Nombre obligatorio');
    if (!salePrice) return Alert.alert('Error', 'Precio de venta obligatorio');

    addProduct({
      businessId: BUSINESS_ID,
      name: name.trim(),
      description: desc.trim() || undefined,
      barcode: `DLV-${Date.now()}`,
      category: cat,
      costPrice: parseInt(costPrice) || 0,
      salePrice: parseInt(salePrice) || 0,
      stock: parseInt(stock) || 0,
      minStock: parseInt(minStock) || 10,
      unit: 'unidad',
      isWeightBased: false,
      salesChannels: ['delivery'],
      tags: [cat],
      emoji,
      isActive: true,
    } as any);

    Alert.alert('✅', `${name} agregado al menú`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.emojiSection}>
        <TouchableOpacity style={[styles.emojiBox, { backgroundColor: colors.card }]} onPress={() => setShowEmojis(!showEmojis)}>
          <Text style={styles.emojiText}>{emoji}</Text>
        </TouchableOpacity>
        {showEmojis && (
          <View style={styles.emojiGrid}>
            {EMOJIS.map(e => (
              <TouchableOpacity key={e} style={[styles.emojiOption, { backgroundColor: emoji === e ? Colors.azulInstitucional : colors.card }]} onPress={() => { setEmoji(e); setShowEmojis(false); }}>
                <Text style={styles.emojiOptionText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Nombre *</Text>
        <TextInput style={inputStyle} placeholder="Ej: Milanesa Napolitana" placeholderTextColor={colors.textSecondary} value={name} onChangeText={setName} />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Descripción</Text>
        <TextInput style={inputStyle} placeholder="Descripción del plato" placeholderTextColor={colors.textSecondary} value={desc} onChangeText={setDesc} />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Precio costo ($)</Text>
        <TextInput style={inputStyle} placeholder="0" placeholderTextColor={colors.textSecondary} value={costPrice} onChangeText={setCostPrice} keyboardType="numeric" />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Precio venta ($) *</Text>
        <TextInput style={inputStyle} placeholder="0" placeholderTextColor={colors.textSecondary} value={salePrice} onChangeText={setSalePrice} keyboardType="numeric" />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Stock disponible</Text>
        <TextInput style={inputStyle} placeholder="30" placeholderTextColor={colors.textSecondary} value={stock} onChangeText={setStock} keyboardType="numeric" />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Categoría</Text>
        <View style={styles.chips}>
          {CATS.map(c => (
            <TouchableOpacity key={c} style={[styles.chip, { backgroundColor: cat === c ? Colors.azulInstitucional : colors.card }]} onPress={() => setCat(c)}>
              <Text>{CAT_EMOJIS[c]}</Text>
              <Text style={[styles.chipLabel, { color: cat === c ? '#FFF' : colors.textPrimary }]}>{CAT_LABELS[c]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.azulInstitucional }]} onPress={save}>
          <Text style={styles.saveBtnText}>Agregar al menú</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={{ color: colors.textSecondary }}>Cancelar</Text>
        </TouchableOpacity>
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
  label: { fontSize: 13, fontWeight: '600', marginBottom: 4, marginTop: 10 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  section: { padding: 16, paddingTop: 0 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4 },
  chipLabel: { fontSize: 13, fontWeight: '600' },
  actions: { padding: 16, gap: 12, paddingBottom: 40 },
  saveBtn: { padding: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { padding: 14, alignItems: 'center' },
});
