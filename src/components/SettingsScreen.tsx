import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors, useColorScheme, useTheme } from '@/theme/ThemeProvider';
import { useUserStore } from '@/store/userStore';
import { useBusinessStore } from '@/store/businessStore';

interface Props {
  businessLabel: string;
}

export default function SettingsScreen({ businessLabel }: Props) {
  const colors = useColors();
  const scheme = useColorScheme();
  const { toggleTheme } = useTheme();
  const isDark = scheme === 'dark';

  const { currentUser } = useUserStore();
  const { activeBusiness } = useBusinessStore();
  const isAdmin = currentUser?.role === 'admin';
  const switchRoute = activeBusiness === 'delivery' ? '/(delivery)/switch' : '/(kiosko)/switch';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Ajustes</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{businessLabel}</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Modo oscuro</Text>
            <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>
              {isDark ? 'Activado' : 'Desactivado'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: Colors.celesteInstitucional }}
            thumbColor={Colors.blanco}
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity style={styles.navRow} onPress={() => router.push(switchRoute)}>
          <Image source={require('../../assets/icons/swap.png')} style={[styles.rowIcon, { tintColor: colors.textPrimary }]} />
          <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Cambiar de negocio</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {isAdmin && (
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        )}

        {isAdmin && (
          <TouchableOpacity style={styles.navRow} onPress={() => router.push('/(admin)')}>
            <Image source={require('../../assets/icons/lock.png')} style={[styles.rowIcon, { tintColor: colors.textPrimary }]} />
            <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Panel Admin</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>Información</Text>
        <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>Dippy POS · v1.0</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', padding: Spacing.md, paddingBottom: 0 },
  subtitle: { fontSize: 14, paddingHorizontal: Spacing.md, marginBottom: 12 },
  card: { margin: Spacing.md, padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center' },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowDesc: { fontSize: 13, marginTop: 2 },
  navRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  rowIcon: { width: 22, height: 22, marginRight: 12, resizeMode: 'contain' },
  chevron: { marginLeft: 'auto', fontSize: 22, color: Colors.grisMedio },
  divider: { height: 1, marginVertical: 6 },
});
