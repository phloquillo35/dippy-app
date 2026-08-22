import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider defaultScheme="light">
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: '#00C8FF',
              },
              headerTintColor: '#FFFFFF',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              contentStyle: {
                backgroundColor: '#FFFFFF',
              },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="scanner"
              options={{
                title: '📱 Escanear Código',
                presentation: 'fullScreenModal',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="products/add"
              options={{
                title: '➕ Agregar Producto',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="products/[id]"
              options={{
                title: '📦 Detalle Producto',
              }}
            />
            <Stack.Screen
              name="providers/add"
              options={{
                title: '🏢 Agregar Proveedor',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="providers/[id]"
              options={{
                title: '🏢 Detalle Proveedor',
              }}
            />
            <Stack.Screen
              name="users/login"
              options={{
                title: '👤 Iniciar Turno',
                presentation: 'modal',
              }}
            />

          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}