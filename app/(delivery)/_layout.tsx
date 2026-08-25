import { Tabs, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View, Image, StyleSheet, Platform } from 'react-native';
import { Colors, Spacing } from '@/theme';
import { useBusinessStore } from '@/store/businessStore';
import { useOrderStore } from '@/store/orderStore';
import { useUserStore } from '@/store/userStore';
import { useCashStore } from '@/store/cashStore';
import { useDeliveryCartStore } from '@/store/deliveryCartStore';

const ICON_PNG: Record<string, any> = {
  home: require('../../assets/icons/home.png'),
  'fast-food': require('../../assets/icons/food.png'),
  cart: require('../../assets/icons/cart.png'),
  list: require('../../assets/icons/list.png'),
  cash: require('../../assets/icons/cash.png'),
  people: require('../../assets/icons/people.png'),
  business: require('../../assets/icons/building.png'),
  scale: require('../../assets/icons/scale.png'),
  'swap-horizontal': require('../../assets/icons/swap.png'),
  'logo-whatsapp': require('../../assets/icons/chat.png'),
};

const TabIcon = ({ icon, badge, color }: { icon: any; badge?: number; color: string }) => (
  <View style={styles.tabIcon}>
    <Image source={ICON_PNG[icon]} style={[styles.tabImg, { tintColor: color }]} />
    {badge !== undefined && badge > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
      </View>
    )}
  </View>
);

export default function DeliveryLayout() {
  const router = useRouter();
  const { activeBusiness } = useBusinessStore();
  const cartItemCount = useDeliveryCartStore(s => s.getItemCount());
  const pendingOrders = useOrderStore(s => s.getPendingOrders('delivery'));
  const currentUser = useUserStore(s => s.currentUser);
  const currentTurn = useUserStore(s => s.currentTurn);
  const cashRegister = useCashStore(s => s.getOpenRegister('delivery'));

  useEffect(() => {
    if (!activeBusiness || activeBusiness !== 'delivery') {
      router.replace('/');
    }
  }, [activeBusiness]);

  useEffect(() => {
    if (currentUser && !currentUser.businesses?.includes('delivery') && currentUser.role !== 'admin') {
      router.replace('/');
    }
  }, [currentUser]);

  if (!currentUser || (!currentUser.businesses?.includes('delivery') && currentUser.role !== 'admin')) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.azulInstitucional,
        tabBarInactiveTintColor: Colors.grisMedio,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerStyle: { backgroundColor: Colors.azulInstitucional },
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
          headerTitle: '🍕 Dippy Delivery',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menú',
          headerTitle: '🍽️ Menú Delivery',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="fast-food" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Pedido',
          headerTitle: '🛒 Pedido Delivery',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="cart" color={color} badge={cartItemCount} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pedidos',
          headerTitle: '📋 Pedidos',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="list" color={color} badge={pendingOrders.length} />,
        }}
      />
      <Tabs.Screen
        name="cash"
        options={{
          href: null,
          title: 'Caja',
          headerTitle: '💰 Caja Delivery',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="cash" color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          href: null,
          title: 'Equipo',
          headerTitle: '👥 Equipo Delivery',
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
        name="whatsapp-import"
        options={{
          href: null,
          title: 'WhatsApp',
          headerTitle: '💬 Importar WhatsApp',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="logo-whatsapp" color={color} />,
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
  tabImg: { width: 26, height: 26, resizeMode: 'contain' },
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
