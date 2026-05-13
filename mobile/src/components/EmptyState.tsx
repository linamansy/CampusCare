import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Spacing, TypeScale } from '../theme';

export const EmptyState = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  return (
    <View style={styles.container}>
      <View style={styles.icon} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
    backgroundColor: Colors.surfaceHigh,
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: TypeScale.title,
    color: Colors.textPrimary,
  },
  subtitle: {
    marginTop: Spacing.xs,
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
