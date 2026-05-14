import { StyleSheet, Text, View } from 'react-native';
import { Fonts, Spacing, TypeScale, useTheme } from '../theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  rightText?: string;
}

export const SectionHeader = ({ title, subtitle, rightText }: SectionHeaderProps) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {rightText ? <Text style={[styles.right, { color: colors.primary }]}>{rightText}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  left: {
    flex: 1,
  },
  title: {
    fontFamily: Fonts.headline,
    fontSize: TypeScale.headline,
  },
  subtitle: {
    marginTop: Spacing.xs,
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
  },
  right: {
    fontFamily: Fonts.labelBold,
    fontSize: TypeScale.label,
  },
});
