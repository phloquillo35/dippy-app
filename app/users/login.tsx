import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useUserStore } from '@/store/userStore';
import { Button } from '@/components/Button';

export default function UserLoginScreen() {
  const colors = useColors();
  const { users, login } = useUserStore();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const activeUsers = users.filter(u => u.isActive);

  const handleLogin = async () => {
    if (!selectedUserId) return;
    const user = activeUsers.find(u => u.id === selectedUserId);
    if (user) {
      await login(user.email || `${user.id}@dippy.local`, '');
      router.replace('/');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.emoji}>👤</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Seleccionar Trabajador</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Elegi tu usuario para iniciar turno</Text>
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
              <Text style={[styles.userRole, { color: colors.textSecondary }]}>{item.role}</Text>
            </View>
            {selectedUserId === item.id && <Text style={[styles.check, { color: colors.primary }]}>✓</Text>}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />

      <View style={styles.actions}>
        <Button title="Iniciar Sesion" onPress={handleLogin} disabled={!selectedUserId} />
        <Button title="Cancelar" variant="ghost" onPress={() => router.back()} />
      </View>
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
});