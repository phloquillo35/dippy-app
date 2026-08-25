import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { Colors, Spacing } from '@/theme';
import { useBusinessStore } from '@/store/businessStore';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';
import { useCashStore } from '@/store/cashStore';

const TabIcon = ({ emoji, label, badge }: { emoji: string; label: string; badge?: number }) => (
  <View style={styles.tabIcon}>
    <Text style={styles.tabEmoji}>{emoji}</Text>
    {badge !== undefined && badge > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
      </View>
    )}
    <Text style={styles.tabLabel} numberOfLines={1}>{label}</Text>
  </View>
);

export default function KioskoLayout() {
  const router = useRouter();
  const { activeBusiness } = useBusinessStore();
  const itemCount = useCartStore(s => s.getItemCount());
  const currentUser = useUserStore(s => s.currentUser);
  const currentTurn = useUserStore(s => s.currentTurn);
  const cashRegister = useCashStore(s => s.getOpenRegister('kiosko'));

  useEffect(() => {
    if (!activeBusiness) {
      router.replace('/');
    }
  }, [activeBusiness]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.celesteInstitucional,
        tabBarInactiveTintColor: Colors.grisMedio,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerStyle: { backgroundColor: Colors.celesteInstitucional },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
        headerRight: () => (
          <View style={styles.headerRight}>
            {currentTurn && (
              <View style={styles.turnIndicator}>
                <Text style={styles.turnEmoji}>🟢</Text>
                <Text style={styles.turnText}>{currentUser?.name?.split(' ')[0]}</Text>
              </View>
            )}
            {cashRegister && (
              <View style={styles.cashIndicator}>
                <Text style={styles.turnEmoji}>💰</Text>
              </View>
            )}
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          headerTitle: '🏪 Dippy Kiosko',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Inicio" />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Productos',
          headerTitle: '📦 Stock Kiosko',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📦" label="Stock" />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Vender',
          headerTitle: '🛒 Venta Directa',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🛒" label="Vender" badge={itemCount} />,
        }}
      />
      <Tabs.Screen
        name="cash"
        options={{
          title: 'Caja',
          headerTitle: '💰 Caja Kiosko',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💰" label="Caja" />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Equipo',
          headerTitle: '👥 Equipo Kiosko',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👥" label="Equipo" />,
        }}
      />
      <Tabs.Screen
        name="providers"
        options={{
          title: 'Proveed.',
          headerTitle: '🏢 Proveedores',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏢" label="Proveed." />,
        }}
      />
      <Tabs.Screen
        name="stock"
        options={{
          title: 'Ajustar',
          headerTitle: '⚖️ Ajuste de Stock',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚖️" label="Ajustar" />,
        }}
      />
      <Tabs.Screen
        name="switch"
        options={{
          title: 'Cambiar',
          headerTitle: '🔄 Cambiar Negocio',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔄" label="Cambiar" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
  },
  tabBarLabel: { fontSize: 10, fontWeight: '600' },
  tabIcon: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  tabEmoji: { fontSize: 22 },
  tabLabel: { fontSize: 10, marginTop: 2 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -12,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  headerRight: { marginRight: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  turnIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cashIndicator: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  turnEmoji: { fontSize: 10, marginRight: 4 },
  turnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
});
