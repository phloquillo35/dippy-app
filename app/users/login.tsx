import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useUserStore } from '@/store/userStore';
import { User } from '@/types';
import { Button } from '@/components/Button';

export default function UserLoginScreen() {
  const colors = useColors();
  const { users, login, loginWithPin } = useUserStore();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [pinUser, setPinUser] = useState<User | null>(null);
  const [pinInput, setPinInput] = useState('');
  const activeUsers = users.filter(u => u.isActive);

  const finishLogin = () => router.replace('/');

  const handlePinSubmit = async () => {
    if (!pinUser || !pinInput) return;
    try {
      await loginWithPin(pinUser.id, pinInput);
      setPinUser(null);
      setPinInput('');
      finishLogin();
    } catch (e: any) {
      Alert.alert('Error', e.message);
      setPinInput('');
    }
  };

  const handleLogin = async () => {
    if (!selectedUserId) return;
    const user = activeUsers.find(u => u.id === selectedUserId);
    if (!user) return;

    if (user.pin) {
      setPinInput('');
      setPinUser(user);
    } else {
      await login(user.email || `${user.id}@dippy.local`, '');
      finishLogin();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.emoji}>👤</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Seleccionar Trabajador</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Elegí tu usuario para iniciar turno</Text>
      </View>

      <FlatList
        data={activeUsers}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.userItem, { backgroundColor: selectedUserId === item.id ? `${colors.primary}20` : colors.card, borderColor: selectedUserId === item.id ? colors.primary : colors.border }]}
            onPress={() => setSelectedUserId(item.id)}
          >
            <Text style={styles.userAvatar}>{item.avatar || '👤'}</Text>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>{item.name}</Text>
              <Text style={[styles.userRole, { color: colors.textSecondary }]}>{item.role} · {item.businesses?.join(', ')}</Text>
            </View>
            {selectedUserId === item.id && <Text style={[styles.check, { color: colors.primary }]}>✓</Text>}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />

      <View style={styles.actions}>
        <Button title="Iniciar Sesion" onPress={handleLogin} disabled={!selectedUserId} />
      </View>

      {/* Modal de PIN multiplataforma (Alert.prompt no existe en Android) */}
      <Modal visible={pinUser !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={styles.modalEmoji}>{pinUser?.avatar || '🔐'}</Text>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Ingresar PIN</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              PIN de {pinUser?.name}
              {pinUser?.isLocked ? ' · BLOQUEADO' : ''}
            </Text>
            <TextInput
              style={[styles.pinInput, { color: colors.textPrimary, borderColor: colors.border }]}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={4}
              value={pinInput}
              onChangeText={v => v.replace(/\D/g, '') && setPinInput(v.replace(/\D/g, ''))}
              autoFocus
              onSubmitEditing={handlePinSubmit}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.border }]}
                onPress={() => { setPinUser(null); setPinInput(''); }}
              >
                <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Colors.celesteInstitucional }]} onPress={handlePinSubmit}>
                <Text style={{ color: colors.textOnPrimary, fontWeight: 'bold' }}>Ingresar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', padding: 24 },
  emoji: { fontSize: 64, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  list: { padding: 16 },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 2 },
  userAvatar: { fontSize: 36, marginRight: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600' },
  userRole: { fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  check: { fontSize: 24, fontWeight: 'bold' },
  actions: { padding: 16, gap: 12, paddingBottom: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: Spacing.lg },
  modalContent: { borderRadius: BorderRadius.xl, padding: Spacing.lg, alignItems: 'center' },
  modalEmoji: { fontSize: 40, marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalSubtitle: { fontSize: 13, marginTop: 2, marginBottom: 14 },
  pinInput: { borderWidth: 2, borderRadius: 12, width: 160, textAlign: 'center', fontSize: 28, letterSpacing: 8, paddingVertical: 8 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  modalBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
});
