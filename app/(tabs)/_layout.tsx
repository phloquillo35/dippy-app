import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';

const TabIcon = ({ emoji, label, badge }: { emoji: string; label: string; badge?: number }) => (
  <View style={styles.tabIcon}>
    <Text style={styles.tabEmoji}>{emoji}</Text>
    {badge !== undefined && badge > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
      </View>
    )}
    <Text style={styles.tabLabel}>{label}</Text>
  </View>
);

export default function TabLayout() {
  const itemCount = useCartStore(s => s.getItemCount());
  const currentUser = useUserStore(s => s.currentUser);
  const currentTurn = useUserStore(s => s.currentTurn);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.celesteInstitucional,
        tabBarInactiveTintColor: Colors.grisMedio,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 88,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: Colors.celesteInstitucional,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerRight: () => (
          <View style={styles.headerRight}>
            {currentTurn && (
              <View style={styles.turnIndicator}>
                <Text style={styles.turnEmoji}>🟢</Text>
                <Text style={styles.turnText}>{currentUser?.name?.split(' ')[0]}</Text>
              </View>
            )}
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '🏠 Inicio',
          headerTitle: '🇦🇷 Dippy - Tu Negocio',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Inicio" />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: '📦 Productos',
          headerTitle: '📦 Productos',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📦" label="Stock" />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: '🛒 Carrito',
          headerTitle: '🛒 Carrito de Compras',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🛒" label="Carrito" badge={itemCount} />
          ),
        }}
      />
      <Tabs.Screen
        name="delivery"
        options={{
          title: '🛵 Delivery',
          headerTitle: '🛵 Delivery',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🛵" label="Delivery" />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: '👥 Equipo',
          headerTitle: '👥 Equipo',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👥" label="Equipo" />
          ),
        }}
      />
      <Tabs.Screen
        name="providers"
        options={{
          title: '🏢 Proveedores',
          headerTitle: '🏢 Proveedores',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏢" label="Proveed." />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabEmoji: {
    fontSize: 24,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
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
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerRight: {
    marginRight: 16,
  },
  turnIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  turnEmoji: {
    fontSize: 10,
    marginRight: 4,
  },
  turnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});