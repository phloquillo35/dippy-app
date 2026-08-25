import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { Colors, Spacing } from '@/theme';
import { useBusinessStore } from '@/store/businessStore';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';
import { useCashStore } from '@/store/cashStore';

const ICON_EMOJI: Record<string, string> = {
  home: '🏠', cube: '📦', cart: '🛒', cash: '💰', people: '👥',
  business: '🏢', scale: '⚖️', 'swap-horizontal': '🔄',
};

const TabIcon = ({ icon, badge, color }: { icon: any; badge?: number; color: string }) => (
  <View style={styles.tabIcon}>
    <Text style={[styles.tabEmoji, { color }]}>{ICON_EMOJI[icon] || '•'}</Text>
    {badge !== undefined && badge > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
      </View>
    )}
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
    if (!activeBusiness || activeBusiness !== 'kiosko') {
      router.replace('/');
    }
  }, [activeBusiness]);

  useEffect(() => {
    if (currentUser && !currentUser.businesses?.includes('kiosko') && currentUser.role !== 'admin') {
      router.replace('/');
    }
  }, [currentUser]);

  if (!currentUser || (!currentUser.businesses?.includes('kiosko') && currentUser.role !== 'admin')) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.celesteInstitucional,
        tabBarInactiveTintColor: Colors.grisMedio,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerStyle: { backgroundColor: Colors.celesteInstitucional },
        headerTintColor: Colors.blanco,
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
          tabBarIcon: ({ focused, color }) => <TabIcon icon="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Almacén',
          headerTitle: '📦 Stock Kiosko',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="cube" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Vender',
          headerTitle: '🛒 Venta Directa',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="cart" color={color} badge={itemCount} />,
        }}
      />
      <Tabs.Screen
        name="cash"
        options={{
          title: 'Caja',
          headerTitle: '💰 Caja Kiosko',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="cash" color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          href: null,
          title: 'Equipo',
          headerTitle: '👥 Equipo Kiosko',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="people" color={color} />,
        }}
      />
      <Tabs.Screen
        name="providers"
        options={{
          href: null,
          title: 'Proveed.',
          headerTitle: '🏢 Proveedores',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="business" color={color} />,
        }}
      />
      <Tabs.Screen
        name="stock"
        options={{
          href: null,
          title: 'Ajustar',
          headerTitle: '⚖️ Ajuste de Stock',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="scale" color={color} />,
        }}
      />
      <Tabs.Screen
        name="switch"
        options={{
          title: 'Cambiar',
          headerTitle: '🔄 Cambiar Negocio',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="swap-horizontal" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.blanco,
    borderTopWidth: 1,
    borderTopColor: Colors.grisClaro,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
  },
  tabBarLabel: { fontSize: 10, fontWeight: '600' },
  tabIcon: { alignItems: 'center', justifyContent: 'center', position: 'relative', width: 28 },
  tabEmoji: { fontSize: 22 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: Colors.blanco, fontSize: 10, fontWeight: 'bold' },
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
  turnText: { color: Colors.blanco, fontSize: 12, fontWeight: '600' },
});
