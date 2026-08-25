import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useColors } from '@/theme/ThemeProvider';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <View style={[styles.toast, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <View style={styles.toastText}>
            <View style={[styles.skeletonLine, { backgroundColor: colors.surfaceVariant, width: '80%' }]} />
            <View style={[styles.skeletonLine, { backgroundColor: colors.surfaceVariant, width: '60%', marginTop: 6 }]} />
          </View>
        </View>
      )}
    </View>
  );
}

export function SkeletonCard() {
  const colors = useColors();
  return (
    <View style={[styles.skeletonCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.skeletonCircle, { backgroundColor: colors.surfaceVariant }]} />
      <View style={styles.skeletonLines}>
        <View style={[styles.skeletonLine, { backgroundColor: colors.surfaceVariant, width: '70%' }]} />
        <View style={[styles.skeletonLine, { backgroundColor: colors.surfaceVariant, width: '50%', marginTop: 6 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  toast: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginTop: 20, gap: 12, borderWidth: 1 },
  toastText: { flex: 1 },
  skeletonCard: { flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 12 },
  skeletonCircle: { width: 48, height: 48, borderRadius: 24 },
  skeletonLines: { flex: 1, justifyContent: 'center' },
  skeletonLine: { height: 14, borderRadius: 4 },
});
