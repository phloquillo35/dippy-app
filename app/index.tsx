import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useBusinessStore } from '@/store/businessStore';
import { useUserStore } from '@/store/userStore';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';

export default function BusinessSelector() {
  const colors = useColors();
  const router = useRouter();
  const { selectBusiness } = useBusinessStore();
  const { currentUser, logout } = useUserStore();

  if (!currentUser) {
    router.replace('/users/login');
    return null;
  }

  const handleSelect = (business: 'kiosko' | 'delivery') => {
    selectBusiness(business);
    if (business === 'kiosko') {
      router.replace('/(kiosko)');
    } else {
      router.replace('/(delivery)');
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  const canWorkKiosko = currentUser.role === 'admin' || currentUser.businesses?.includes('kiosko');
  const canWorkDelivery = currentUser.role === 'admin' || currentUser.businesses?.includes('delivery');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.logo}>🇦🇷 Dippy</Text>
        <Text style={styles.subtitle}>Tu Negocio</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.userCard}>
          <Text style={styles.userAvatar}>{currentUser.avatar || '👤'}</Text>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>{currentUser.name}</Text>
          <Text style={[styles.userRole, { color: colors.textSecondary }]}>
            {currentUser.role === 'admin' ? 'Administrador' : currentUser.role}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>¿Donde vas a trabajar?</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Elegí el negocio</Text>

        <View style={styles.options}>
          {canWorkKiosko && (
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleSelect('kiosko')}
              activeOpacity={0.7}
            >
              <Text style={styles.optionEmoji}>🏪</Text>
              <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Kiosko</Text>
              <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>Venta de productos, stock, escaneo de barras</Text>
              <View style={[styles.optionBadge, { backgroundColor: `${Colors.exito}20` }]}>
                <Text style={[styles.optionBadgeText, { color: Colors.exito }]}>Día</Text>
              </View>
            </TouchableOpacity>
          )}

          {canWorkDelivery && (
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleSelect('delivery')}
              activeOpacity={0.7}
            >
              <Text style={styles.optionEmoji}>🍕</Text>
              <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Delivery</Text>
              <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>Comida, pedidos, envíos</Text>
              <View style={[styles.optionBadge, { backgroundColor: `${Colors.azulInstitucional}20` }]}>
                <Text style={[styles.optionBadgeText, { color: Colors.azulInstitucional }]}>Noche</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {currentUser.role === 'admin' && (
          <TouchableOpacity
            style={[styles.adminBtn, { borderColor: Colors.negroSuave }]}
            onPress={() => router.push('/(admin)')}
          >
            <Text style={{ fontSize: 16 }}>📊</Text>
            <Text style={[styles.adminBtnText, { color: Colors.negroSuave }]}>Panel Admin</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={[styles.logoutText, { color: colors.textSecondary }]}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.blanco,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.blanco,
    opacity: 0.8,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  userCard: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.lg,
  },
  userAvatar: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userRole: {
    fontSize: 14,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  options: {
    gap: Spacing.md,
  },
  optionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    alignItems: 'center',
  },
  optionEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  optionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  optionDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  optionBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  optionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  adminBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    padding: Spacing.md,
  },
  logoutText: {
    fontSize: 14,
  },
});
