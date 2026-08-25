import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useProviderStore } from '@/store/providerStore';
import { Button } from '@/components/Button';
import { ProductCategory } from '@/types';

const CATS: ProductCategory[] = ['limpieza','cocina','comestibles','caramelos','fiambres','gaseosas','panaderia','comida_preparada'];
const CAT_LABELS: Record<string, string> = { limpieza:'Limpieza', cocina:'Cocina', comestibles:'Comestibles', caramelos:'Caramelos', fiambres:'Fiambres', gaseosas:'Gaseosas', panaderia:'Panaderia', comida_preparada:'Comida' };
const CAT_EMOJIS: Record<string, string> = { limpieza:'🧴', cocina:'🍳', comestibles:'🛒', caramelos:'🍬', fiambres:'🥩', gaseosas:'🥤', panaderia:'🥐', comida_preparada:'🍝' };

export default function AddProviderScreen() {
  const colors = useColors();
  const addProvider = useProviderStore(s => s.addProvider);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [cuit, setCuit] = useState('');
  const [payment, setPayment] = useState('');
  const [cats, setCats] = useState<ProductCategory[]>([]);
  const [rating, setRating] = useState(3);
  const [notes, setNotes] = useState('');

  const toggle = (c: ProductCategory) => setCats(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);

  const save = () => {
    if (!name.trim()) return Alert.alert('Error', 'Nombre obligatorio');
    addProvider({ name: name.trim(), contactPerson: contact.trim() || undefined, email: email.trim() || undefined, phone: phone.trim() || undefined, address: address.trim() || undefined, cuit: cuit.trim() || undefined, paymentTerms: payment.trim() || undefined, categories: cats, rating, isPreferred: false, isActive: true, notes: notes.trim() || undefined });
    Alert.alert('Exito', `${name} agregado`, [{ text: 'OK', onPress: () => router.back() }]);
  };

  const inputStyle = [styles.input, { borderColor: colors.border, color: colors.textPrimary }];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>Nombre *</Text>
        <TextInput style={inputStyle} placeholder="Nombre del proveedor" placeholderTextColor={colors.placeholder} value={name} onChangeText={setName} />
        <Text style={[styles.label, { color: colors.textPrimary }]}>Contacto</Text>
        <TextInput style={inputStyle} placeholder="Persona de contacto" placeholderTextColor={colors.placeholder} value={contact} onChangeText={setContact} />
        <Text style={[styles.label, { color: colors.textPrimary }]}>Telefono</Text>
        <TextInput style={inputStyle} placeholder="+54 11 5555-1234" placeholderTextColor={colors.placeholder} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Text style={[styles.label, { color: colors.textPrimary }]}>Email</Text>
        <TextInput style={inputStyle} placeholder="correo@ejemplo.com" placeholderTextColor={colors.placeholder} value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Text style={[styles.label, { color: colors.textPrimary }]}>Direccion</Text>
        <TextInput style={inputStyle} placeholder="Direccion completa" placeholderTextColor={colors.placeholder} value={address} onChangeText={setAddress} />
        <Text style={[styles.label, { color: colors.textPrimary }]}>CUIT</Text>
        <TextInput style={inputStyle} placeholder="XX-XXXXXXXX-X" placeholderTextColor={colors.placeholder} value={cuit} onChangeText={setCuit} keyboardType="numeric" />
        <Text style={[styles.label, { color: colors.textPrimary }]}>Condiciones de Pago</Text>
        <TextInput style={inputStyle} placeholder="30 dias, Contado" placeholderTextColor={colors.placeholder} value={payment} onChangeText={setPayment} />
      </View>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Categorias</Text>
        <View style={styles.chips}>
          {CATS.map(c => (
            <TouchableOpacity key={c} style={[styles.chip, { backgroundColor: cats.includes(c) ? colors.primary : colors.surfaceVariant }]} onPress={() => toggle(c)}>
              <Text style={{ fontSize: 14 }}>{CAT_EMOJIS[c]}</Text>
              <Text style={[styles.chipLabel, { color: cats.includes(c) ? colors.textOnPrimary : colors.textPrimary }]}>{CAT_LABELS[c]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Calificacion</Text>
        <View style={styles.stars}>
          {[1,2,3,4,5].map(s => <TouchableOpacity key={s} onPress={() => setRating(s)}><Text style={{ fontSize: 28, opacity: s <= rating ? 1 : 0.3 }}>*</Text></TouchableOpacity>)}
        </View>
      </View>
      <TextInput style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, marginHorizontal: 16, height: 80, textAlignVertical: 'top' }]} placeholder="Notas..." placeholderTextColor={colors.placeholder} value={notes} onChangeText={setNotes} multiline />
      <View style={styles.actions}>
        <Button title="Guardar Proveedor" onPress={save} icon="save" />
        <Button title="Cancelar" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 }, form: { padding: 16 }, label: { fontSize: 14, fontWeight: '600', marginBottom: 4, marginTop: 12 }, input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 }, section: { padding: 16 }, sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4 }, chipLabel: { fontSize: 13, fontWeight: '600' }, stars: { flexDirection: 'row', gap: 8 }, actions: { padding: 16, gap: 12 } });