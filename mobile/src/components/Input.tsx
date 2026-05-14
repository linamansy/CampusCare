import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Fonts, Spacing, TypeScale, useTheme } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
}

export const Input = ({ label, error, style, ...props }: InputProps) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.surfaceLowest, borderColor: colors.outlineVariant, color: colors.textPrimary },
          error ? { borderColor: colors.error } : null,
          style,
        ]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: Fonts.labelBold,
    fontSize: TypeScale.label,
    marginBottom: Spacing.xs,
    letterSpacing: 0.8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontFamily: Fonts.body,
    fontSize: TypeScale.body,
  },
  error: {
    marginTop: Spacing.xs,
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
  },
});
