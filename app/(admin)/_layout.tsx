import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Colors } from '@/theme';
import { useUserStore } from '@/store/userStore';

export default function AdminLayout() {
  const router = useRouter();
  const { currentUser } = useUserStore();

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      router.replace('/');
    }
  }, [currentUser, router]);

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
