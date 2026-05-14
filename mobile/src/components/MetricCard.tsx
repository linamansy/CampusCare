import { StyleSheet, Text } from 'react-native';
import { Fonts, Spacing, TypeScale, useTheme } from '../theme';
import { Card } from './Card';

export const MetricCard = ({
  label,
  value,
  tone = 'primary',
}: {
  label: string;
  value: string | number;
  tone?: 'primary' | 'secondary' | 'muted';
}) => {
  const { colors } = useTheme();

  const borderColor = {
    primary: colors.primaryContainer,
    secondary: colors.secondaryContainer,
    muted: colors.surfaceHigh,
  }[tone];

  return (
    <Card style={[styles.card, { borderColor }]}>
      <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
  },
  value: {
    fontFamily: Fonts.display,
    fontSize: TypeScale.headline,
  },
  label: {
    marginTop: Spacing.xs,
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
