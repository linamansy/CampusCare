import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { Colors, Fonts, Spacing, TypeScale } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const Button = ({ title, onPress, variant = 'primary', style, disabled }: ButtonProps) => {
  const isDisabled = disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        stylesByVariant[variant],
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      <Text style={[styles.label, labelByVariant[variant]]}>{title}</Text>
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

const stylesByVariant = StyleSheet.create({
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  ghost: {
    backgroundColor: Colors.surfaceHigh,
  },
  danger: {
    backgroundColor: Colors.error,
  },
});

const labelByVariant = StyleSheet.create({
  primary: {
    color: Colors.onPrimary,
  },
  secondary: {
    color: Colors.onSecondary,
  },
  outline: {
    color: Colors.primary,
  },
  ghost: {
    color: Colors.textPrimary,
  },
  danger: {
    color: Colors.onError,
  },
});
