import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Colors, Fonts, Spacing, TypeScale } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
}

export const Input = ({ label, error, style, ...props }: InputProps) => {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={Colors.textMuted}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: Colors.surfaceLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontFamily: Fonts.body,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
  },
  inputError: {
    borderColor: Colors.error,
  },
  error: {
    marginTop: Spacing.xs,
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
    color: Colors.error,
  },
});
