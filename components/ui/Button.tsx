import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  View
} from 'react-native';
import { colors } from '@/constants/colors';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  ...props
}) => {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.button,
      ...styles[size],
    };

    if (disabled) {
      return {
        ...baseStyle,
        ...styles[`${variant}Disabled`],
        ...style,
      };
    }

    return {
      ...baseStyle,
      ...styles[variant],
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      ...styles.buttonText,
      ...styles[`${size}Text`],
    };

    if (disabled) {
      return {
        ...baseStyle,
        ...styles[`${variant}DisabledText`],
        ...textStyle,
      };
    }

    return {
      ...baseStyle,
      ...styles[`${variant}Text`],
      ...textStyle,
    };
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? colors.light.background : colors.light.primary} 
        />
      ) : (
        <View style={styles.buttonContent}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={getTextStyle()}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
  },
  iconContainer: {
    marginRight: 8,
  },
  
  // Size variants
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  
  // Text size variants
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  
  // Button variants
  primary: {
    backgroundColor: colors.light.primary,
  },
  secondary: {
    backgroundColor: colors.light.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.light.primary,
  },
  text: {
    backgroundColor: 'transparent',
  },
  
  // Disabled variants
  primaryDisabled: {
    backgroundColor: colors.light.inactive,
  },
  secondaryDisabled: {
    backgroundColor: colors.light.inactive,
  },
  outlineDisabled: {
    borderColor: colors.light.inactive,
  },
  textDisabled: {
    backgroundColor: 'transparent',
  },
  
  // Text variants
  primaryText: {
    color: colors.light.background,
  },
  secondaryText: {
    color: colors.light.background,
  },
  outlineText: {
    color: colors.light.primary,
  },
  textText: {
    color: colors.light.primary,
  },
  
  // Disabled text variants
  primaryDisabledText: {
    color: colors.light.background,
  },
  secondaryDisabledText: {
    color: colors.light.background,
  },
  outlineDisabledText: {
    color: colors.light.inactive,
  },
  textDisabledText: {
    color: colors.light.inactive,
  },
});