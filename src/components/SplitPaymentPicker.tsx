import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
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

  const addedAmount = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = total - addedAmount;

  const addPayment = (method: PaymentMethod) => {
    if (remaining <= 0) {
      Alert.alert('Completo', 'Ya cubriste el total');
      return;
    }
    Alert.alert(
      `Monto en ${METHODS.find(m => m.method === method)?.label}`,
      `Restante: $${remaining.toLocaleString()} (Usá el campo en la pantalla del carrito)`,
    );
  };

  const removePayment = (index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (Math.abs(remaining) > 1) {
      Alert.alert('Error', `Falta asignar $${remaining.toLocaleString()}`);
      return;
    }
    onConfirm(payments);
    setPayments([]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>💳 Pago dividido</Text>
      <Text style={[styles.remaining, { color: remaining > 0 ? Colors.advertencia : Colors.exito }]}>
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

      <View style={styles.methodsRow}>
        {METHODS.map(m => (
          <Text key={m.method} style={[styles.methodChip, { backgroundColor: `${Colors.celesteInstitucional}20`, color: Colors.celesteInstitucional }]} onPress={() => addPayment(m.method)}>
            {m.emoji} {m.label}
          </Text>
        ))}
      </View>

      {payments.length > 0 && Math.abs(remaining) <= 1 && (
        <Text style={[styles.confirmText, { color: Colors.exito }]} onPress={handleConfirm}>
          ✓ Confirmar pago dividido
        </Text>
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
  methodsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  methodChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, fontSize: 12, fontWeight: '600' },
  confirmText: { textAlign: 'center', marginTop: 10, fontWeight: 'bold', fontSize: 15 },
});
