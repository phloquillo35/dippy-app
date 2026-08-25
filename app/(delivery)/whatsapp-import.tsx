import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useRouter } from 'expo-router';
import { parseWhatsAppMessage, formatOrderPreview, ParsedOrder } from '@/services/whatsapp';
import { useDeliveryCartStore } from '@/store/deliveryCartStore';
import { useUserStore } from '@/store/userStore';

export default function WhatsAppImportScreen() {
  const colors = useColors();
  const router = useRouter();
  const { currentUser } = useUserStore();
  const { addItem, setCustomerInfo, clearCart } = useDeliveryCartStore();
  const [message, setMessage] = useState('');
  const [parsed, setParsed] = useState<ParsedOrder | null>(null);

  const handleParse = () => {
    if (!message.trim()) return Alert.alert('Error', 'Pegá un mensaje de WhatsApp');
    const result = parseWhatsAppMessage(message, 'delivery');
    setParsed(result);
  };

  const handleImport = () => {
    if (!parsed || parsed.items.length === 0) return Alert.alert('Error', 'No hay productos para importar');

    Alert.alert(
      'Importar pedido',
      `${parsed.items.length} productos detectados\nTotal: $${parsed.items.reduce((s, i) => s + i.totalPrice, 0).toLocaleString()}\nConfianza: ${Math.round(parsed.confidence * 100)}%`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Importar al carrito',
          onPress: () => {
            clearCart();
            parsed.items.forEach(item => {
              const product = { id: item.productId, name: item.productName, salePrice: item.unitPrice, costPrice: item.costPrice, emoji: item.emoji };
              addItem(product as any, undefined, item.quantity);
            });
            setCustomerInfo({
              name: parsed.customerName,
              phone: parsed.customerPhone,
            });
            Alert.alert('✅', 'Pedido importado al carrito', [
              { text: 'Ver carrito', onPress: () => router.push('/(delivery)/cart') },
              { text: 'OK' },
            ]);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      <View style={[styles.headerCard, { backgroundColor: Colors.whatsappGreen }]}>
        <Text style={styles.headerEmoji}>💬</Text>
        <Text style={styles.headerTitle}>Importar desde WhatsApp</Text>
        <Text style={styles.headerDesc}>Copiá el mensaje del cliente y pegalo aquí</Text>
      </View>

      <Text style={[styles.label, { color: colors.textSecondary }]}>📋 Mensaje de WhatsApp</Text>
      <TextInput
        style={[styles.textArea, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.card }]}
        placeholder={'Ej:\n2x milanesa napolitana\n1x coca cola 2.25\nSin lechuga por favor'}
        placeholderTextColor={colors.textSecondary}
        multiline
        numberOfLines={8}
        value={message}
        onChangeText={setMessage}
      />

      <TouchableOpacity style={[styles.parseBtn, { backgroundColor: Colors.whatsappGreen }]} onPress={handleParse}>
        <Text style={styles.parseBtnText}>🔍 Detectar productos</Text>
      </TouchableOpacity>

      {parsed && (
        <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.previewHeader}>
            <Text style={[styles.previewTitle, { color: colors.textPrimary }]}>Vista previa</Text>
            <View style={[styles.confidenceBadge, { backgroundColor: parsed.confidence > 0.7 ? `${Colors.exito}20` : `${Colors.advertencia}20` }]}>
              <Text style={{ color: parsed.confidence > 0.7 ? Colors.exito : Colors.advertencia, fontSize: 12, fontWeight: '600' }}>
                {Math.round(parsed.confidence * 100)}% confianza
              </Text>
            </View>
          </View>

          <Text style={[styles.previewText, { color: colors.textPrimary }]}>{formatOrderPreview(parsed)}</Text>

          {parsed.items.length > 0 && (
            <TouchableOpacity style={[styles.importBtn, { backgroundColor: Colors.whatsappGreen }]} onPress={handleImport}>
              <Text style={styles.importBtnText}>
                ✅ Importar {parsed.items.length} productos al carrito
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={[styles.helpCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.helpTitle, { color: colors.textPrimary }]}>💡 Ejemplos de mensajes</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>
          {'• 2x milanesa napolitana\n• 1x coca cola 2.25\n• docena de empanadas\n• sandwich de lomo\n• 3x pizza muzzarella'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.md },
  headerCard: { padding: Spacing.lg, borderRadius: BorderRadius.xl, alignItems: 'center', marginBottom: Spacing.xl },
  headerEmoji: { fontSize: 48, marginBottom: 8 },
  headerTitle: { color: Colors.blanco, fontSize: 20, fontWeight: 'bold' },
  headerDesc: { color: Colors.blanco, fontSize: 13, opacity: 0.9, marginTop: 4 },
  label: { fontSize: 13, marginBottom: 6, marginTop: 8 },
  textArea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, height: 160, textAlignVertical: 'top', marginBottom: 12 },
  parseBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  parseBtnText: { color: Colors.blanco, fontSize: 16, fontWeight: 'bold' },
  previewCard: { padding: Spacing.lg, borderRadius: BorderRadius.xl, borderWidth: 2, marginBottom: 16 },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  previewTitle: { fontSize: 16, fontWeight: 'bold' },
  confidenceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  previewText: { fontSize: 14, lineHeight: 22, marginBottom: 12 },
  importBtn: { padding: 14, borderRadius: 12, alignItems: 'center' },
  importBtnText: { color: Colors.blanco, fontSize: 16, fontWeight: 'bold' },
  helpCard: { padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, marginTop: 8 },
  helpTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
});
