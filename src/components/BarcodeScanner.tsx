import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors } from '@/theme/ThemeProvider';

const { width } = Dimensions.get('window');
const SCANNER_SIZE = width * 0.7;

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose?: () => void;
  isActive?: boolean;
}

export const BarcodeScanner = ({ onScan, onClose, isActive = true }: BarcodeScannerProps) => {
  const colors = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    if (isActive && !scanned) {
      startScanAnimation();
    }
    return () => scanLineAnim.stopAnimation();
  }, [isActive, scanned]);

  const startScanAnimation = () => {
    scanLineAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;

    setScanned(true);

    Animated.sequence([
      Animated.spring(pulseAnim, {
        toValue: 1.2,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(pulseAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      onScan(data);
      setScanned(false);
    }, 500);
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.text, { color: colors.textPrimary }]}>
          📷 Solicitando permiso de cámara...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.emoji, { color: colors.textPrimary }]}>📷</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Necesitamos acceso a la cámara
        </Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          Para escanear códigos de barras, habilitá el permiso de cámara
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
        >
          <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>
            Dar permiso
          </Text>
        </TouchableOpacity>
        {onClose && (
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary, { borderColor: colors.border }]}
            onPress={onClose}
          >
            <Text style={[styles.buttonText, { color: colors.textPrimary }]}>
              Cancelar
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCANNER_SIZE - 4],
  });

  return (
    <View style={styles.scannerContainer}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
        }}
        onBarcodeScanned={isActive ? handleBarcodeScanned : undefined}
      />

      <View style={styles.overlay}>
        <View style={styles.topOverlay} />

        <View style={styles.scannerRow}>
          <View style={styles.sideOverlay} />

          <View style={styles.scannerFrame}>
            <View style={[styles.corner, styles.cornerTopLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.cornerTopRight, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.cornerBottomLeft, { borderColor: colors.primary }]} />
            <View style={[styles.corner, styles.cornerBottomRight, { borderColor: colors.primary }]} />

            <Animated.View
              style={[
                styles.scanLine,
                {
                  backgroundColor: colors.primary,
                  transform: [{ translateY: scanLineTranslateY }],
                },
              ]}
            />

            <Animated.View
              style={[
                styles.pulseCircle,
                {
                  borderColor: colors.primary,
                  transform: [{ scale: pulseAnim }],
                  opacity: scanned ? 1 : 0,
                },
              ]}
            >
              <Text style={styles.checkmark}>✓</Text>
            </Animated.View>
          </View>

          <View style={styles.sideOverlay} />
        </View>

        <View style={styles.bottomOverlay}>
          <Text style={[styles.scannerText, { color: '#FFFFFF' }]}>
            {scanned ? '✅ ¡Código escaneado!' : '📱 Apuntá al código de barras'}
          </Text>

          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={() => setFlashOn(!flashOn)}
            >
              <Text style={styles.controlIcon}>{flashOn ? '🔦' : '💡'}</Text>
              <Text style={styles.controlLabel}>
                {flashOn ? 'Apagar' : 'Encender'}
              </Text>
            </TouchableOpacity>

            {onClose && (
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                onPress={onClose}
              >
                <Text style={styles.controlIcon}>❌</Text>
                <Text style={styles.controlLabel}>Cerrar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scannerRow: {
    flexDirection: 'row',
    height: SCANNER_SIZE,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scannerFrame: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 3,
    borderRadius: 2,
  },
  pulseCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -30,
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(58, 170, 53, 0.9)',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Spacing.xl,
  },
  scannerText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  controlButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 80,
  },
  controlIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  controlLabel: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  emoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});