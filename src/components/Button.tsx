import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Gradients, TouchTarget } from '@/theme';
import { useColors, useShadow } from '@/theme/ThemeProvider';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) => {
  const colors = useColors();
  const shadow = useShadow('sm');
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle => {
    const sizes: Record<string, ViewStyle> = {
      sm: { paddingVertical: 8, paddingHorizontal: 16 },
      md: { paddingVertical: 12, paddingHorizontal: 20 },
      lg: { paddingVertical: 16, paddingHorizontal: 28 },
    };

    return {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.lg,
      minHeight: TouchTarget.minHeight,
      minWidth: TouchTarget.minWidth,
      ...sizes[size],
    };
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
      case 'danger':
      case 'success':
        return Colors.blanco;
      case 'secondary':
        return colors.textOnPrimary;
      case 'outline':
      case 'ghost':
        return colors.primary;
      default:
        return Colors.blanco;
    }
  };

  const getGradient = (): readonly [string, string, ...string[]] => {
    if (isDisabled) return [colors.disabled, colors.disabled];

    switch (variant) {
      case 'primary':
        return Gradients.buttonPrimary;
      case 'secondary':
        return Gradients.buttonSecondary;
      case 'danger':
        return [Colors.error, Colors.errorDark];
      case 'success':
        return [Colors.exito, Colors.successDark];
      default:
        return [colors.background, colors.background];
    }
  };

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" style={{ marginRight: icon ? 8 : 0 }} />
      ) : (
        icon && iconPosition === 'left' && (
          <Text style={[styles.icon, { color: getTextColor(), marginRight: 8 }]}>{icon}</Text>
        )
      )}
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: size === 'sm' ? 14 : size === 'lg' ? 18 : 16,
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
      {icon && iconPosition === 'right' && !loading && (
        <Text style={[styles.icon, { color: getTextColor(), marginLeft: 8 }]}>{icon}</Text>
      )}
    </>
  );

  if (variant === 'outline' || variant === 'ghost') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[
          getButtonStyle(),
          variant === 'outline' && {
            borderWidth: 2,
            borderColor: colors.primary,
            backgroundColor: 'transparent',
          },
          variant === 'ghost' && {
            backgroundColor: 'transparent',
          },
          fullWidth && { width: '100%' },
          isDisabled && { opacity: 0.5 },
          style,
        ]}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        fullWidth && { width: '100%' },
        isDisabled && { opacity: 0.5 },
        shadow,
        style,
      ]}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[getButtonStyle(), fullWidth && { width: '100%' }]}
      >
        {content}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  icon: {
    fontSize: 18,
  },
});