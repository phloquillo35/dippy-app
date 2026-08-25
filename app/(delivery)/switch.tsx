import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useBusinessStore } from '@/store/businessStore';
import { useUserStore } from '@/store/userStore';
import { useColors } from '@/theme/ThemeProvider';

export default function SwitchScreenDelivery() {
  const colors = useColors();
  const router = useRouter();
  const { clearBusiness } = useBusinessStore();
  const { logout } = useUserStore();

  const handleSwitch = () => {
    clearBusiness();
    router.replace('/');
  };

  const handleLogout = () => {
    clearBusiness();
    logout();
    router.replace('/');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.emoji}>🔄</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Cambiar de negocio</Text>
      <Text style={[styles.desc, { color: colors.textSecondary }]}>
        Volvé al selector para elegir otro negocio
      </Text>

      <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#0096DC' }]} onPress={handleSwitch}>
        <Text style={styles.primaryBtnText}>Cambiar negocio</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={handleLogout}>
        <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  desc: { fontSize: 14, textAlign: 'center', marginBottom: 32 },
  primaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: { padding: 12 },
  secondaryBtnText: { fontSize: 14 },
});
