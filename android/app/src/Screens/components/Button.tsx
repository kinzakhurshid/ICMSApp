import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface ButtonProps {
  onPress?: () => void;
  title?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  disabled = false,
  loading = false,
  style,
  textStyle,
  variant = 'primary',
  size = 'medium',
  icon,
  children,
}) => {
  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    };

    // Size variations
    const sizeStyles: Record<string, ViewStyle> = {
      small: { paddingHorizontal: 12, paddingVertical: 8 },
      medium: { paddingHorizontal: 16, paddingVertical: 12 },
      large: { paddingHorizontal: 20, paddingVertical: 16 },
    };

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: '#f97316',
        borderWidth: 1,
        borderColor: '#f97316',
      },
      secondary: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
      },
      danger: {
        backgroundColor: '#EF4444',
        borderWidth: 1,
        borderColor: '#EF4444',
      },
      success: {
        backgroundColor: '#10B981',
        borderWidth: 1,
        borderColor: '#10B981',
      },
    };

    // Disabled styles
    const disabledStyles: ViewStyle = disabled ? {
      backgroundColor: '#9CA3AF',
      borderColor: '#9CA3AF',
      opacity: 0.6,
    } : {};

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...disabledStyles,
      ...style,
    };
  };

  const getTextStyles = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    };

    // Size variations
    const sizeStyles: Record<string, TextStyle> = {
      small: { fontSize: 14 },
      medium: { fontSize: 16 },
      large: { fontSize: 18 },
    };

    // Variant styles
    const variantStyles: Record<string, TextStyle> = {
      primary: { color: '#FFFFFF' },
      secondary: { color: '#374151' },
      danger: { color: '#FFFFFF' },
      success: { color: '#FFFFFF' },
    };

    // Disabled styles
    const disabledStyles: TextStyle = disabled ? {
      color: '#FFFFFF',
      opacity: 0.6,
    } : {};

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...disabledStyles,
      ...textStyle,
    };
  };

  const getIconColor = (): string => {
    if (disabled) return '#FFFFFF';
    
    switch (variant) {
      case 'primary':
      case 'danger':
      case 'success':
        return '#FFFFFF';
      case 'secondary':
        return '#374151';
      default:
        return '#FFFFFF';
    }
  };

  return (
    <TouchableOpacity
      style={getButtonStyles()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getIconColor()} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={size === 'small' ? 16 : size === 'large' ? 20 : 18}
              color={getIconColor()}
              style={title || children ? styles.iconWithText : styles.iconOnly}
            />
          )}
          {title && <Text style={getTextStyles()}>{title}</Text>}
          {children}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconWithText: {
    marginRight: 8,
  },
  iconOnly: {
    marginRight: 0,
  },
});
