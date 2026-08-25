import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useUserStore } from '@/store/userStore';
import { useCashStore } from '@/store/cashStore';

const SHIFT_LABELS: Record<string, string> = {
  manana: '☀️ Mañana',
  tarde: '🌅 Tarde',
  noche: '🌙 Noche',
};

export default function AdminTeamScreen() {
  const colors = useColors();
  const { users, currentTurn, turnsHistory } = useUserStore();

  const activeUsers = users.filter(u => u.isActive);
  const onlineUserIds = currentTurn ? [currentTurn.userId] : [];
  const todayTurns = turnsHistory.filter(t => {
    const today = new Date().toDateString();
    return new Date(t.startTime).toDateString() === today;
  });

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🟢 Turnos activos hoy</Text>
        {todayTurns.filter(t => t.isActive).length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No hay turnos activos</Text>
          </View>
        ) : (
          todayTurns.filter(t => t.isActive).map(turn => (
            <View key={turn.id} style={[styles.turnCard, { backgroundColor: `${Colors.exito}10`, borderColor: Colors.exito }]}>
              <View style={styles.turnHeader}>
                <Text style={styles.turnEmoji}>🟢</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.turnName, { color: colors.textPrimary }]}>{turn.userName}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{SHIFT_LABELS[turn.shift] || turn.shift}</Text>
                </View>
                <View style={styles.turnStats}>
                  <Text style={{ color: Colors.exito, fontWeight: 'bold' }}>${turn.totalSales.toLocaleString()}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{turn.totalOrders} ventas</Text>
                </View>
              </View>
              <Text style={{ color: '#999', fontSize: 11, marginTop: 4 }}>
                Desde: {new Date(turn.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>👥 Equipo completo</Text>
        {activeUsers.map(user => {
          const isActive = todayTurns.some(t => t.userId === user.id && t.isActive);
          const todayTurn = todayTurns.find(t => t.userId === user.id && t.isActive);
          return (
            <View key={user.id} style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.userHeader}>
                <Text style={styles.userAvatar}>{user.avatar || '👤'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName, { color: colors.textPrimary }]}>{user.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {user.role} · {user.businesses?.join(', ')}
                  </Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: isActive ? Colors.exito : Colors.grisMedio }]} />
              </View>
              {todayTurn && (
                <View style={styles.turnInfo}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {SHIFT_LABELS[todayTurn.shift]} · ${todayTurn.totalSales.toLocaleString()} · {todayTurn.totalOrders} ventas
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { padding: Spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  emptyCard: { padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1 },
  turnCard: { padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: 8, borderWidth: 1 },
  turnHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  turnEmoji: { fontSize: 20 },
  turnName: { fontSize: 15, fontWeight: '600' },
  turnStats: { alignItems: 'flex-end' },
  userCard: { padding: Spacing.md, borderRadius: BorderRadius.lg, marginBottom: 8, borderWidth: 1 },
  userHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userAvatar: { fontSize: 28 },
  userName: { fontSize: 15, fontWeight: '600' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  turnInfo: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
});
