import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { useColors, useShadow } from '@/theme/ThemeProvider';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = ({
  children,
  onPress,
  style,
  variant = 'default',
  padding = 'md',
}: CardProps) => {
  const colors = useColors();
  const shadowDefault = useShadow('sm');
  const shadowElevated = useShadow('md');

  const getCardStyle = (): ViewStyle => {
    const paddings: Record<string, ViewStyle> = {
      none: {},
      sm: { padding: Spacing.sm },
      md: { padding: Spacing.md },
      lg: { padding: Spacing.lg },
    };

    const variants: Record<string, ViewStyle> = {
      default: {
        backgroundColor: colors.card,
        ...shadowDefault,
      },
      elevated: {
        backgroundColor: colors.card,
        ...shadowElevated,
      },
      outlined: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
      },
      filled: {
        backgroundColor: colors.surfaceVariant,
      },
    };

    return {
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
      ...paddings[padding],
      ...variants[variant],
    };
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[getCardStyle(), style]}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[getCardStyle(), style]}>{children}</View>;
};

interface ProductCardProps {
  name: string;
  emoji?: string;
  price: number;
  stock: number;
  category: string;
  onPress?: () => void;
  isLowStock?: boolean;
}

export const ProductCard = ({
  name,
  emoji,
  price,
  stock,
  category,
  onPress,
  isLowStock,
}: ProductCardProps) => {
  const colors = useColors();
  const formatPrice = (p: number) => `$${p.toLocaleString('es-AR')}`;

  return (
    <Card onPress={onPress} variant="elevated" padding="md" style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={[styles.emojiContainer, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={styles.emoji}>{emoji || '📦'}</Text>
        </View>
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.category, { color: colors.textSecondary }]}>
            {category}
          </Text>
        </View>
      </View>

      <View style={styles.productFooter}>
        <Text style={[styles.price, { color: colors.primary }]}>{formatPrice(price)}</Text>
        <View style={[
          styles.stockBadge,
          {
            backgroundColor: isLowStock
              ? `${Colors.error}20`
              : `${Colors.exito}20`,
          },
        ]}>
          <Text style={[
            styles.stockText,
            { color: isLowStock ? Colors.error : Colors.exito },
          ]}>
            {stock} u.
          </Text>
        </View>
      </View>
    </Card>
  );
};

interface CartItemCardProps {
  name: string;
  emoji?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variantName?: string;
  notes?: string;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

export const CartItemCard = ({
  name,
  emoji,
  quantity,
  unitPrice,
  totalPrice,
  variantName,
  notes,
  onQuantityChange,
  onRemove,
}: CartItemCardProps) => {
  const colors = useColors();
  const formatPrice = (p: number) => `$${p.toLocaleString('es-AR')}`;

  return (
    <Card variant="default" padding="md" style={styles.cartItem}>
      <View style={styles.cartItemContent}>
        <View style={[styles.cartEmoji, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={styles.emoji}>{emoji || '📦'}</Text>
        </View>

        <View style={styles.cartInfo}>
          <Text style={[styles.cartName, { color: colors.textPrimary }]} numberOfLines={1}>
            {name}
          </Text>
          {variantName && (
            <Text style={[styles.cartVariant, { color: colors.textSecondary }]}>
              {variantName}
            </Text>
          )}
          {notes && (
            <Text style={[styles.cartNotes, { color: colors.textSecondary }]}>
              {notes}
            </Text>
          )}
          <Text style={[styles.cartUnitPrice, { color: colors.textSecondary }]}>
            {formatPrice(unitPrice)} c/u
          </Text>
        </View>

        <View style={styles.cartActions}>
          <Text style={[styles.cartTotal, { color: colors.primary }]}>
            {formatPrice(totalPrice)}
          </Text>

          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[styles.qtyButton, { backgroundColor: colors.surfaceVariant }]}
              onPress={() => onQuantityChange(quantity - 1)}
            >
              <Text style={[styles.qtyButtonText, { color: colors.textPrimary }]}>-</Text>
            </TouchableOpacity>

            <Text style={[styles.qtyValue, { color: colors.textPrimary }]}>{quantity}</Text>

            <TouchableOpacity
              style={[styles.qtyButton, { backgroundColor: colors.primary }]}
              onPress={() => onQuantityChange(quantity + 1)}
            >
              <Text style={[styles.qtyButtonText, { color: colors.textOnPrimary }]}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
            <Text style={styles.removeIcon}>X</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  productCard: {
    marginBottom: Spacing.sm,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  productInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
  },
  category: {
    fontSize: 12,
    marginTop: 2,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cartItem: {
    marginBottom: Spacing.sm,
  },
  cartItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartEmoji: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  cartName: {
    fontSize: 15,
    fontWeight: '600',
  },
  cartVariant: {
    fontSize: 12,
    marginTop: 2,
  },
  cartNotes: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  cartUnitPrice: {
    fontSize: 11,
    marginTop: 2,
  },
  cartActions: {
    alignItems: 'flex-end',
    marginLeft: Spacing.sm,
  },
  cartTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    marginTop: 8,
    padding: 4,
  },
  removeIcon: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: 'bold',
  },
});