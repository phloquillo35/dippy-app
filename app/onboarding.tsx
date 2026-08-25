import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useUserStore } from '@/store/userStore';
import { useProductStore } from '@/store/productStore';

const STEPS = ['welcome', 'business', 'products', 'ready'] as const;
type Step = typeof STEPS[number];

export default function OnboardingScreen() {
  const colors = useColors();
  const { users } = useUserStore();
  const [step, setStep] = useState<Step>('welcome');
  const [businessName, setBusinessName] = useState('');
  const [cuit, setCuit] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<'kiosko' | 'delivery' | 'both'>('both');

  const stepIndex = STEPS.indexOf(step);

  const handleFinish = () => {
    Alert.alert(
      '¡Listo!',
      'Tu app está configurada. Podés agregar más productos y configurar precios desde la pantalla de Stock.',
      [{ text: '¡Empezar!', onPress: () => router.replace('/') }]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.progressBar}>
        {STEPS.map((s, i) => (
          <View key={s} style={[styles.progressDot, { backgroundColor: i <= stepIndex ? Colors.celesteInstitucional : colors.border }]} />
        ))}
      </View>

      {step === 'welcome' && (
        <View style={styles.stepContent}>
          <Text style={styles.welcomeEmoji}>🇦🇷</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>¡Bienvenido a Dippy!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Tu sistema POS para Kiosko y Delivery. Vamos a configurarlo en unos pasos.
          </Text>
          <TouchableOpacity style={[styles.nextBtn, { backgroundColor: Colors.celesteInstitucional }]} onPress={() => setStep('business')}>
            <Text style={styles.nextBtnText}>Configurar mi negocio →</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'business' && (
        <View style={styles.stepContent}>
          <Text style={styles.stepEmoji}>🏪</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Tu negocio</Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Nombre del negocio</Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.card }]}
            placeholder="Ej: El Kiosco de Marta"
            placeholderTextColor={colors.placeholder}
            value={businessName}
            onChangeText={setBusinessName}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>CUIT (opcional)</Text>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.card }]}
            placeholder="20-12345678-9"
            placeholderTextColor={colors.placeholder}
            value={cuit}
            onChangeText={setCuit}
            keyboardType="numeric"
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>¿Qué negocios tenés?</Text>
          <View style={styles.businessRow}>
            {([
              { key: 'kiosko' as const, emoji: '🏪', label: 'Solo Kiosko' },
              { key: 'delivery' as const, emoji: '🍕', label: 'Solo Delivery' },
              { key: 'both' as const, emoji: '🔄', label: 'Ambos' },
            ]).map(b => (
              <TouchableOpacity
                key={b.key}
                style={[styles.businessBtn, { backgroundColor: selectedBusiness === b.key ? `${Colors.celesteInstitucional}20` : colors.card, borderColor: selectedBusiness === b.key ? Colors.celesteInstitucional : colors.border }]}
                onPress={() => setSelectedBusiness(b.key)}
              >
                <Text style={styles.businessEmoji}>{b.emoji}</Text>
                <Text style={{ color: selectedBusiness === b.key ? Colors.celesteInstitucional : colors.textPrimary, fontWeight: '600', fontSize: 13 }}>{b.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.nextBtn, { backgroundColor: Colors.celesteInstitucional }]} onPress={() => setStep('products')}>
            <Text style={styles.nextBtnText}>Siguiente →</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'products' && (
        <View style={styles.stepContent}>
          <Text style={styles.stepEmoji}>📦</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Productos</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Ya tienes productos de ejemplo cargados. Podés eliminarlos y agregar los tuyos desde la pestaña Stock.
          </Text>

          <View style={[styles.tipCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>💡 Tips para empezar:</Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>• Usá la pestaña "Stock" para agregar productos</Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>• Escaneá códigos de barras con la lupa</Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>• Seteá precios de costo para calcular márgenes</Text>
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>• Categorizá tus productos para encontrarlos rápido</Text>
          </View>

          <TouchableOpacity style={[styles.nextBtn, { backgroundColor: Colors.celesteInstitucional }]} onPress={() => setStep('ready')}>
            <Text style={styles.nextBtnText}>Siguiente →</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'ready' && (
        <View style={styles.stepContent}>
          <Text style={styles.readyEmoji}>🎉</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>¡Todo listo!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Tu app está configurada. Elegí tu negocio para empezar a vender.
          </Text>

          <View style={[styles.readyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.readyTitle, { color: colors.textPrimary }]}>Próximos pasos:</Text>
            <Text style={[styles.readyText, { color: colors.textSecondary }]}>1. Abrí la caja con un monto inicial</Text>
            <Text style={[styles.readyText, { color: colors.textSecondary }]}>2. Iniciá tu turno</Text>
            <Text style={[styles.readyText, { color: colors.textSecondary }]}>3. ¡Empezá a vender!</Text>
          </View>

          <TouchableOpacity style={[styles.nextBtn, { backgroundColor: Colors.exito }]} onPress={handleFinish}>
            <Text style={styles.nextBtnText}>¡Empezar a usar Dippy! 🚀</Text>
          </TouchableOpacity>
        </View>
      )}

      {stepIndex > 0 && (
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(STEPS[stepIndex - 1])}>
          <Text style={{ color: colors.textSecondary }}>← Volver</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  progressBar: { flexDirection: 'row', gap: 8, marginBottom: 32, marginTop: 20 },
  progressDot: { flex: 1, height: 4, borderRadius: 2 },
  stepContent: { alignItems: 'center' },
  welcomeEmoji: { fontSize: 72, marginBottom: 16 },
  stepEmoji: { fontSize: 64, marginBottom: 16 },
  readyEmoji: { fontSize: 72, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: 'center', marginBottom: 24, lineHeight: 22, paddingHorizontal: 16 },
  label: { fontSize: 13, marginBottom: 6, marginTop: 12, alignSelf: 'flex-start' },
  input: { width: '100%', borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 4 },
  businessRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 },
  businessBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 2, gap: 6 },
  businessEmoji: { fontSize: 32 },
  tipCard: { width: '100%', padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: 20 },
  tipTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  tipText: { fontSize: 13, lineHeight: 20 },
  readyCard: { width: '100%', padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: 20 },
  readyTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  readyText: { fontSize: 13, lineHeight: 22 },
  nextBtn: { width: '100%', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  nextBtnText: { color: Colors.blanco, fontSize: 16, fontWeight: 'bold' },
  backBtn: { alignSelf: 'center', marginTop: 16, padding: 12 },
});
