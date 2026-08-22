import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '@/theme';
import { useColors, useShadow } from '@/theme/ThemeProvider';
import { useProductStore } from '@/store/productStore';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';
import { useProviderStore } from '@/store/providerStore';
import { formatCurrency } from '@/utils/uuid';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const colors = useColors();
  const products = useProductStore(s => s.getProducts());
  const lowStockProducts = useProductStore(s => s.getLowStockProducts());
  const cartItems = useCartStore(s => s.getItemCount());
  const cartTotal = useCartStore(s => s.getTotal());
  const currentUser = useUserStore(s => s.currentUser);
  const currentTurn = useUserStore(s => s.currentTurn);
  const providers = useProviderStore(s => s.getProviders());

  const storeProducts = products.filter(p => p.salesChannels.includes('store'));
  const deliveryProducts = products.filter(p => p.salesChannels.includes('delivery'));

  const quickActions = [
    { emoji: '📱', label: 'Escanear', action: () => router.push('/scanner'), color: colors.primary },
    { emoji: '➕', label: 'Producto', action: () => router.push('/products/add'), color: Colors.exito },
    { emoji: '🛒', label: 'Carrito', action: () => router.push('/(tabs)/cart'), color: Colors.amarilloAcento },
    { emoji: '🛵', label: 'Delivery', action: () => router.push('/delivery/menu'), color: Colors.celesteBandera },
  ];

  const stats = [
    { emoji: '📦', label: 'Productos', value: products.length.toString(), color: colors.primary },
    { emoji: '🏢', label: 'Proveedores', value: providers.length.toString(), color: Colors.amarilloAcento },
    { emoji: '🛒', label: 'En Carrito', value: cartItems.toString(), color: Colors.exito },
    { emoji: '⚠️', label: 'Stock Bajo', value: lowStockProducts.length.toString(), color: lowStockProducts.length > 0 ? Colors.error : Colors.exito },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Header Card con Turno */}
      {currentTurn && (
        <View style={[styles.turnCard, { backgroundColor: colors.primary }]}>
          <View style={styles.turnInfo}>
            <Text style={styles.turnEmoji}>🟢</Text>
            <View style={styles.turnDetails}>
              <Text style={styles.turnTitle}>Turno Activo</Text>
              <Text style={styles.turnUser}>{currentUser?.name}</Text>
              <Text style={styles.turnShift}>
                {currentTurn.shift === 'manana' ? '☀️ Mañana' :
                 currentTurn.shift === 'tarde' ? '🌤️ Tarde' : '🌙 Noche'}
              </Text>
            </View>
          </View>
          <View style={styles.turnStats}>
            <Text style={styles.turnStatValue}>{formatCurrency(currentTurn.totalSales)}</Text>
            <Text style={styles.turnStatLabel}>Vendido</Text>
            <Text style={styles.turnStatValue}>{currentTurn.totalOrders}</Text>
            <Text style={styles.turnStatLabel}>Pedidos</Text>
          </View>
        </View>
      )}

      {/* Welcome */}
      <View style={styles.welcomeSection}>
        <Text style={[styles.welcomeEmoji, { color: colors.textPrimary }]}>🇦🇷</Text>
        <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>
          ¡Bienvenido a Dippy!
        </Text>
        <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
          Tu sistema de gestión integral
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>⚡ Accesos Rápidos</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.quickAction, { backgroundColor: colors.card, ...Shadows.sm }]}
              onPress={action.action}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                <Text style={styles.quickActionEmoji}>{action.emoji}</Text>
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📊 Resumen</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View
              key={index}
              style={[styles.statCard, { backgroundColor: colors.card, ...Shadows.sm }]}
            >
              <Text style={styles.statEmoji}>{stat.emoji}</Text>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.error }]}>
            ⚠️ Stock Bajo ({lowStockProducts.length})
          </Text>
          <View style={[styles.alertCard, { backgroundColor: `${Colors.error}15`, borderColor: `${Colors.error}30` }]}>
            {lowStockProducts.slice(0, 3).map((product) => (
              <View key={product.id} style={styles.alertItem}>
                <Text style={styles.alertEmoji}>{product.emoji || '📦'}</Text>
                <Text style={[styles.alertName, { color: colors.textPrimary }]}>{product.name}</Text>
                <Text style={[styles.alertStock, { color: Colors.error }]}>
                  {product.stock} / {product.minStock} min
                </Text>
              </View>
            ))}
            {lowStockProducts.length > 3 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/products')}>
                <Text style={[styles.alertMore, { color: colors.primary }]}>
                  Ver todos ({lowStockProducts.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Cart Preview */}
      {cartItems > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🛒 Carrito Actual</Text>
          <TouchableOpacity
            style={[styles.cartPreview, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/cart')}
          >
            <View style={styles.cartPreviewInfo}>
              <Text style={styles.cartPreviewEmoji}>🛒</Text>
              <View>
                <Text style={styles.cartPreviewTitle}>{cartItems} items</Text>
                <Text style={styles.cartPreviewSubtitle}>Listo para cobrar</Text>
              </View>
            </View>
            <Text style={styles.cartPreviewTotal}>{formatCurrency(cartTotal)}</Text>
            <Text style={styles.cartPreviewArrow}>→</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Menu Digital Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.menuDigital, { backgroundColor: colors.card, ...Shadows.md }]}
          onPress={() => router.push('/delivery/menu')}
        >
          <Text style={styles.menuDigitalEmoji}>📱</Text>
          <View style={styles.menuDigitalInfo}>
            <Text style={[styles.menuDigitalTitle, { color: colors.textPrimary }]}>
              Menú Digital para Clientes
            </Text>
            <Text style={[styles.menuDigitalSubtitle, { color: colors.textSecondary }]}>
              Compartí el menú por QR o WhatsApp
            </Text>
          </View>
          <Text style={[styles.menuDigitalArrow, { color: colors.primary }]}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  turnCard: {
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  turnInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  turnEmoji: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  turnDetails: {},
  turnTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  turnUser: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  turnShift: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 2,
  },
  turnStats: {
    alignItems: 'flex-end',
  },
  turnStatValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  turnStatLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    marginBottom: 4,
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  welcomeEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickAction: {
    width: (width - Spacing.md * 2 - Spacing.sm * 3) / 4,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionEmoji: {
    fontSize: 24,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    width: (width - Spacing.md * 2 - Spacing.sm * 3) / 4,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  alertCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  alertEmoji: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  alertName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  alertStock: {
    fontSize: 12,
    fontWeight: '600',
  },
  alertMore: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  cartPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  cartPreviewInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartPreviewEmoji: {
    fontSize: 32,
    marginRight: Spacing.sm,
  },
  cartPreviewTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartPreviewSubtitle: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
  },
  cartPreviewTotal: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: Spacing.sm,
  },
  cartPreviewArrow: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  menuDigital: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  menuDigitalEmoji: {
    fontSize: 40,
    marginRight: Spacing.md,
  },
  menuDigitalInfo: {
    flex: 1,
  },
  menuDigitalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuDigitalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  menuDigitalArrow: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});