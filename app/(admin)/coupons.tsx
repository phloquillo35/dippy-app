import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useCouponStore, CouponType } from '@/store/couponStore';
import { BusinessType } from '@/types';
import { formatCurrency } from '@/utils/uuid';

const COUPON_TYPES: { key: CouponType; label: string }[] = [
  { key: 'percentage', label: '% Porcentaje' },
  { key: 'fixed', label: '$ Monto fijo' },
];

export default function CouponsScreen() {
  const colors = useColors();
  const { coupons, createCoupon, deactivateCoupon } = useCouponStore();

  const [code, setCode] = useState('');
  const [type, setType] = useState<CouponType>('percentage');
  const [value, setValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [maxUses, setMaxUses] = useState('50');
  const [validUntil, setValidUntil] = useState('');
  const [businesses, setBusinesses] = useState<BusinessType[]>(['kiosko', 'delivery']);

  const toggleBusiness = (b: BusinessType) =>
    setBusinesses(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);

  const handleCreate = () => {
    const numValue = parseFloat(value.replace(',', '.'));
    if (!code.trim()) return Alert.alert('Error', 'Ingresá el código del cupón');
    if (isNaN(numValue) || numValue <= 0) return Alert.alert('Error', 'Ingresá un valor válido');
    if (type === 'percentage' && numValue > 100) return Alert.alert('Error', 'El porcentaje no puede ser mayor a 100');
    if (!validUntil.match(/^\d{4}-\d{2}-\d{2}$/)) return Alert.alert('Error', 'Fecha inválida (formato AAAA-MM-DD)');
    if (new Date(validUntil) < new Date()) return Alert.alert('Error', 'La fecha de vencimiento ya pasó');
    if (businesses.length === 0) return Alert.alert('Error', 'Elegí al menos un negocio');

    createCoupon({
      code: code.trim().toUpperCase(),
      type,
      value: numValue,
      minPurchase: parseFloat(minPurchase) || 0,
      maxUses: parseInt(maxUses) || 1,
      applicableBusinesses: businesses,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil,
    });

    Alert.alert('✅', `Cupón ${code.trim().toUpperCase()} creado`);
    setCode('');
    setValue('');
    setMinPurchase('');
    setMaxUses('50');
    setValidUntil('');
  };

  const inputStyle = [styles.input, { borderColor: colors.border, color: colors.textPrimary }];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.formTitle, { color: colors.textPrimary }]}>➕ Nuevo cupón</Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Código *</Text>
        <TextInput style={inputStyle} placeholder="Ej: BIENVENIDA10" placeholderTextColor={colors.placeholder} autoCapitalize="characters" value={code} onChangeText={setCode} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Tipo</Text>
        <View style={styles.chips}>
          {COUPON_TYPES.map(t => (
            <TouchableOpacity key={t.key} style={[styles.chip, { backgroundColor: type === t.key ? Colors.celesteInstitucional : colors.surfaceVariant }]} onPress={() => setType(t.key)}>
              <Text style={{ color: type === t.key ? colors.textOnPrimary : colors.textPrimary, fontSize: 13 }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>{type === 'percentage' ? 'Porcentaje (%) *' : 'Monto ($) *'}</Text>
        <TextInput style={inputStyle} placeholder={type === 'percentage' ? '10' : '500'} placeholderTextColor={colors.placeholder} keyboardType="decimal-pad" value={value} onChangeText={setValue} />

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Compra mínima ($)</Text>
            <TextInput style={inputStyle} placeholder="0" placeholderTextColor={colors.placeholder} keyboardType="numeric" value={minPurchase} onChangeText={setMinPurchase} />
          </View>
          <View style={styles.half}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Usos máximos</Text>
            <TextInput style={inputStyle} placeholder="50" placeholderTextColor={colors.placeholder} keyboardType="numeric" value={maxUses} onChangeText={setMaxUses} />
          </View>
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Vence el (AAAA-MM-DD) *</Text>
        <TextInput style={inputStyle} placeholder="2026-12-31" placeholderTextColor={colors.placeholder} value={validUntil} onChangeText={setValidUntil} />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Negocios</Text>
        <View style={styles.chips}>
          {(['kiosko', 'delivery'] as BusinessType[]).map(b => (
            <TouchableOpacity key={b} style={[styles.chip, { backgroundColor: businesses.includes(b) ? Colors.exito : colors.surfaceVariant }]} onPress={() => toggleBusiness(b)}>
              <Text style={{ color: businesses.includes(b) ? colors.textOnPrimary : colors.textPrimary, fontSize: 13 }}>
                {b === 'kiosko' ? '🏪 Kiosko' : '🍕 Delivery'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.createBtn, { backgroundColor: Colors.celesteInstitucional }]} onPress={handleCreate}>
          <Text style={{ color: colors.textOnPrimary, fontWeight: 'bold', fontSize: 15 }}>Crear cupón</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🎫 Cupones ({coupons.length})</Text>
      {coupons.length === 0 && (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>Todavía no hay cupones creados</Text>
      )}
      {coupons.map(c => {
        const expired = new Date(c.validUntil) < new Date();
        const exhausted = c.usedCount >= c.maxUses;
        const inactive = !c.isActive || expired || exhausted;
        return (
          <View key={c.id} style={[styles.couponCard, { backgroundColor: colors.card, borderColor: colors.border }, inactive && { opacity: 0.55 }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 16 }}>{c.code}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                {c.type === 'percentage' ? `${c.value}% off` : `${formatCurrency(c.value)} off`} · mín {formatCurrency(c.minPurchase)}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                Usos: {c.usedCount}/{c.maxUses} · Vence: {c.validUntil} · {c.applicableBusinesses.join(', ')}
                {!c.isActive ? ' · INACTIVO' : expired ? ' · VENCIDO' : exhausted ? ' · AGOTADO' : ''}
              </Text>
            </View>
            {c.isActive && (
              <TouchableOpacity style={[styles.deactivateBtn, { borderColor: Colors.error }]} onPress={() => Alert.alert('Desactivar', `¿Desactivar cupón ${c.code}?`, [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Desactivar', style: 'destructive', onPress: () => deactivateCoupon(c.id) },
              ])}>
                <Text style={{ color: Colors.error, fontSize: 12, fontWeight: '600' }}>Desactivar</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  formCard: { margin: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1 },
  formTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  label: { fontSize: 12, marginTop: 8, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  row: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  createBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginHorizontal: Spacing.md, marginBottom: 8 },
  empty: { marginHorizontal: Spacing.md, fontSize: 13 },
  couponCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.md, marginBottom: 8, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1 },
  deactivateBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
});
