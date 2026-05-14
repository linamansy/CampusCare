import { StyleSheet, Text, View } from 'react-native';
import { Fonts, Spacing, TypeScale, useTheme } from '../theme';

export const EmptyState = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.icon, { backgroundColor: colors.surfaceHigh }]} />
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  icon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: TypeScale.title,
  },
  subtitle: {
    marginTop: Spacing.xs,
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
    textAlign: 'center',
  },
});
