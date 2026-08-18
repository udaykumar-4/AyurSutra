import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Colors from '../constants/Colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryBtn;
      case 'danger':
        return styles.dangerBtn;
      case 'outline':
        return styles.outlineBtn;
      case 'primary':
      default:
        return styles.primaryBtn;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'outline':
        return styles.outlineText;
      case 'primary':
      case 'secondary':
      case 'danger':
      default:
        return styles.btnText;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return styles.smallBtn;
      case 'large':
        return styles.largeBtn;
      case 'medium':
      default:
        return styles.mediumBtn;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.baseBtn,
        getVariantStyle(),
        getSizeStyle(),
        disabled || loading ? styles.disabledBtn : null,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? Colors.primary : Colors.white} size="small" />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseBtn: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
  },
  secondaryBtn: {
    backgroundColor: Colors.secondary,
  },
  dangerBtn: {
    backgroundColor: Colors.error,
  },
  outlineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  mediumBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  largeBtn: {
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  btnText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  outlineText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  disabledBtn: {
    opacity: 0.65,
  },
});

export default Button;
