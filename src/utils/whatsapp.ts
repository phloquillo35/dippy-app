import { Linking, Alert, Platform } from 'react-native';
import { CartItem, Order } from '@/types';
import { formatCurrency, formatDateTime } from '@/utils/uuid';

const WHATSAPP_PHONE_PREFIX = '549';

interface ReceiptData {
  orderId?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  channel: 'store' | 'delivery';
  customerName?: string;
  customerPhone?: string;
  userName?: string;
  date?: string;
}

const generateReceiptText = (data: ReceiptData): string => {
  const channelEmoji = data.channel === 'store' ? '🏪' : '🛵';
  const channelName = data.channel === 'store' ? 'Local' : 'Delivery';
  const date = data.date || new Date().toISOString();

  let receipt = '';
  receipt += `${channelEmoji} *DIPPY* - ${channelName}\n`;
  receipt += `━━━━━━━━━━━━━━━━━━━\n`;
  receipt += `🧾 RECIBO DE COMPRA\n\n`;
  receipt += `📅 ${formatDateTime(date)}\n`;

  if (data.orderId) {
    receipt += `📋 Pedido: #${data.orderId.slice(-6).toUpperCase()}\n`;
  }

  if (data.userName) {
    receipt += `👤 Atendido por: ${data.userName}\n`;
  }

  if (data.customerName) {
    receipt += `🧑 Cliente: ${data.customerName}\n`;
  }

  receipt += `\n*PRODUCTOS:*\n`;
  receipt += `───────────────────\n`;

  data.items.forEach((item, index) => {
    const emoji = item.emoji || '•';
    const variant = item.variantName ? ` (${item.variantName})` : '';
    receipt += `${emoji} ${item.productName}${variant}\n`;
    receipt += `   ${item.quantity}x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.totalPrice)}\n`;

    if (item.notes) {
      receipt += `   📝 ${item.notes}\n`;
    }

    if (index < data.items.length - 1) {
      receipt += `\n`;
    }
  });

  receipt += `\n───────────────────\n`;
  receipt += `💰 *Subtotal:* ${formatCurrency(data.subtotal)}\n`;

  if (data.discount > 0) {
    receipt += `🏷️ *Descuento:* ${data.discount}%\n`;
  }

  receipt += `\n🧮 *TOTAL:* ${formatCurrency(data.total)}\n`;
  receipt += `━━━━━━━━━━━━━━━━━━━\n`;

  if (data.channel === 'delivery') {
    receipt += `\n🛵 *DELIVERY*\n`;
    receipt += `📍 Se enviará a la dirección registrada\n`;
  }

  receipt += `\n¡Gracias por elegirnos! 🇦🇷\n`;
  receipt += `📞 Consultas: [Número de Dippy]\n`;

  return receipt;
};

export const sendReceiptWhatsApp = async (data: ReceiptData, phoneNumber?: string): Promise<boolean> => {
  try {
    const phone = phoneNumber || data.customerPhone;

    if (!phone) {
      Alert.alert(
        '📱 Enviar por WhatsApp',
        'Ingresá el número de teléfono del cliente (con código de área)',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Enviar sin número',
            onPress: () => openWhatsAppWithMessage(data, undefined),
          },
        ]
      );
      return false;
    }

    return await openWhatsAppWithMessage(data, phone);
  } catch (error) {
    console.error('Error sending WhatsApp receipt:', error);
    Alert.alert('Error', 'No se pudo enviar el recibo. Verificá que WhatsApp esté instalado.');
    return false;
  }
};

const openWhatsAppWithMessage = async (data: ReceiptData, phone?: string): Promise<boolean> => {
  const message = generateReceiptText(data);
  const encodedMessage = encodeURIComponent(message);

  let url: string;

  if (phone) {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('549') ? cleanPhone : `${WHATSAPP_PHONE_PREFIX}${cleanPhone}`;
    url = `https://wa.me/${fullPhone}?text=${encodedMessage}`;
  } else {
    url = `https://wa.me/?text=${encodedMessage}`;
  }

  const canOpen = await Linking.canOpenURL(url);

  if (!canOpen) {
    Alert.alert(
      'WhatsApp no disponible',
      '¿Tenés WhatsApp instalado? Podés copiar el recibo y enviarlo manualmente.',
      [
        { text: 'Copiar recibo', onPress: () => copyToClipboard(message) },
        { text: 'Cerrar', style: 'cancel' },
      ]
    );
    return false;
  }

  await Linking.openURL(url);
  return true;
};

const copyToClipboard = async (text: string) => {
  try {
    const Clipboard = await import('expo-clipboard');
    await Clipboard.setStringAsync(text);
    Alert.alert('📋 Copiado', 'El recibo se copió al portapapeles. Pegalo en WhatsApp.');
  } catch {
    Alert.alert('Error', 'No se pudo copiar al portapapeles');
  }
};

export const generateOrderSummary = (order: Order): string => {
  const data: ReceiptData = {
    orderId: order.id,
    items: order.items,
    subtotal: order.subtotal,
    discount: order.discount,
    total: order.total,
    channel: order.channel,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    userName: order.userName,
    date: order.createdAt,
  };

  return generateReceiptText(data);
};