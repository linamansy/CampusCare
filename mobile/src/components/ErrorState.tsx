import { StyleSheet, Text, View } from 'react-native';
import { Fonts, Spacing, TypeScale, useTheme } from '../theme';
import { Button } from './Button';

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.icon, { backgroundColor: colors.errorContainer }]} />
      <Text style={[styles.title, { color: colors.textPrimary }]}>Something went wrong</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      {onRetry ? <Button title="Try Again" onPress={onRetry} style={styles.button} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: TypeScale.title,
  },
  message: {
    marginTop: Spacing.xs,
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
    textAlign: 'center',
  },
  button: {
    marginTop: Spacing.md,
  },
});
