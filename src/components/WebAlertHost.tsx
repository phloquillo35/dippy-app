import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AlertButton } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';
import { useWebAlertStore } from '@/utils/webAlert';

/** Muestra las alertas de `Alert.alert` en la versión web. En iOS y Android no renderiza nada. */
export function WebAlertHost() {
  const colors = useColors();
  const current = useWebAlertStore((s) => s.queue[0]);
  const shift = useWebAlertStore((s) => s.shift);

  if (Platform.OS !== 'web' || !current) return null;

  const press = (button?: AlertButton) => {
    shift(); // primero se cierra, así un onPress que abre otra alerta la encola bien
    button?.onPress?.();
  };

  const dismiss = () => {
    const cancel = current.buttons.find((b) => b.style === 'cancel');
    if (cancel) press(cancel);
    else {
      shift();
      current.onDismiss?.();
    }
  };

  const stacked = current.buttons.length > 2;

  return (
    <Modal key={current.id} transparent visible animationType="fade" onRequestClose={dismiss}>
      <Pressable
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
        onPress={current.cancelable ? dismiss : undefined}
      >
        <Pressable
          accessibilityRole="alert"
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>{current.title}</Text>
          {!!current.message && (
            <Text style={[styles.message, { color: colors.textSecondary }]}>{current.message}</Text>
          )}
          <View style={[styles.buttons, stacked && styles.buttonsStacked]}>
            {current.buttons.map((button, i) => {
              const isCancel = button.style === 'cancel';
              const isDestructive = button.style === 'destructive';
              return (
                <Pressable
                  key={`${button.text ?? 'btn'}-${i}`}
                  accessibilityRole="button"
                  onPress={() => press(button)}
                  style={[
                    styles.button,
                    !stacked && styles.buttonInline,
                    isCancel
                      ? { backgroundColor: colors.surfaceVariant }
                      : { backgroundColor: isDestructive ? Colors.error : colors.primary },
                  ]}
                >
                  <Text style={[styles.buttonText, { color: isCancel ? colors.textPrimary : Colors.blanco }]}>
                    {button.text ?? 'OK'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  title: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  message: { marginTop: Spacing.sm, fontSize: 15, lineHeight: 21, textAlign: 'center' },
  buttons: { marginTop: Spacing.lg, flexDirection: 'row', gap: Spacing.sm },
  buttonsStacked: { flexDirection: 'column' },
  button: { paddingVertical: 12, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
  buttonInline: { flex: 1 },
  buttonText: { fontSize: 16, fontWeight: '600' },
});
