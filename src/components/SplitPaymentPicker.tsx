import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { PaymentMethod } from '@/types';

export interface SplitPayment {
  method: PaymentMethod;
  amount: number;
}

interface SplitPaymentPickerProps {
  total: number;
  onConfirm: (payments: SplitPayment[]) => void;
}

const METHODS: { method: PaymentMethod; label: string; emoji: string }[] = [
  { method: 'efectivo', label: 'Efectivo', emoji: '💵' },
  { method: 'tarjeta', label: 'Tarjeta', emoji: '💳' },
  { method: 'transferencia', label: 'Transferencia', emoji: '🏦' },
  { method: 'mercadopago', label: 'MercadoPago', emoji: '📱' },
  { method: 'qr', label: 'QR', emoji: '📷' },
];

export function SplitPaymentPicker({ total, onConfirm }: SplitPaymentPickerProps) {
  const colors = useColors();
  const [payments, setPayments] = useState<SplitPayment[]>([]);
  const [amountInput, setAmountInput] = useState('');

  const addedAmount = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.round((total - addedAmount) * 100) / 100;
  const covered = Math.abs(remaining) <= 1;

  const addPayment = (method: PaymentMethod) => {
    if (remaining <= 0) return;

    const parsed = parseFloat(amountInput.replace(',', '.'));
    const amount = !isNaN(parsed) && parsed > 0 ? Math.min(parsed, remaining) : remaining;

    setPayments(prev => [...prev, { method, amount }]);
    setAmountInput('');
  };

  const removePayment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (!covered || payments.length === 0) return;
    onConfirm(payments);
    setPayments([]);
    setAmountInput('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>💳 Pago dividido</Text>
      <Text style={[styles.remaining, { color: remaining > 1 ? Colors.advertencia : remaining < -1 ? Colors.error : Colors.exito }]}>
        Restante: ${remaining.toLocaleString()}
      </Text>

      {payments.map((p, i) => {
        const cfg = METHODS.find(m => m.method === p.method);
        return (
          <View key={i} style={[styles.paymentRow, { borderColor: colors.border }]}>
            <Text>{cfg?.emoji}</Text>
            <Text style={{ color: colors.textPrimary, flex: 1, marginLeft: 8 }}>{cfg?.label}</Text>
            <Text style={{ color: Colors.exito, fontWeight: 'bold' }}>${p.amount.toLocaleString()}</Text>
            <Text style={styles.removeBtn} onPress={() => removePayment(i)}>✕</Text>
          </View>
        );
      })}

      {!covered && (
        <TextInput
          style={[styles.amountInput, { color: colors.textPrimary, borderColor: colors.border }]}
          placeholder={`Monto (vacío = restante $${remaining.toLocaleString()})`}
          placeholderTextColor={colors.placeholder}
          keyboardType="decimal-pad"
          value={amountInput}
          onChangeText={setAmountInput}
        />
      )}

      <View style={styles.methodsRow}>
        {METHODS.map(m => (
          <TouchableOpacity
            key={m.method}
            style={[styles.methodChip, { backgroundColor: `${Colors.celesteInstitucional}20` }, covered && styles.methodDisabled]}
            onPress={() => addPayment(m.method)}
            disabled={covered}
          >
            <Text style={{ color: Colors.celesteInstitucional, fontSize: 12, fontWeight: '600' }}>
              {m.emoji} {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {covered && payments.length > 0 && (
        <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: Colors.exito }]} onPress={handleConfirm}>
          <Text style={[styles.confirmText, { color: Colors.blanco }]}>✓ Confirmar pago dividido y vender</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: 12 },
  title: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  remaining: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1 },
  removeBtn: { color: Colors.error, fontSize: 16, paddingLeft: 12, fontWeight: 'bold' },
  amountInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, marginTop: 8 },
  methodsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  methodChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  methodDisabled: { opacity: 0.4 },
  confirmBtn: { padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  confirmText: { textAlign: 'center', fontWeight: 'bold', fontSize: 15 },
});
