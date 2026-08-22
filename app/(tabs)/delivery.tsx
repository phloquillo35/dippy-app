import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Dimensions,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useDeliveryCartStore } from '@/store/deliveryCartStore';
import { useOrderStore } from '@/store/orderStore';
import { useProductStore } from '@/store/productStore';
import { useUserStore } from '@/store/userStore';
import { Button } from '@/components/Button';
import { formatCurrency } from '@/utils/uuid';
import { PaymentMethod, Product } from '@/types';

const { width } = Dimensions.get('window');

type DeliveryView = 'dashboard' | 'menu' | 'whatsapp' | 'orders' | 'order-detail';

const DELIVERY_CATEGORIES = [
  { key: 'all', label: '📋 Todos', emoji: '📋' },
  { key: 'comida_preparada', label: '🍝 Comida', emoji: '🍝' },
];

export default function DeliveryScreen() {
  const colors = useColors();
  const currentUser = useUserStore((s) => s.currentUser);
  const [currentView, setCurrentView] = useState<DeliveryView>('dashboard');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [amountPaid, setAmountPaid] = useState<number>(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState('1');
  const [modalCustomerName, setModalCustomerName] = useState('');
  const [modalCustomerPhone, setModalCustomerPhone] = useState('');
  const [modalCustomerAddress, setModalCustomerAddress] = useState('');
  const [modalNotes, setModalNotes] = useState('');

  const deliveryCart = useDeliveryCartStore();
  const orderStore = useOrderStore();
  const products = useProductStore((s) => s.getProducts());

  const deliveryProducts = products.filter((p) => p.salesChannels.includes('delivery'));
  const filteredProducts =
    selectedCategory === 'all'
      ? deliveryProducts
      : deliveryProducts.filter((p) => p.category === selectedCategory);

  const activeOrders = orderStore.getActiveOrders();
  const pendingOrders = orderStore.getPendingOrders();

  const stats = [
    { emoji: '📋', label: 'Activos', value: activeOrders.length.toString(), color: colors.primary },
    { emoji: '⏳', label: 'Pendientes', value: pendingOrders.length.toString(), color: Colors.advertencia },
    { emoji: '💰', label: 'Ventas', value: orderStore.getSoldOrders().length.toString(), color: Colors.exito },
  ];

  const resetModal = useCallback(() => {
    setSelectedProduct(null);
    setModalQuantity('1');
    setModalCustomerName('');
    setModalCustomerPhone('');
    setModalCustomerAddress('');
    setModalNotes('');
    setModalVisible(false);
  }, []);

  const handleOpenProductModal = useCallback(
    (product: Product) => {
      resetModal();
      setSelectedProduct(product);
      setModalVisible(true);
    },
    [resetModal],
  );

  const handleCreateOrderFromModal = useCallback(() => {
    if (!selectedProduct) return;

    const qty = parseInt(modalQuantity, 10) || 1;
    if (qty < 1) {
      Alert.alert('Cantidad invalida', 'La cantidad debe ser al menos 1');
      return;
    }
    if (!modalCustomerName.trim()) {
      Alert.alert('Faltan datos', 'El nombre del cliente es obligatorio');
      return;
    }

    deliveryCart.clearCart();
    deliveryCart.setCustomerInfo({
      name: modalCustomerName.trim(),
      phone: modalCustomerPhone.trim(),
      address: modalCustomerAddress.trim(),
    });
    if (modalNotes.trim()) {
      deliveryCart.setNotes(modalNotes.trim());
    }
    deliveryCart.addItem(selectedProduct, undefined, qty);

    const orderId = deliveryCart.confirmOrder(currentUser?.name || 'Empleado', 'menu');

    if (orderId) {
      Alert.alert('✅ Pedido Creado', `Pedido #${orderId.slice(-6).toUpperCase()} creado`);
      resetModal();
      setCurrentView('orders');
    } else {
      Alert.alert('Error', 'No se pudo crear el pedido');
    }
  }, [
    selectedProduct,
    modalQuantity,
    modalCustomerName,
    modalCustomerPhone,
    modalCustomerAddress,
    modalNotes,
    deliveryCart,
    currentUser,
    resetModal,
  ]);

  const handleAdvanceStatus = useCallback(
    (orderId: string, currentStatus: string) => {
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
    },
    [orderStore],
  );

  const handleCancelOrder = useCallback(
    (orderId: string) => {
      Alert.alert(
        'Cancelar Pedido',
        'Seguro queres cancelar este pedido?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Si, cancelar',
            style: 'destructive',
            onPress: () => {
              orderStore.cancelOrder(orderId);
              Alert.alert('❌ Cancelado', 'El pedido fue cancelado');
              if (selectedOrder === orderId) {
                setCurrentView('orders');
              }
            },
          },
        ],
      );
    },
    [orderStore, selectedOrder],
  );

  const getStatusColor = useCallback(
    (status: string) => {
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
    },
    [colors.primary],
  );

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

      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => setCurrentView('menu')}
        >
          <Text style={styles.actionEmoji}>🍽️</Text>
          <Text style={styles.actionLabel}>Tomar Pedido</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: Colors.celesteBandera }]}
          onPress={() => setCurrentView('whatsapp')}
        >
          <Text style={styles.actionEmoji}>📱</Text>
          <Text style={styles.actionLabel}>WhatsApp</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: Colors.exito }]}
          onPress={() => setCurrentView('orders')}
        >
          <Text style={styles.actionEmoji}>📋</Text>
          <Text style={styles.actionLabel}>Pedidos</Text>
        </TouchableOpacity>
      </View>

      {activeOrders.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            📋 Pedidos Activos
          </Text>
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
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(order.status)}20` },
                  ]}
                >
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

      <View style={{ height: 20 }} />
    </ScrollView>
  );

  const renderMenu = () => (
    <View style={styles.viewContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
      >
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
            <Text
              style={[
                styles.categoryText,
                { color: selectedCategory === cat.key ? '#FFFFFF' : colors.textPrimary },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productGrid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.productCard, { backgroundColor: colors.card, ...Shadows.sm }]}
            onPress={() => handleOpenProductModal(item)}
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
            <View style={styles.tapHint}>
              <Text style={[styles.tapHintText, { color: colors.textSecondary }]}>Toca para pedir</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderWhatsApp = () => (
    <ScrollView style={styles.viewContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.whatsappContainer}>
        <Text style={[styles.whatsappTitle, { color: colors.textPrimary }]}>
          📱 Importar Pedido WhatsApp
        </Text>
        <Text style={[styles.whatsappSubtitle, { color: colors.textSecondary }]}>
          Pega el mensaje del pedido de WhatsApp
        </Text>

        <TextInput
          style={[
            styles.whatsappInput,
            {
              borderColor: colors.border,
              color: colors.textPrimary,
              backgroundColor: colors.card,
            },
          ]}
          multiline
          numberOfLines={6}
          placeholder={'Ej: 2 pizza muzzarella\n1 coca 2.25\n3 medialunas'}
          placeholderTextColor={colors.placeholder}
          value={whatsappMessage}
          onChangeText={setWhatsappMessage}
        />

        <Button
          title="📋 Importar Pedido"
          onPress={() => {
            if (!whatsappMessage.trim()) {
              Alert.alert('Mensaje vacio', 'Pega un mensaje de WhatsApp');
              return;
            }
            const order = orderStore.importFromWhatsApp(
              whatsappMessage,
              currentUser?.name || 'Empleado',
            );
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

        <View
          style={[
            styles.helpCard,
            { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}30` },
          ]}
        >
          <Text style={[styles.helpTitle, { color: colors.primary }]}>💡 Formato esperado</Text>
          <Text style={[styles.helpText, { color: colors.textSecondary }]}>
            {'• 2 pizza muzzarella\n• 1 coca 2.25\n• 3 medialunas\n• x2 sandwich de jamon'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderOrders = () => {
    const active = orderStore.getActiveOrders();
    const sold = orderStore.getSoldOrders();

    return (
      <ScrollView style={styles.viewContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.ordersContainer}>
          <Text style={[styles.ordersSectionTitle, { color: colors.textPrimary }]}>
            📋 Activos ({active.length})
          </Text>
          {active.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No hay pedidos activos
            </Text>
          ) : (
            active.map((order) => (
              <View
                key={order.id}
                style={[styles.orderCard, { backgroundColor: colors.card, ...Shadows.sm }]}
              >
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
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(order.status)}20` },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                        {getStatusLabel(order.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.orderCustomer, { color: colors.textSecondary }]}>
                    {order.customerName} - {order.customerPhone || 'Sin telefono'}
                  </Text>
                  <Text style={[styles.orderItems, { color: colors.textSecondary }]}>
                    {order.items
                      .map((i) => `${i.emoji || ''}${i.quantity}x ${i.productName}`)
                      .join(', ')}
                  </Text>
                  <Text style={[styles.orderTotal, { color: colors.primary }]}>
                    {formatCurrency(order.total)}
                  </Text>
                </TouchableOpacity>

                <View style={styles.orderActions}>
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <TouchableOpacity
                      style={[
                        styles.advanceButton,
                        { backgroundColor: getStatusColor(order.status) },
                      ]}
                      onPress={() => handleAdvanceStatus(order.id, order.status)}
                    >
                      <Text style={styles.advanceButtonText}>
                        {order.status === 'pending'
                          ? '✅ Confirmar'
                          : order.status === 'confirmed'
                          ? '👨‍🍳 Preparar'
                          : order.status === 'preparing'
                          ? '📦 Marcar Listo'
                          : order.status === 'ready'
                          ? '🛵 Salir a Entregar'
                          : '📍 Marcar Entregado'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {order.status !== 'cancelled' && order.status !== 'sold' && (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleCancelOrder(order.id)}
                    >
                      <Text style={styles.cancelButtonText}>✕ Cancelar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}

          <Text
            style={[styles.ordersSectionTitle, { color: colors.textPrimary, marginTop: Spacing.lg }]}
          >
            💰 Vendidos ({sold.length})
          </Text>
          {sold.slice(0, 10).map((order) => (
            <View
              key={order.id}
              style={[
                styles.orderCard,
                { backgroundColor: colors.card, ...Shadows.sm, opacity: 0.7 },
              ]}
            >
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
              </TouchableOpacity>
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

    const orderChange = amountPaid - order.total;

    const handlePayment = () => {
      if (!paymentMethod) {
        Alert.alert('Selecciona metodo', 'Efectivo o Transferencia');
        return;
      }
      if (paymentMethod === 'efectivo' && amountPaid < order.total) {
        Alert.alert(
          'Monto insuficiente',
          `El monto ($${amountPaid}) es menor al total ($${order.total})`,
        );
        return;
      }

      orderStore.markAsPaid(order.id, paymentMethod, amountPaid);
      Alert.alert(
        '✅ Pago Registrado',
        `${paymentMethod === 'efectivo' ? '💵 Efectivo' : '🏦 Transferencia'}: ${formatCurrency(amountPaid)}`,
      );
      setPaymentMethod(null);
      setAmountPaid(0);
    };

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

          <View
            style={[
              styles.detailStatus,
              {
                backgroundColor: `${getStatusColor(order.status)}15`,
                borderColor: `${getStatusColor(order.status)}30`,
              },
            ]}
          >
            <Text style={[styles.detailStatusText, { color: getStatusColor(order.status) }]}>
              {getStatusLabel(order.status)}
            </Text>
          </View>

          <View style={[styles.detailCard, { backgroundColor: colors.card, ...Shadows.sm }]}>
            <Text style={[styles.detailCardTitle, { color: colors.textPrimary }]}>🧑 Cliente</Text>
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              Nombre: {order.customerName}
            </Text>
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              Telefono: {order.customerPhone || 'N/A'}
            </Text>
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              Direccion: {order.customerAddress || 'N/A'}
            </Text>
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              Fuente: {order.source}
            </Text>
          </View>

          <View style={[styles.detailCard, { backgroundColor: colors.card, ...Shadows.sm }]}>
            <Text style={[styles.detailCardTitle, { color: colors.textPrimary }]}>🛒 Items</Text>
            {order.items.map((item) => (
              <View key={item.id} style={styles.detailItem}>
                <Text style={[styles.detailItemName, { color: colors.textPrimary }]}>
                  {item.emoji || ''} {item.productName}
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

          <View
            style={[
              styles.detailCard,
              {
                backgroundColor: order.paymentReceived
                  ? `${Colors.exito}15`
                  : `${Colors.advertencia}15`,
                borderColor: order.paymentReceived ? `${Colors.exito}30` : `${Colors.advertencia}30`,
              },
            ]}
          >
            <Text
              style={[
                styles.detailCardTitle,
                { color: order.paymentReceived ? Colors.exito : Colors.advertencia },
              ]}
            >
              {order.paymentReceived ? '✅ Pago Registrado' : '⏳ Pago Pendiente'}
            </Text>
            {order.paymentReceived ? (
              <>
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  Metodo:{' '}
                  {order.paymentMethod === 'efectivo' ? '💵 Efectivo' : '🏦 Transferencia'}
                </Text>
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  Monto: {formatCurrency(order.amountPaid || 0)}
                </Text>
                {order.paymentMethod === 'efectivo' &&
                  order.amountPaid &&
                  order.amountPaid > order.total && (
                    <Text style={[styles.detailText, { color: Colors.exito }]}>
                      Vuelto: {formatCurrency(order.amountPaid - order.total)}
                    </Text>
                  )}
              </>
            ) : (
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                Registrar pago antes o despues de entregar
              </Text>
            )}
          </View>

          {order.notes && (
            <View style={[styles.detailCard, { backgroundColor: colors.card, ...Shadows.sm }]}>
              <Text style={[styles.detailCardTitle, { color: colors.textPrimary }]}>📝 Notas</Text>
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {order.notes}
              </Text>
            </View>
          )}

          {!order.paymentReceived && (
            <View style={[styles.detailCard, { backgroundColor: colors.card, ...Shadows.sm }]}>
              <Text style={[styles.detailCardTitle, { color: colors.textPrimary }]}>
                💰 Registrar Pago
              </Text>

              <View style={styles.paymentOptions}>
                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    { borderColor: colors.border },
                    paymentMethod === 'efectivo' && {
                      borderColor: colors.primary,
                      backgroundColor: `${colors.primary}15`,
                    },
                  ]}
                  onPress={() => setPaymentMethod('efectivo')}
                >
                  <Text style={styles.paymentEmoji}>💵</Text>
                  <Text
                    style={[
                      styles.paymentText,
                      { color: colors.textPrimary },
                      paymentMethod === 'efectivo' && { color: colors.primary, fontWeight: 'bold' },
                    ]}
                  >
                    Efectivo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    { borderColor: colors.border },
                    paymentMethod === 'transferencia' && {
                      borderColor: colors.primary,
                      backgroundColor: `${colors.primary}15`,
                    },
                  ]}
                  onPress={() => setPaymentMethod('transferencia')}
                >
                  <Text style={styles.paymentEmoji}>🏦</Text>
                  <Text
                    style={[
                      styles.paymentText,
                      { color: colors.textPrimary },
                      paymentMethod === 'transferencia' && {
                        color: colors.primary,
                        fontWeight: 'bold',
                      },
                    ]}
                  >
                    Transferencia
                  </Text>
                </TouchableOpacity>
              </View>

              {paymentMethod === 'efectivo' && (
                <View style={styles.amountSection}>
                  <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
                    💵 Monto entregado
                  </Text>
                  <TextInput
                    style={[
                      styles.amountInput,
                      { borderColor: colors.border, color: colors.textPrimary },
                    ]}
                    value={amountPaid.toString()}
                    onChangeText={(text) => setAmountPaid(parseInt(text) || 0)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.placeholder}
                  />

                  {amountPaid > 0 && (
                    <View
                      style={[
                        styles.changeBox,
                        { backgroundColor: `${Colors.exito}15`, borderColor: `${Colors.exito}30` },
                      ]}
                    >
                      <Text style={[styles.changeLabel, { color: Colors.exito }]}>💵 Vuelto:</Text>
                      <Text style={[styles.changeValue, { color: Colors.exito }]}>
                        {formatCurrency(orderChange > 0 ? orderChange : 0)}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <Button
                title="✅ Registrar Pago"
                onPress={handlePayment}
                style={styles.paymentButton}
              />
            </View>
          )}

          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <Button
              title={
                order.status === 'pending'
                  ? '✅ Confirmar Pedido'
                  : order.status === 'confirmed'
                  ? '👨‍🍳 Empezar a Preparar'
                  : order.status === 'preparing'
                  ? '📦 Marcar como Listo'
                  : order.status === 'ready'
                  ? '🛵 Salir a Entregar'
                  : '📍 Marcar como Entregado'
              }
              onPress={() => {
                handleAdvanceStatus(order.id, order.status);
                setCurrentView('orders');
              }}
              style={styles.detailAdvanceButton}
            />
          )}

          {order.status === 'delivered' && order.paymentReceived && (
            <Button
              title="💰 Marcar como Vendido"
              onPress={() => {
                orderStore.markAsSold(order.id);
                Alert.alert('✅ Vendido', 'Pedido marcado como vendido');
                setCurrentView('orders');
              }}
              style={styles.detailAdvanceButton}
            />
          )}

          {order.status !== 'cancelled' && order.status !== 'sold' && (
            <Button
              title="✕ Cancelar Pedido"
              variant="danger"
              onPress={() => handleCancelOrder(order.id)}
              style={styles.detailAdvanceButton}
            />
          )}
        </View>
      </ScrollView>
    );
  };

  const renderProductModal = () => (
    <Modal
      visible={modalVisible}
      transparent
      animationType="slide"
      onRequestClose={resetModal}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.modalOverlayBackdrop}
          activeOpacity={1}
          onPress={resetModal}
        />
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {selectedProduct && (
            <>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Crear Pedido
              </Text>

              <View
                style={[
                  styles.modalProductCard,
                  { backgroundColor: colors.card, ...Shadows.sm },
                ]}
              >
                <Text style={styles.modalProductEmoji}>
                  {selectedProduct.emoji || '🍽️'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalProductName, { color: colors.textPrimary }]}>
                    {selectedProduct.name}
                  </Text>
                  {selectedProduct.description && (
                    <Text
                      style={[styles.modalProductDesc, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {selectedProduct.description}
                    </Text>
                  )}
                  <Text style={[styles.modalProductPrice, { color: colors.primary }]}>
                    {formatCurrency(selectedProduct.salePrice)}
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Cantidad</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.card },
                  ]}
                  value={modalQuantity}
                  onChangeText={setModalQuantity}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={colors.placeholder}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                  Nombre del Cliente *
                </Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.card },
                  ]}
                  value={modalCustomerName}
                  onChangeText={setModalCustomerName}
                  placeholder="Nombre requerido"
                  placeholderTextColor={colors.placeholder}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Telefono</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.card },
                  ]}
                  value={modalCustomerPhone}
                  onChangeText={setModalCustomerPhone}
                  placeholder="Opcional"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Direccion</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.card },
                  ]}
                  value={modalCustomerAddress}
                  onChangeText={setModalCustomerAddress}
                  placeholder="Opcional"
                  placeholderTextColor={colors.placeholder}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Notas</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      borderColor: colors.border,
                      color: colors.textPrimary,
                      backgroundColor: colors.card,
                      minHeight: 60,
                      textAlignVertical: 'top',
                    },
                  ]}
                  value={modalNotes}
                  onChangeText={setModalNotes}
                  placeholder="Ej: sin cebolla, bien cocido..."
                  placeholderTextColor={colors.placeholder}
                  multiline
                />
              </View>

              <View
                style={[
                  styles.modalTotalPreview,
                  { backgroundColor: colors.card, ...Shadows.sm },
                ]}
              >
                <Text style={[styles.modalTotalLabel, { color: colors.textPrimary }]}>
                  Total Estimado
                </Text>
                <Text style={[styles.modalTotalValue, { color: colors.primary }]}>
                  {formatCurrency(
                    selectedProduct.salePrice * (parseInt(modalQuantity, 10) || 1),
                  )}
                </Text>
              </View>

              <View style={styles.modalActions}>
                <Button
                  title="Cancelar"
                  variant="outline"
                  onPress={resetModal}
                  style={{ flex: 1, marginRight: Spacing.sm }}
                />
                <Button
                  title="🛒 Crear Pedido"
                  onPress={handleCreateOrderFromModal}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerEmoji}>🛵</Text>
            <View>
              <Text style={styles.headerTitle}>Delivery</Text>
              <Text style={styles.headerSubtitle}>
                {currentView === 'dashboard'
                  ? 'Panel de Pedidos'
                  : currentView === 'menu'
                  ? 'Tomar Pedido'
                  : currentView === 'whatsapp'
                  ? 'Importar WhatsApp'
                  : currentView === 'orders'
                  ? 'Gestion de Pedidos'
                  : 'Detalle del Pedido'}
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

      {currentView === 'dashboard' && renderDashboard()}
      {currentView === 'menu' && renderMenu()}
      {currentView === 'whatsapp' && renderWhatsApp()}
      {currentView === 'orders' && renderOrders()}
      {currentView === 'order-detail' && renderOrderDetail()}

      {renderProductModal()}
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
    width: (width - Spacing.md * 2 - Spacing.sm * 2) / 3,
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
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    width: (width - Spacing.md * 2 - Spacing.sm * 2) / 3,
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
  orderActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  advanceButton: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  advanceButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    backgroundColor: Colors.error,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  tapHint: {
    marginTop: Spacing.xs,
  },
  tapHintText: {
    fontSize: 10,
    fontStyle: 'italic',
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
  paymentOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.sm,
  },
  paymentEmoji: {
    fontSize: 24,
  },
  paymentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  amountSection: {
    marginTop: Spacing.md,
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  amountInput: {
    height: 50,
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  changeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  changeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  changeValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  paymentButton: {
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlayBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  modalProductEmoji: {
    fontSize: 40,
    marginRight: Spacing.md,
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  modalProductDesc: {
    fontSize: 12,
    marginBottom: 4,
  },
  modalProductPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
  },
  modalTotalPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  modalTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});
