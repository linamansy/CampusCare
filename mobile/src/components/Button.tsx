import { Pressable, StyleSheet, Text, StyleProp, ViewStyle } from 'react-native';
import { Fonts, Spacing, TypeScale, useTheme } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const Button = ({ title, onPress, variant = 'primary', style, disabled }: ButtonProps) => {
  const { colors } = useTheme();

  const bgColor: Record<ButtonVariant, string> = {
    primary: colors.primary,
    secondary: colors.secondary,
    outline: 'transparent',
    ghost: colors.surfaceHigh,
    danger: colors.error,
  };

  const textColor: Record<ButtonVariant, string> = {
    primary: colors.onPrimary,
    secondary: colors.onSecondary,
    outline: colors.primary,
    ghost: colors.textPrimary,
    danger: colors.onError,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bgColor[variant] },
        variant === 'outline' && { borderWidth: 1.5, borderColor: colors.primary },
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Text style={[styles.label, { color: textColor[variant] }]}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    fontFamily: Fonts.title,
    fontSize: TypeScale.title,
  },
});
