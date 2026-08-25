import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useUserStore } from '@/store/userStore';
import { useOrderStore } from '@/store/orderStore';
import { useProductStore } from '@/store/productStore';
import { useProviderStore } from '@/store/providerStore';
import { formatCurrency } from '@/utils/uuid';

const { width } = Dimensions.get('window');

export default function MetricsScreen() {
  const colors = useColors();
  const currentUser = useUserStore(s => s.currentUser);
  const isAdmin = useUserStore(s => s.isAdmin());
  const turnsHistory = useUserStore(s => s.getAllTurns());
  const orders = useOrderStore(s => s.orders);
  const products = useProductStore(s => s.getProducts());
  const providers = useProviderStore(s => s.getProviders());
  const getTotalPayments = useProviderStore(s => s.getTotalPayments);

  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin) {
      router.replace('/(tabs)');
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.unauthorizedContainer}>
          <Text style={styles.unauthorizedEmoji}>🔒</Text>
          <Text style={[styles.unauthorizedTitle, { color: colors.textPrimary }]}>
            Acceso Restringido
          </Text>
          <Text style={[styles.unauthorizedSubtitle, { color: colors.textSecondary }]}>
            Solo Marta (administradora) puede ver las métricas
          </Text>
        </View>
      </View>
    );
  }

  // Calculate metrics
  const storeOrders = orders.filter(o => o.status === 'sold');
  const deliveryOrders = orders.filter(o => o.source === 'menu' || o.source === 'whatsapp' || o.source === 'phone');

  const totalSalesStore = turnsHistory.reduce((sum, turn) => sum + turn.totalSales, 0);
  const totalOrdersStore = turnsHistory.reduce((sum, turn) => sum + turn.totalOrders, 0);
  const averageTicket = totalOrdersStore > 0 ? totalSalesStore / totalOrdersStore : 0;

  // Payment metrics
  const paidOrders = orders.filter(o => o.paymentReceived);
  const cashOrders = paidOrders.filter(o => o.paymentMethod === 'efectivo');
  const transferOrders = paidOrders.filter(o => o.paymentMethod === 'transferencia');
  const totalCash = cashOrders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);
  const totalTransfer = transferOrders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);

  // Supplier payments
  const totalSupplierPayments = getTotalPayments();

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const topProducts = products.slice(0, 5);

  const stats = [
    { emoji: '💰', label: 'Ventas Totales', value: formatCurrency(totalSalesStore), color: Colors.exito },
    { emoji: '🛒', label: 'Pedidos Totales', value: totalOrdersStore.toString(), color: colors.primary },
    { emoji: '📊', label: 'Ticket Promedio', value: formatCurrency(averageTicket), color: Colors.amarilloAcento },
    { emoji: '💸', label: 'Pagos Proveedores', value: formatCurrency(totalSupplierPayments), color: Colors.error },
    { emoji: '⚠️', label: 'Stock Bajo', value: lowStockProducts.length.toString(), color: lowStockProducts.length > 0 ? Colors.error : Colors.exito },
  ];

  const businessStats = [
    { emoji: '🏪', label: 'Ventas Tienda', value: formatCurrency(totalSalesStore), color: colors.primary },
    { emoji: '🛵', label: 'Pedidos Delivery', value: deliveryOrders.length.toString(), color: Colors.celesteBandera },
    { emoji: '👥', label: 'Turnos Totales', value: turnsHistory.length.toString(), color: Colors.amarilloAcento },
    { emoji: '📦', label: 'Productos Activos', value: products.length.toString(), color: Colors.exito },
  ];

  const paymentStats = [
    { emoji: '💵', label: 'Efectivo', value: formatCurrency(totalCash), count: cashOrders.length.toString(), color: Colors.exito },
    { emoji: '🏦', label: 'Transferencia', value: formatCurrency(totalTransfer), count: transferOrders.length.toString(), color: colors.primary },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerEmoji}>📊</Text>
            <View>
              <Text style={styles.headerTitle}>Métricas del Negocio</Text>
              <Text style={styles.headerSubtitle}>Panel de Administración - Marta</Text>
            </View>
          </View>
        </View>
      </View>

      {/* General Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📊 Resumen General</Text>
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

      {/* Business Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🏪 Detalle por Negocio</Text>
        <View style={styles.businessGrid}>
          {businessStats.map((stat, index) => (
            <View
              key={index}
              style={[styles.businessCard, { backgroundColor: colors.card, ...Shadows.sm }]}
            >
              <Text style={styles.businessEmoji}>{stat.emoji}</Text>
              <View style={styles.businessInfo}>
                <Text style={[styles.businessValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={[styles.businessLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Payment Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>💳 Métodos de Pago</Text>
        <View style={styles.businessGrid}>
          {paymentStats.map((stat, index) => (
            <View
              key={index}
              style={[styles.businessCard, { backgroundColor: colors.card, ...Shadows.sm }]}
            >
              <Text style={styles.businessEmoji}>{stat.emoji}</Text>
              <View style={styles.businessInfo}>
                <Text style={[styles.businessValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={[styles.businessLabel, { color: colors.textSecondary }]}>
                  {stat.label} ({stat.count} pedidos)
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Supplier Payments */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🏭 Pagos a Proveedores</Text>
        <View style={[styles.turnsCard, { backgroundColor: colors.card, ...Shadows.sm }]}>
          {providers.length === 0 ? (
            <Text style={[styles.turnName, { color: colors.textSecondary, textAlign: 'center', padding: Spacing.md }]}>
              No hay proveedores registrados
            </Text>
          ) : (
            providers.slice(0, 5).map((provider) => {
              const totalPaid = provider.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
              const paymentCount = provider.payments?.length || 0;
              return (
                <View key={provider.id} style={styles.turnItem}>
                  <View style={styles.turnInfo}>
                    <Text style={[styles.turnName, { color: colors.textPrimary }]}>{provider.name}</Text>
                    <Text style={[styles.turnShift, { color: colors.textSecondary }]}>
                      {paymentCount} pago{paymentCount !== 1 ? 's' : ''} registrado{paymentCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={styles.turnStats}>
                    <Text style={[styles.turnSales, { color: Colors.error }]}>
                      -{formatCurrency(totalPaid)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>

      {/* Top Products */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🏆 Top Productos</Text>
        <View style={[styles.topProductsCard, { backgroundColor: colors.card, ...Shadows.sm }]}>
          {topProducts.map((product, index) => (
            <View key={product.id} style={styles.productItem}>
              <View style={styles.productRank}>
                <Text style={[styles.productRankText, { color: colors.primary }]}>{index + 1}</Text>
              </View>
              <Text style={styles.productEmoji}>{product.emoji || '📦'}</Text>
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: colors.textPrimary }]}>{product.name}</Text>
                <Text style={[styles.productCategory, { color: colors.textSecondary }]}>{product.category}</Text>
              </View>
              <View style={styles.productStats}>
                <Text style={[styles.productStock, { color: product.stock <= product.minStock ? Colors.error : Colors.exito }]}>
                  Stock: {product.stock}
                </Text>
                <Text style={[styles.productPrice, { color: colors.textPrimary }]}>
                  {formatCurrency(product.salePrice)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Turns */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🕐 Turnos Recientes</Text>
        <View style={[styles.turnsCard, { backgroundColor: colors.card, ...Shadows.sm }]}>
          {turnsHistory.slice(0, 5).map((turn) => (
            <View key={turn.id} style={styles.turnItem}>
              <View style={styles.turnInfo}>
                <Text style={[styles.turnName, { color: colors.textPrimary }]}>{turn.userName}</Text>
                <Text style={[styles.turnShift, { color: colors.textSecondary }]}>
                  {turn.shift === 'manana' ? '☀️ Mañana' :
                   turn.shift === 'tarde' ? '🌤️ Tarde' : '🌙 Noche'}
                </Text>
              </View>
              <View style={styles.turnStats}>
                <Text style={[styles.turnSales, { color: Colors.exito }]}>{formatCurrency(turn.totalSales)}</Text>
                <Text style={[styles.turnOrders, { color: colors.textSecondary }]}>{turn.totalOrders} pedidos</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  headerTitle: {
    color: Colors.blanco,
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: Colors.blanco,
    fontSize: 14,
    opacity: 0.8,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  businessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  businessCard: {
    width: (width - Spacing.md * 2 - Spacing.sm) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  businessEmoji: {
    fontSize: 32,
    marginRight: Spacing.sm,
  },
  businessInfo: {
    flex: 1,
  },
  businessValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  businessLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  topProductsCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grisClaro,
  },
  productRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.grisClaro,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  productRankText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  productEmoji: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
  },
  productCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  productStats: {
    alignItems: 'flex-end',
  },
  productStock: {
    fontSize: 12,
    fontWeight: '600',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  turnsCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  turnItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grisClaro,
  },
  turnInfo: {
    flex: 1,
  },
  turnName: {
    fontSize: 14,
    fontWeight: '600',
  },
  turnShift: {
    fontSize: 12,
    marginTop: 2,
  },
  turnStats: {
    alignItems: 'flex-end',
  },
  turnSales: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  turnOrders: {
    fontSize: 12,
    marginTop: 2,
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  unauthorizedEmoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  unauthorizedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  unauthorizedSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});
