import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Spacing, TypeScale } from '../theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  rightText?: string;
}

export const SectionHeader = ({ title, subtitle, rightText }: SectionHeaderProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightText ? <Text style={styles.right}>{rightText}</Text> : null}
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
    color: Colors.textPrimary,
  },
  subtitle: {
    marginTop: Spacing.xs,
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
    color: Colors.textSecondary,
  },
  right: {
    fontFamily: Fonts.labelBold,
    fontSize: TypeScale.label,
    color: Colors.primary,
  },
});
