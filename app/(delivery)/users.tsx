import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useUserStore } from '@/store/userStore';
import { formatDateTime } from '@/utils/uuid';
import { TurnShift } from '@/types';

const BUSINESS_ID = 'delivery' as const;

const SHIFT_LABELS: Record<string, string> = {
  manana: '☀️ Mañana',
  tarde: '🌅 Tarde',
  noche: '🌙 Noche',
};

export default function DeliveryUsersScreen() {
  const colors = useColors();
  const { currentUser, currentTurn, users, turnsHistory, startTurn, endTurn, getUsers } = useUserStore();
  const activeUsers = getUsers().filter(u => u.businesses?.includes(BUSINESS_ID));
  const recentTurns = turnsHistory.filter(t => t.businessId === BUSINESS_ID).slice(0, 5);

  const handleStartTurn = (shift: TurnShift) => {
    if (!currentUser) return Alert.alert('Error', 'Iniciá sesión primero');
    try {
      startTurn(BUSINESS_ID, shift);
      Alert.alert('✅', `Turno ${SHIFT_LABELS[shift]} iniciado`);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  const handleEndTurn = () => {
    Alert.alert('Finalizar turno', '¿Seguro que querés cerrar tu turno actual?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar turno',
        style: 'destructive',
        onPress: () => {
          const completed = endTurn();
          if (completed) {
            Alert.alert('Turno cerrado', `Ventas: $${completed.totalSales.toLocaleString()}\nTicket promedio: $${completed.averageTicket.toLocaleString()}`);
          }
        },
      },
    ]);
  };

  return (
    <FlatList
      style={[styles.container, { backgroundColor: colors.background }]}
      data={activeUsers}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <>
          <View style={[styles.currentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>👤 Turno actual</Text>
            {currentUser ? (
              <>
                <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 18 }}>{currentUser.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{currentUser.role}</Text>
                {currentTurn ? (
                  <View>
                    <View style={styles.turnStatus}>
                      <Text style={{ color: Colors.exito, fontWeight: 'bold' }}>🟢 Activo</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{SHIFT_LABELS[currentTurn.shift] || currentTurn.shift}</Text>
                    </View>
                    <View style={styles.turnStats}>
                      <Text style={{ color: Colors.exito, fontSize: 13 }}>💰 ${currentTurn.totalSales.toLocaleString()}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>📦 {currentTurn.totalOrders} ventas</Text>
                    </View>
                    <TouchableOpacity style={[styles.endTurnBtn, { backgroundColor: Colors.error }]} onPress={handleEndTurn}>
                      <Text style={styles.turnBtnText}>⏹ Finalizar turno</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.turnBtns}>
                    <TouchableOpacity style={[styles.turnBtn, { backgroundColor: Colors.exito }]} onPress={() => handleStartTurn('manana')}>
                      <Text style={styles.turnBtnText}>🌅 Mañana</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.turnBtn, { backgroundColor: Colors.azulInstitucional }]} onPress={() => handleStartTurn('tarde')}>
                      <Text style={styles.turnBtnText}>🌆 Tarde</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.turnBtn, { backgroundColor: Colors.negroSuave }]} onPress={() => handleStartTurn('noche')}>
                      <Text style={styles.turnBtnText}>🌙 Noche</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <Text style={{ color: colors.textSecondary }}>Sin sesión</Text>
            )}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Equipo Delivery</Text>
        </>
      }
      renderItem={({ item }) => (
        <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ fontSize: 32 }}>{item.avatar}</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{item.name}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{item.role} · {item.businesses?.join(', ')}</Text>
          </View>
        </View>
      )}
      ListFooterComponent={
        recentTurns.length > 0 ? (
          <View style={styles.footer}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Últimos turnos</Text>
            {recentTurns.map((t, i) => (
              <View key={i} style={[styles.turnCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.turnHeader}>
                  <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>{t.userName}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{SHIFT_LABELS[t.shift] || t.shift}</Text>
                </View>
                <View style={styles.turnStats}>
                  <Text style={{ color: Colors.exito }}>💰 ${(t.totalSales || 0).toLocaleString()}</Text>
                  <Text style={{ color: colors.textSecondary }}>📦 {t.totalOrders || 0} pedidos</Text>
                  <Text style={{ color: colors.placeholder, fontSize: 11 }}>{formatDateTime(t.startTime)}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: Spacing.md },
  currentCard: { padding: Spacing.lg, borderRadius: BorderRadius.xl, borderWidth: 2, marginBottom: Spacing.xl },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  turnStatus: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  turnBtns: { flexDirection: 'row', gap: 6, marginTop: 12 },
  turnBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  endTurnBtn: { marginTop: 12, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  turnBtnText: { color: Colors.blanco, fontWeight: 'bold', fontSize: 13 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: 8, borderWidth: 1 },
  footer: { marginTop: Spacing.xl },
  turnCard: { padding: Spacing.md, borderRadius: BorderRadius.md, marginBottom: 8, borderWidth: 1 },
  turnHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  turnStats: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
});
