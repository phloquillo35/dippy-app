import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { WebAlertHost } from '@/components/WebAlertHost';
import { installWebAlert } from '@/utils/webAlert';

installWebAlert();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ThemeProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(kiosko)" />
            <Stack.Screen name="(delivery)" />
            <Stack.Screen name="(admin)" />
          </Stack>
          <WebAlertHost />
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
