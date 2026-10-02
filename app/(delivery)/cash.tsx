import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useCashStore } from '@/store/cashStore';
import { getCashBalance, getCashSales } from '@/utils/cash';
import { useUserStore } from '@/store/userStore';
import { PaymentMethod } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/uuid';

const BUSINESS_ID = 'delivery' as const;

const MOVEMENT_TYPES: Array<{ key: string; label: string; emoji: string }> = [
  { key: 'withdrawal', label: 'Retiro', emoji: '💸' },
  { key: 'expense', label: 'Gasto', emoji: '📝' },
  { key: 'deposit', label: 'Depósito', emoji: '💰' },
  { key: 'sale', label: 'Venta', emoji: '🛒' },
];

const PAYMENT_METHODS: Array<{ key: PaymentMethod; label: string; emoji: string }> = [
  { key: 'efectivo', label: 'Efectivo', emoji: '💵' },
  { key: 'transferencia', label: 'Transferencia', emoji: '🏦' },
  { key: 'tarjeta', label: 'Tarjeta', emoji: '💳' },
  { key: 'mercadopago', label: 'MercadoPago', emoji: '📱' },
];

export default function DeliveryCashScreen() {
  const colors = useColors();
  const { currentUser } = useUserStore();
  const register = useCashStore(s => s.getOpenRegister(BUSINESS_ID));
  const report = useCashStore(s => s.getBusinessReport(BUSINESS_ID, new Date().toISOString().split('T')[0]));
  const openRegister = useCashStore(s => s.openRegister);
  const closeRegister = useCashStore(s => s.closeRegister);
  const addMovement = useCashStore(s => s.addMovement);

  const [showNewMovement, setShowNewMovement] = useState(false);
  const [initialAmount, setInitialAmount] = useState('');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementDesc, setMovementDesc] = useState('');
  const [movementType, setMovementType] = useState('withdrawal');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [closingAmount, setClosingAmount] = useState('');

  const totalSales = getCashSales(report);
  const balance = getCashBalance(report);

  const handleOpenRegister = () => {
    const amount = parseFloat(initialAmount);
    if (isNaN(amount) || amount < 0) return Alert.alert('Error', 'Ingresá un monto válido');
    if (!currentUser) return;
    openRegister(BUSINESS_ID, amount, currentUser.id, currentUser.name);
    setInitialAmount('');
    Alert.alert('✅', 'Caja abierta');
  };

  const handleCloseRegister = () => {
    if (!register || !report) return;
    const amount = parseFloat(closingAmount);
    if (isNaN(amount)) return Alert.alert('Error', 'Ingresá el monto final');

    const ingresos = report.cashIn + report.transfersIn + report.cardIn + report.mercadopagoIn;
    const egresos = report.cashOut;
    const esperado = report.openingAmount + ingresos - egresos;
    const diferencia = amount - esperado;

    closeRegister(register.id, amount, currentUser?.id || '', currentUser?.name || '');

    Alert.alert(
      'Caja Cerrada',
      `Apertura: ${formatCurrency(report.openingAmount)}\n` +
      `Ingresos: ${formatCurrency(ingresos)}\n` +
      `Egresos: ${formatCurrency(egresos)}\n` +
      `Esperado: ${formatCurrency(esperado)}\n` +
      `Contado: ${formatCurrency(amount)}\n` +
      `Diferencia: ${diferencia >= 0 ? '+' : ''}${formatCurrency(diferencia)}`,
      [{ text: 'Entendido' }]
    );
  };

  const handleReopenRegister = () => {
    if (!currentUser) return;
    openRegister(BUSINESS_ID, report?.openingAmount ?? 0, currentUser.id, currentUser.name);
    Alert.alert('✅', 'Caja reabierta');
  };

  const handleAddMovement = () => {
    const amount = parseFloat(movementAmount);
    if (isNaN(amount) || amount <= 0) return Alert.alert('Error', 'Monto inválido');
    if (!register || !currentUser) return;
    addMovement(register.id, {
      type: movementType as any,
      amount,
      description: movementDesc,
      paymentMethod,
      userId: currentUser.id,
      userName: currentUser.name,
    });
    setMovementAmount('');
    setMovementDesc('');
    setShowNewMovement(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {!register ? (
        report && report.status === 'closed' ? (
          <View style={styles.openSection}>
            <Text style={styles.openEmoji}>🔒</Text>
            <Text style={[styles.openTitle, { color: colors.textPrimary }]}>Caja cerrada hoy</Text>
            <Text style={[styles.openDesc, { color: colors.textSecondary }]}>
              Esperado: {formatCurrency(
                report.openingAmount +
                report.cashIn + report.transfersIn + report.cardIn + report.mercadopagoIn -
                report.cashOut
              )}
            </Text>
            <TouchableOpacity style={[styles.openBtn, { backgroundColor: Colors.exito }]} onPress={handleReopenRegister}>
              <Text style={styles.openBtnText}>Reabrir caja</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.openSection}>
            <Text style={styles.openEmoji}>💰</Text>
            <Text style={[styles.openTitle, { color: colors.textPrimary }]}>Abrir caja - Delivery</Text>
            <Text style={[styles.openDesc, { color: colors.textSecondary }]}>Monto inicial</Text>
            <TextInput style={[styles.amountInput, { color: colors.textPrimary, borderColor: colors.border }]} placeholder="$ 0" placeholderTextColor={colors.textSecondary} keyboardType="numeric" value={initialAmount} onChangeText={setInitialAmount} />
            <TouchableOpacity style={[styles.openBtn, { backgroundColor: Colors.azulInstitucional }]} onPress={handleOpenRegister}>
              <Text style={styles.openBtnText}>Abrir caja</Text>
            </TouchableOpacity>
          </View>
        )
      ) : (
        <>
          <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusEmoji}>🟢</Text>
              <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>Caja Abierta</Text>
            </View>
            <Text style={[styles.amount, { color: Colors.exito }]}>Saldo: ${balance.toLocaleString()}</Text>
            <Text style={[styles.amount, { color: colors.textSecondary }]}>Inicial: ${report?.openingAmount.toLocaleString()}</Text>
          </View>

          {report && (
            <View style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.reportTitle, { color: colors.textPrimary }]}>📊 Resumen</Text>
              <View style={styles.reportRow}>
                <Text style={{ color: colors.textSecondary }}>Ventas</Text>
                <Text style={{ color: Colors.exito, fontWeight: 'bold' }}>${totalSales.toLocaleString()}</Text>
              </View>
              <View style={styles.reportRow}>
                <Text style={{ color: colors.textSecondary }}>Gastos</Text>
                <Text style={{ color: Colors.error, fontWeight: 'bold' }}>${report.cashOut.toLocaleString()}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={[styles.newMovementBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setShowNewMovement(!showNewMovement)}>
            <Text style={{ fontSize: 18, marginRight: 8 }}>➕</Text>
            <Text style={[styles.newMovementText, { color: colors.textPrimary }]}>Nuevo movimiento</Text>
          </TouchableOpacity>

          {showNewMovement && (
            <View style={[styles.movementForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Tipo</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
                {MOVEMENT_TYPES.map(t => (
                  <TouchableOpacity key={t.key} style={[styles.typePill, movementType === t.key && { backgroundColor: Colors.azulInstitucional }]} onPress={() => setMovementType(t.key)}>
                    <Text style={styles.typeEmoji}>{t.emoji}</Text>
                    <Text style={[styles.typeLabel, movementType === t.key && { color: colors.textOnPrimary }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Monto</Text>
              <TextInput style={[styles.amountInput2, { color: colors.textPrimary, borderColor: colors.border }]} placeholder="$ 0" placeholderTextColor={colors.textSecondary} keyboardType="numeric" value={movementAmount} onChangeText={setMovementAmount} />
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Descripción</Text>
              <TextInput style={[styles.descInput, { color: colors.textPrimary, borderColor: colors.border }]} placeholder="..." placeholderTextColor={colors.textSecondary} value={movementDesc} onChangeText={setMovementDesc} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
                {PAYMENT_METHODS.map(p => (
                  <TouchableOpacity key={p.key} style={[styles.typePill, paymentMethod === p.key && { backgroundColor: Colors.azulInstitucional }]} onPress={() => setPaymentMethod(p.key)}>
                    <Text style={styles.typeEmoji}>{p.emoji}</Text>
                    <Text style={[styles.typeLabel, paymentMethod === p.key && { color: colors.textOnPrimary }]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: Colors.exito }]} onPress={handleAddMovement}>
                <Text style={styles.addBtnText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          )}

          {report?.movements && report.movements.length > 0 && (
            <View style={styles.movementsSection}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Movimientos</Text>
              {report.movements.map((m: any, i: number) => (
                <View key={i} style={[styles.movementRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={{ fontSize: 20 }}>{MOVEMENT_TYPES.find(t => t.key === m.type)?.emoji || '📝'}</Text>
                  <View style={styles.movementInfo}>
                    <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{m.description}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{m.userName} · {formatDateTime(m.createdAt)}</Text>
                  </View>
                  <Text style={{ color: m.type === 'sale' || m.type === 'deposit' ? Colors.exito : Colors.error, fontWeight: 'bold' }}>
                    {m.type === 'sale' || m.type === 'deposit' ? '+' : ''}{formatCurrency(m.amount)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.closingSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Cerrar caja</Text>
            <TextInput style={[styles.amountInput2, { color: colors.textPrimary, borderColor: colors.border }]} placeholder="Monto final en caja" placeholderTextColor={colors.textSecondary} keyboardType="numeric" value={closingAmount} onChangeText={setClosingAmount} />
            <TouchableOpacity style={[styles.closeBtn, { borderColor: Colors.error }]} onPress={handleCloseRegister}>
              <Text style={styles.closeBtnText}>Cerrar caja</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  openSection: { alignItems: 'center', padding: 40 },
  openEmoji: { fontSize: 64, marginBottom: 16 },
  openTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  openDesc: { fontSize: 14, marginBottom: 12 },
  amountInput: { width: 200, height: 50, borderWidth: 2, borderRadius: 12, textAlign: 'center', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  openBtn: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  openBtnText: { color: Colors.blanco, fontSize: 16, fontWeight: 'bold' },
  statusCard: { margin: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.xl, borderWidth: 2 },
  statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusEmoji: { fontSize: 24, marginRight: 8 },
  statusTitle: { fontSize: 20, fontWeight: 'bold' },
  amount: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  reportCard: { margin: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1 },
  reportTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  reportRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  newMovementBtn: { flexDirection: 'row', alignItems: 'center', margin: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1 },
  newMovementText: { fontSize: 16, fontWeight: '600' },
  movementForm: { margin: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1 },
  formTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  formLabel: { fontSize: 13, marginBottom: 4, marginTop: 8 },
  typeRow: { flexDirection: 'row', marginBottom: 8 },
  typePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.grisClaro, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  typeEmoji: { fontSize: 16, marginRight: 4 },
  typeLabel: { fontSize: 13 },
  amountInput2: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 4 },
  descInput: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8, fontSize: 15 },
  addBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  addBtnText: { color: Colors.blanco, fontWeight: 'bold' },
  movementsSection: { padding: Spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  movementRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: 8, borderWidth: 1 },
  movementInfo: { flex: 1, marginLeft: 12 },
  closingSection: { margin: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1 },
  closeBtn: { marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 2, alignItems: 'center' },
  closeBtnText: { color: Colors.error, fontWeight: 'bold', fontSize: 16 },
});
