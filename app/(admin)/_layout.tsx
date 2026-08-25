import { Stack } from 'expo-router';
import { Colors } from '@/theme';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.negroSuave },
        headerTintColor: Colors.blanco,
        headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
        headerShown: true,
      }}
    >
      <Stack.Screen name="index" options={{ title: '📊 Panel Admin' }} />
      <Stack.Screen name="reports" options={{ title: '📈 Reportes' }} />
      <Stack.Screen name="margins" options={{ title: '💰 Márgenes' }} />
      <Stack.Screen name="customers" options={{ title: '👥 Clientes' }} />
      <Stack.Screen name="team" options={{ title: '👷 Equipo' }} />
      <Stack.Screen name="reconciliation" options={{ title: '💳 Conciliación' }} />
      <Stack.Screen name="coupons" options={{ title: '🎫 Cupones' }} />
      <Stack.Screen name="returns" options={{ title: '↩︎ Devoluciones' }} />
    </Stack>
  );
}
