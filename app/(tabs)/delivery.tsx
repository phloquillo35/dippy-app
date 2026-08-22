import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, TextInput, Alert, Dimensions, Platform } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useDeliveryCartStore } from '@/store/deliveryCartStore';
import { useOrderStore } from '@/store/orderStore';
import { useProductStore } from '@/store/productStore';
import { useUserStore } from '@/store/userStore';
import { Button } from '@/components/Button';
import { CartItemCard } from '@/components/Card';
import { formatCurrency } from '@/utils/uuid';

const { width } = Dimensions.get('window');

type DeliveryView = 'dashboard' | 'menu' | 'whatsapp' | 'checkout' | 'orders' | 'order-detail';

const DELIVERY_CATEGORIES = [
  { key: 'all', label: '📋 Todos', emoji: '📋' },
  { key: 'comida_preparada', label: '🍝 Comida', emoji: '🍝' },
  { key: 'panaderia', label: '🥐 Panadería', emoji: '🥐' },
  { key: 'gaseosas', label: '🥤 Bebidas', emoji: '🥤' },
  { key: 'fiambres', label: '🥩 Fiambres', emoji: '🥩' },
];

export default function DeliveryScreen() {
  const colors = useColors();
  const currentUser = useUserStore(s => s.currentUser);
  const [currentView, setCurrentView] = useState<DeliveryView>('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [whatsappMessage, setWhatsappMessage] = useState('');

  const deliveryCart = useDeliveryCartStore();
  const orderStore = useOrderStore();
  const products = useProductStore(s => s.getProducts());

  const deliveryProducts = products.filter(p => p.salesChannels.includes('delivery'));
  const filteredProducts = selectedCategory === 'all'
    ? deliveryProducts
    : deliveryProducts.filter(p => p.category === selectedCategory);

  const activeOrders = orderStore.getActiveOrders();
  const pendingOrders = orderStore.getPendingOrders();

  const stats = [
    { emoji: '📋', label: 'Activos', value: activeOrders.length.toString(), color: colors.primary },
    { emoji: '⏳', label: 'Pendientes', value: pendingOrders.length.toString(), color: Colors.advertencia },
    { emoji: '💰', label: 'Ventas', value: orderStore.getSoldOrders().length.toString(), color: Colors.exito },
    { emoji: '🛒', label: 'En Carrito', value: deliveryCart.getItemCount().toString(), color: Colors.celesteBandera },
  ];

  const handleAddToCart = (product: any) => {
    deliveryCart.addItem(product);
    Alert.alert('✅ Agregado', `${product.name} agregado al carrito`);
  };

  const handleConfirmOrder = () => {
    if (deliveryCart.items.length === 0) {
      Alert.alert('Carrito vacío', 'Agregá items al carrito');
      return;
    }
    if (!deliveryCart.customerName) {
      Alert.alert('Faltan datos', 'Completá el nombre del cliente');
      return;
    }
    const orderId = deliveryCart.confirmOrder(currentUser?.name || 'Empleado');
    if (orderId) {
      Alert.alert('✅ Pedido Confirmado', `Pedido #${orderId.slice(-6).toUpperCase()} creado`);
      setCurrentView('orders');
    }
  };

  const handleAdvanceStatus = (orderId: string, currentStatus: string) => {
    const statusFlow: Record<string, string> = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'delivering',
      delivering: 'delivered',
    };
    const nextStatus = statusFlow[currentStatus];
    if (nextStatus) {
      orderStore.updateOrderStatus(orderId, nextStatus as any);
      if (nextStatus === 'delivered') {
        orderStore.markAsDelivered(orderId);
      }
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: Colors.advertencia,
      confirmed: colors.primary,
      preparing: Colors.celesteBandera,
      ready: Colors.exito,
      delivering: Colors.azulInstitucional,
      delivered: Colors.exito,
      sold: '#9E9E9E',
      cancelled: Colors.error,
    };
    return statusColors[status] || '#9E9E9E';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '⏳ Pendiente',
      confirmed: '✅ Confirmado',
      preparing: '👨‍🍳 Preparando',
      ready: '📦 Listo',
      delivering: '🛵 En Camino',
      delivered: '📍 Entregado',
      sold: '💰 Vendido',
      cancelled: '❌ Cancelado',
    };
    return labels[status] || status;
  };

  const renderDashboard = () => (
    <ScrollView style={styles.viewContainer} showsVerticalScrollIndicator={false}>
      {/* Stats */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={[styles.statCard, { backgroundColor: colors.card, ...Shadows.sm }]}>
            <Text style={styles.statEmoji}>{stat.emoji}</Text>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => setCurrentView('menu')}
        >
          <Text style={styles.actionEmoji}>🍽️</Text>
          <Text style={styles.actionLabel}>Menú Digital</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: Colors.celesteBandera }]}
          onPress={() => setCurrentView('whatsapp')}
        >
          <Text style={styles.actionEmoji}>📱</Text>
          <Text style={styles.actionLabel}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: Colors.amarilloAcento }]}
          onPress={() => {
            deliveryCart.setCustomerInfo({ name: 'Cliente' });
            setCurrentView('checkout');
          }}
        >
          <Text style={styles.actionEmoji}>📞</Text>
          <Text style={styles.actionLabel}>Teléfono</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: Colors.exito }]}
          onPress={() => setCurrentView('orders')}
        >
          <Text style={styles.actionEmoji}>📋</Text>
          <Text style={styles.actionLabel}>Pedidos</Text>
        </TouchableOpacity>
      </View>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>📋 Pedidos Activos</Text>
          {activeOrders.slice(0, 5).map((order) => (
            <TouchableOpacity
              key={order.id}
              style={[styles.orderCard, { backgroundColor: colors.card, ...Shadows.sm }]}
              onPress={() => {
                setSelectedOrder(order.id);
                setCurrentView('order-detail');
              }}
            >
              <View style={styles.orderHeader}>
                <Text style={[styles.orderId, { color: colors.textPrimary }]}>
                  #{order.id.slice(-6).toUpperCase()}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                    {getStatusLabel(order.status)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.orderCustomer, { color: colors.textSecondary }]}>
                {order.customerName} - {order.items.length} items
              </Text>
              <Text style={[styles.orderTotal, { color: colors.primary }]}>
                {formatCurrency(order.total)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Delivery Cart Preview */}
      {deliveryCart.getItemCount() > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🛒 Carrito de Delivery</Text>
          <TouchableOpacity
            style={[styles.cartPreview, { backgroundColor: Colors.celesteBandera }]}
            onPress={() => setCurrentView('checkout')}
          >
            <View style={styles.cartPreviewInfo}>
              <Text style={styles.cartPreviewEmoji}>🛒</Text>
              <View>
                <Text style={styles.cartPreviewTitle}>{deliveryCart.getItemCount()} items</Text>
                <Text style={styles.cartPreviewSubtitle}>Listo para confirmar</Text>
              </View>
            </View>
            <Text style={styles.cartPreviewTotal}>{formatCurrency(deliveryCart.getTotal())}</Text>
            <Text style={styles.cartPreviewArrow}>→</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );

  const renderMenu = () => (
    <View style={styles.viewContainer}>
      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {DELIVERY_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.categoryChip,
              { backgroundColor: selectedCategory === cat.key ? colors.primary : colors.card },
              { borderColor: selectedCategory === cat.key ? colors.primary : colors.border },
            ]}
            onPress={() => setSelectedCategory(cat.key)}
          >
            <Text style={[
              styles.categoryText,
              { color: selectedCategory === cat.key ? '#FFFFFF' : colors.textPrimary },
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products Grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productGrid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.productCard, { backgroundColor: colors.card, ...Shadows.sm }]}
            onPress={() => handleAddToCart(item)}
          >
            <Text style={styles.productEmoji}>{item.emoji || '🍽️'}</Text>
            <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={[styles.productDesc, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.description}
            </Text>
            <Text style={[styles.productPrice, { color: colors.primary }]}>
              {formatCurrency(item.salePrice)}
            </Text>
            <View style={[styles.addButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.addButtonText}>+</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Floating Cart Bar */}
      {deliveryCart.getItemCount() > 0 && (
        <TouchableOpacity
          style={[styles.floatingCart, { backgroundColor: Colors.celesteBandera }]}
          onPress={() => setCurrentView('checkout')}
        >
          <Text style={styles.floatingCartText}>
            🛒 {deliveryCart.getItemCount()} items - {formatCurrency(deliveryCart.getTotal())}
          </Text>
          <Text style={styles.floatingCartArrow}>Ver Carrito →</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderWhatsApp = () => (
    <ScrollView style={styles.viewContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.whatsappContainer}>
        <Text style={[styles.whatsappTitle, { color: colors.textPrimary }]}>📱 Importar Pedido WhatsApp</Text>
        <Text style={[styles.whatsappSubtitle, { color: colors.textSecondary }]}>
          Pegá el mensaje del pedido de WhatsApp
        </Text>

        <TextInput
          style={[styles.whatsappInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.card }]}
          multiline
          numberOfLines={6}
          placeholder="Ej: 2 pizza muzzarella&#10;1 coca 2.25&#10;3 medialunas"
          placeholderTextColor={colors.placeholder}
          value={whatsappMessage}
          onChangeText={setWhatsappMessage}
        />

        <Button
          title="📋 Importar Pedido"
          onPress={() => {
            if (!whatsappMessage.trim()) {
              Alert.alert('Mensaje vacío', 'Pegá un mensaje de WhatsApp');
              return;
            }
            const order = orderStore.importFromWhatsApp(whatsappMessage, currentUser?.name || 'Empleado');
            if (order) {
              setWhatsappMessage('');
              Alert.alert('✅ Importado', `Pedido #${order.id.slice(-6).toUpperCase()} creado`);
              setCurrentView('orders');
            } else {
              Alert.alert('No se pudo importar', 'No se detectaron items en el mensaje');
            }
          }}
          style={styles.importButton}
        />

        <View style={[styles.helpCard, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}30` }]}>
          <Text style={[styles.helpTitle, { color: colors.primary }]}>💡 Formato esperado</Text>
          <Text style={[styles.helpText, { color: colors.textSecondary }]}>
            {'• 2 pizza muzzarella\n• 1 coca 2.25\n• 3 medialunas\n• x2 sandwich de jamón'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderCheckout = () => (
    <ScrollView style={styles.viewContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.checkoutContainer}>
        <Text style={[styles.checkoutTitle, { color: colors.textPrimary }]}>📦 Confirmar Pedido</Text>

        {/* Customer Info */}
        <View style={styles.checkoutSection}>
          <Text style={[styles.checkoutLabel, { color: colors.textPrimary }]}>🧑 Datos del Cliente</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Nombre"
            placeholderTextColor={colors.placeholder}
            value={deliveryCart.customerName}
            onChangeText={(text) => deliveryCart.setCustomerInfo({ name: text })}
          />
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Teléfono"
            placeholderTextColor={colors.placeholder}
            value={deliveryCart.customerPhone}
            onChangeText={(text) => deliveryCart.setCustomerInfo({ phone: text })}
            keyboardType="phone-pad"
          />
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
            placeholder="Dirección"
            placeholderTextColor={colors.placeholder}
            value={deliveryCart.customerAddress}
            onChangeText={(text) => deliveryCart.setCustomerInfo({ address: text })}
          />
        </View>

        {/* Order Items */}
        <View style={styles.checkoutSection}>
          <Text style={[styles.checkoutLabel, { color: colors.textPrimary }]}>🛒 Items ({deliveryCart.getItemCount()})</Text>
          {deliveryCart.items.map((item) => (
            <View key={item.id} style={[styles.checkoutItem, { borderBottomColor: colors.border }]}>
              <Text style={[styles.checkoutItemName, { color: colors.textPrimary }]}>
                {item.emoji} {item.productName}
              </Text>
              <View style={styles.checkoutItemRight}>
                <Text style={[styles.checkoutItemQty, { color: colors.textSecondary }]}>x{item.quantity}</Text>
                <Text style={[styles.checkoutItemPrice, { color: colors.primary }]}>
                  {formatCurrency(item.totalPrice)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Delivery Fee */}
        <View style={styles.checkoutSection}>
          <View style={styles.feeRow}>
            <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>🛵 Costo Delivery</Text>
            <TextInput
              style={[styles.feeInput, { borderColor: colors.border, color: colors.textPrimary }]}
              value={deliveryCart.deliveryFee.toString()}
              onChangeText={(text) => deliveryCart.setDeliveryFee(parseInt(text) || 0)}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Total */}
        <View style={[styles.totalSection, { backgroundColor: colors.card, ...Shadows.sm }]}>
          <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>TOTAL</Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>
            {formatCurrency(deliveryCart.getTotal())}
          </Text>
        </View>

        {/* Confirm Button */}
        <Button
          title="✅ Confirmar Pedido"
          onPress={handleConfirmOrder}
          style={styles.confirmButton}
        />
      </View>
    </ScrollView>
  );

  const renderOrders = () => {
    const active = orderStore.getActiveOrders();
    const sold = orderStore.getSoldOrders();

    return (
      <ScrollView style={styles.viewContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.ordersContainer}>
          {/* Active Orders */}
          <Text style={[styles.ordersSectionTitle, { color: colors.textPrimary }]}>📋 Activos ({active.length})</Text>
          {active.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No hay pedidos activos</Text>
          ) : (
            active.map((order) => (
              <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.card, ...Shadows.sm }]}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedOrder(order.id);
                    setCurrentView('order-detail');
                  }}
                >
                  <View style={styles.orderHeader}>
                    <Text style={[styles.orderId, { color: colors.textPrimary }]}>
                      #{order.id.slice(-6).toUpperCase()}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                        {getStatusLabel(order.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.orderCustomer, { color: colors.textSecondary }]}>
                    {order.customerName} - {order.customerPhone || 'Sin teléfono'}
                  </Text>
                  <Text style={[styles.orderItems, { color: colors.textSecondary }]}>
                    {order.items.map(i => `${i.emoji}${i.quantity}x ${i.productName}`).join(', ')}
                  </Text>
                  <Text style={[styles.orderTotal, { color: colors.primary }]}>
                    {formatCurrency(order.total)}
                  </Text>
                </TouchableOpacity>

                {/* Advance Button */}
                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <TouchableOpacity
                    style={[styles.advanceButton, { backgroundColor: getStatusColor(order.status) }]}
                    onPress={() => handleAdvanceStatus(order.id, order.status)}
                  >
                    <Text style={styles.advanceButtonText}>
                      {order.status === 'pending' ? '✅ Confirmar' :
                       order.status === 'confirmed' ? '👨‍🍳 Preparar' :
                       order.status === 'preparing' ? '📦 Marcar Listo' :
                       order.status === 'ready' ? '🛵 Salir a Entregar' :
                       '📍 Marcar Entregado'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}

          {/* Sold Orders */}
          <Text style={[styles.ordersSectionTitle, { color: colors.textPrimary, marginTop: Spacing.lg }]}>
            💰 Vendidos ({sold.length})
          </Text>
          {sold.slice(0, 10).map((order) => (
            <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.card, ...Shadows.sm, opacity: 0.7 }]}>
              <View style={styles.orderHeader}>
                <Text style={[styles.orderId, { color: colors.textPrimary }]}>
                  #{order.id.slice(-6).toUpperCase()}
                </Text>
                <Text style={[styles.soldDate, { color: colors.textSecondary }]}>
                  {new Date(order.soldAt || order.updatedAt).toLocaleDateString('es-AR')}
                </Text>
              </View>
              <Text style={[styles.orderCustomer, { color: colors.textSecondary }]}>
                {order.customerName} - {order.items.length} items
              </Text>
              <Text style={[styles.orderTotal, { color: Colors.exito }]}>
                {formatCurrency(order.total)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderOrderDetail = () => {
    if (!selectedOrder) return null;
    const order = orderStore.getOrderById(selectedOrder);
    if (!order) return null;

    return (
      <ScrollView style={styles.viewContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setCurrentView('orders')}>
              <Text style={[styles.backButton, { color: colors.primary }]}>← Volver</Text>
            </TouchableOpacity>
            <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>
              Pedido #{order.id.slice(-6).toUpperCase()}
            </Text>
          </View>

          {/* Status */}
          <View style={[styles.detailStatus, { backgroundColor: `${getStatusColor(order.status)}15`, borderColor: `${getStatusColor(order.status)}30` }]}>
            <Text style={[styles.detailStatusText, { color: getStatusColor(order.status) }]}>
              {getStatusLabel(order.status)}
            </Text>
          </View>

          {/* Customer Info */}
          <View style={[styles.detailCard, { backgroundColor: colors.card, ...Shadows.sm }]}>
            <Text style={[styles.detailCardTitle, { color: colors.textPrimary }]}>🧑 Cliente</Text>
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>Nombre: {order.customerName}</Text>
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>Teléfono: {order.customerPhone || 'N/A'}</Text>
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>Dirección: {order.customerAddress || 'N/A'}</Text>
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>Fuente: {order.source}</Text>
          </View>

          {/* Items */}
          <View style={[styles.detailCard, { backgroundColor: colors.card, ...Shadows.sm }]}>
            <Text style={[styles.detailCardTitle, { color: colors.textPrimary }]}>🛒 Items</Text>
            {order.items.map((item) => (
              <View key={item.id} style={styles.detailItem}>
                <Text style={[styles.detailItemName, { color: colors.textPrimary }]}>
                  {item.emoji} {item.productName}
                </Text>
                <Text style={[styles.detailItemQty, { color: colors.textSecondary }]}>
                  x{item.quantity} - {formatCurrency(item.totalPrice)}
                </Text>
              </View>
            ))}
            <View style={[styles.detailTotal, { borderTopColor: colors.border }]}>
              <Text style={[styles.detailTotalLabel, { color: colors.textPrimary }]}>Total</Text>
              <Text style={[styles.detailTotalValue, { color: colors.primary }]}>
                {formatCurrency(order.total)}
              </Text>
            </View>
          </View>

          {/* Notes */}
          {order.notes && (
            <View style={[styles.detailCard, { backgroundColor: colors.card, ...Shadows.sm }]}>
              <Text style={[styles.detailCardTitle, { color: colors.textPrimary }]}>📝 Notas</Text>
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>{order.notes}</Text>
            </View>
          )}

          {/* Advance Button */}
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <Button
              title={order.status === 'pending' ? '✅ Confirmar Pedido' :
                     order.status === 'confirmed' ? '👨‍🍳 Empezar a Preparar' :
                     order.status === 'preparing' ? '📦 Marcar como Listo' :
                     order.status === 'ready' ? '🛵 Salir a Entregar' :
                     '📍 Marcar como Entregado'}
              onPress={() => {
                handleAdvanceStatus(order.id, order.status);
                setCurrentView('orders');
              }}
              style={styles.detailAdvanceButton}
            />
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerEmoji}>🛵</Text>
            <View>
              <Text style={styles.headerTitle}>Delivery</Text>
              <Text style={styles.headerSubtitle}>
                {currentView === 'dashboard' ? 'Panel de Pedidos' :
                 currentView === 'menu' ? 'Menú Digital' :
                 currentView === 'whatsapp' ? 'Importar WhatsApp' :
                 currentView === 'checkout' ? 'Confirmar Pedido' :
                 currentView === 'orders' ? 'Gestión de Pedidos' :
                 'Detalle del Pedido'}
              </Text>
            </View>
          </View>
          {currentView !== 'dashboard' && (
            <TouchableOpacity onPress={() => setCurrentView('dashboard')}>
              <Text style={styles.homeButton}>🏠</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {currentView === 'dashboard' && renderDashboard()}
      {currentView === 'menu' && renderMenu()}
      {currentView === 'whatsapp' && renderWhatsApp()}
      {currentView === 'checkout' && renderCheckout()}
      {currentView === 'orders' && renderOrders()}
      {currentView === 'order-detail' && renderOrderDetail()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : Spacing.md,
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
    fontSize: 28,
    marginRight: Spacing.sm,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
  },
  homeButton: {
    fontSize: 28,
  },
  viewContainer: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    width: (width - Spacing.md * 2 - Spacing.sm * 3) / 4,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  actionEmoji: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
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
  orderCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderCustomer: {
    fontSize: 14,
    marginBottom: 4,
  },
  orderItems: {
    fontSize: 12,
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  soldDate: {
    fontSize: 12,
  },
  advanceButton: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  advanceButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  categoryScroll: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  productGrid: {
    padding: Spacing.md,
  },
  productCard: {
    width: (width - Spacing.md * 2 - Spacing.sm) / 2,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  productEmoji: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  productDesc: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  floatingCart: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.lg,
  },
  floatingCartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  floatingCartArrow: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  whatsappContainer: {
    padding: Spacing.md,
  },
  whatsappTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  whatsappSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  whatsappInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    minHeight: 150,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  importButton: {
    marginBottom: Spacing.lg,
  },
  helpCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  helpText: {
    fontSize: 13,
    lineHeight: 20,
  },
  checkoutContainer: {
    padding: Spacing.md,
  },
  checkoutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Spacing.lg,
  },
  checkoutSection: {
    marginBottom: Spacing.lg,
  },
  checkoutLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  checkoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  checkoutItemName: {
    fontSize: 14,
    flex: 1,
  },
  checkoutItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkoutItemQty: {
    fontSize: 14,
  },
  checkoutItemPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: 14,
  },
  feeInput: {
    width: 80,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    textAlign: 'center',
    fontSize: 14,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  confirmButton: {
    marginBottom: Spacing.xl,
  },
  ordersContainer: {
    padding: Spacing.md,
  },
  ordersSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  detailContainer: {
    padding: Spacing.md,
  },
  detailHeader: {
    marginBottom: Spacing.lg,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailStatus: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  detailStatusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  detailCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  detailItemName: {
    fontSize: 14,
    flex: 1,
  },
  detailItemQty: {
    fontSize: 14,
  },
  detailTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
  },
  detailTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailAdvanceButton: {
    marginTop: Spacing.md,
  },
});
