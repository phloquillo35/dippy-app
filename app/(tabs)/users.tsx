import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '@/theme';
import { useColors, useShadow } from '@/theme/ThemeProvider';
import { useUserStore } from '@/store/userStore';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { formatCurrency, formatDateTime } from '@/utils/uuid';
import { TurnShift } from '@/types';

export default function UsersScreen() {
  const colors = useColors();
  const {
    currentUser,
    users,
    currentTurn,
    turnsHistory,
    startTurn,
    endTurn,
    login,
    logout,
    getUsers,
  } = useUserStore();

  const [showLogin, setShowLogin] = useState(false);

  const activeUsers = getUsers();
  const recentTurns = turnsHistory.slice(0, 5);

  const handleStartTurn = (shift: TurnShift) => {
    if (!currentUser) {
      Alert.alert('Error', 'Primero iniciá sesión');
      return;
    }

    try {
      startTurn('kiosko', shift);
      Alert.alert('✅ Turno Iniciado', `Turno de ${shift} comenzado`);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleEndTurn = () => {
    Alert.alert(
      'Cerrar Turno',
      '¿Estás seguro de cerrar el turno actual?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar',
          style: 'destructive',
          onPress: () => {
            const completedTurn = endTurn();
            if (completedTurn) {
              Alert.alert(
                '📊 Turno Cerrado',
                `Total: ${formatCurrency(completedTurn.totalSales)}\n` +
                `Pedidos: ${completedTurn.totalOrders}\n` +
                `Promedio: ${formatCurrency(completedTurn.averageTicket)}`
              );
            }
          },
        },
      ]
    );
  };

  const handleUserLogin = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      await login(user.email || `${user.id}@dippy.local`, '');
      setShowLogin(false);
      Alert.alert('✅ Sesión Iniciada', `Bienvenido, ${user.name}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Current User / Turn */}
      {currentUser ? (
        <View style={[styles.userCard, { backgroundColor: colors.primary }]}>
          <View style={styles.userInfo}>
            <Text style={styles.userAvatar}>{currentUser.avatar || '👤'}</Text>
            <View>
              <Text style={styles.userName}>{currentUser.name}</Text>
              <Text style={styles.userRole}>{currentUser.role.toUpperCase()}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.loginPrompt, { backgroundColor: colors.card, ...Shadows.sm }]}>
          <Text style={[styles.loginPromptTitle, { color: colors.textPrimary }]}>
            👤 Seleccionar Trabajador
          </Text>
          <Text style={[styles.loginPromptSubtitle, { color: colors.textSecondary }]}>
            Elegí tu usuario para iniciar turno
          </Text>
          <Button
            title="Iniciar Sesión"
            onPress={() => setShowLogin(true)}
            icon="🔑"
          />
        </View>
      )}

      {/* Current Turn */}
      {currentTurn && (
        <Card variant="elevated" padding="lg" style={styles.turnCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            🟢 Turno Activo
          </Text>
          <View style={styles.turnInfo}>
            <View style={styles.turnStat}>
              <Text style={[styles.turnStatValue, { color: colors.primary }]}>
                {formatCurrency(currentTurn.totalSales)}
              </Text>
              <Text style={[styles.turnStatLabel, { color: colors.textSecondary }]}>Vendido</Text>
            </View>
            <View style={styles.turnStat}>
              <Text style={[styles.turnStatValue, { color: colors.primary }]}>
                {currentTurn.totalOrders}
              </Text>
              <Text style={[styles.turnStatLabel, { color: colors.textSecondary }]}>Pedidos</Text>
            </View>
            <View style={styles.turnStat}>
              <Text style={[styles.turnStatValue, { color: colors.primary }]}>
                {formatCurrency(currentTurn.averageTicket)}
              </Text>
              <Text style={[styles.turnStatLabel, { color: colors.textSecondary }]}>Ticket Prom.</Text>
            </View>
          </View>
          <Button
            title="Finalizar Turno"
            variant="danger"
            onPress={handleEndTurn}
            icon="🔴"
            style={styles.endTurnButton}
          />
        </Card>
      )}

      {/* Start Turn Buttons */}
      {!currentTurn && currentUser && (
        <View style={styles.startTurnSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            ⏰ Iniciar Turno
          </Text>
          <View style={styles.shiftButtons}>
            <Button
              title="☀️ Mañana"
              variant="outline"
              onPress={() => handleStartTurn('manana')}
              style={styles.shiftButton}
            />
            <Button
              title="🌤️ Tarde"
              variant="outline"
              onPress={() => handleStartTurn('tarde')}
              style={styles.shiftButton}
            />
            <Button
              title="🌙 Noche"
              variant="outline"
              onPress={() => handleStartTurn('noche')}
              style={styles.shiftButton}
            />
          </View>
        </View>
      )}

      {/* Users List */}
      <View style={styles.usersSection}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          👥 Equipo ({activeUsers.length})
        </Text>
        <FlatList
          data={activeUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card
              variant="default"
              padding="md"
              style={styles.userItem}
              onPress={() => handleUserLogin(item.id)}
            >
              <View style={styles.userItemContent}>
                <Text style={styles.userItemAvatar}>{item.avatar || '👤'}</Text>
                <View style={styles.userItemInfo}>
                  <Text style={[styles.userItemName, { color: colors.textPrimary }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.userItemRole, { color: colors.textSecondary }]}>
                    {item.role}
                  </Text>
                </View>
                {item.id === currentUser?.id && (
                  <View style={[styles.activeBadge, { backgroundColor: `${Colors.exito}20` }]}>
                    <Text style={[styles.activeBadgeText, { color: Colors.exito }]}>● Activo</Text>
                  </View>
                )}
              </View>
            </Card>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Recent Turns */}
      {recentTurns.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            📊 Últimos Turnos
          </Text>
          {recentTurns.map((turn) => (
            <Card key={turn.id} variant="outlined" padding="sm" style={styles.turnHistoryItem}>
              <View style={styles.turnHistoryContent}>
                <View>
                  <Text style={[styles.turnHistoryName, { color: colors.textPrimary }]}>
                    {turn.userName}
                  </Text>
                  <Text style={[styles.turnHistoryDate, { color: colors.textSecondary }]}>
                    {formatDateTime(turn.startTime)}
                  </Text>
                </View>
                <View style={styles.turnHistoryStats}>
                  <Text style={[styles.turnHistorySales, { color: colors.primary }]}>
                    {formatCurrency(turn.totalSales)}
                  </Text>
                  <Text style={[styles.turnHistoryOrders, { color: colors.textSecondary }]}>
                    {turn.totalOrders} pedidos
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Login Modal */}
      {showLogin && (
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              👤 Seleccionar Usuario
            </Text>
            <FlatList
              data={activeUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalUserItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleUserLogin(item.id)}
                >
                  <Text style={styles.modalUserAvatar}>{item.avatar || '👤'}</Text>
                  <View>
                    <Text style={[styles.modalUserName, { color: colors.textPrimary }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.modalUserRole, { color: colors.textSecondary }]}>
                      {item.role}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
            <Button
              title="Cancelar"
              variant="ghost"
              onPress={() => setShowLogin(false)}
              style={styles.cancelButton}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    fontSize: 40,
    marginRight: Spacing.md,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userRole: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loginPrompt: {
    margin: Spacing.md,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  loginPromptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  loginPromptSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  turnCard: {
    margin: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  turnInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  turnStat: {
    alignItems: 'center',
  },
  turnStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  turnStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  endTurnButton: {
    marginTop: Spacing.sm,
  },
  startTurnSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  shiftButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  shiftButton: {
    flex: 1,
  },
  usersSection: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  userItem: {
    marginBottom: Spacing.sm,
  },
  userItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userItemAvatar: {
    fontSize: 36,
    marginRight: Spacing.md,
  },
  userItemInfo: {
    flex: 1,
  },
  userItemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userItemRole: {
    fontSize: 12,
    marginTop: 2,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recentSection: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  turnHistoryItem: {
    marginBottom: Spacing.sm,
  },
  turnHistoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  turnHistoryName: {
    fontSize: 14,
    fontWeight: '600',
  },
  turnHistoryDate: {
    fontSize: 12,
    marginTop: 2,
  },
  turnHistoryStats: {
    alignItems: 'flex-end',
  },
  turnHistorySales: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  turnHistoryOrders: {
    fontSize: 12,
    marginTop: 2,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  modalUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalUserAvatar: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalUserRole: {
    fontSize: 12,
    marginTop: 2,
  },
  cancelButton: {
    marginTop: Spacing.md,
  },
});