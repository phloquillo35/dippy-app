import { Stack } from 'expo-router';
import { Colors } from '@/theme';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1A1A2E' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
        headerShown: true,
      }}
    >
      <Stack.Screen name="index" options={{ title: '📊 Panel Admin' }} />
    </Stack>
  );
}
