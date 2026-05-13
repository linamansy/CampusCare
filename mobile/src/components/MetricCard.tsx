import { StyleSheet, Text } from 'react-native';
import { Colors, Fonts, Spacing, TypeScale } from '../theme';
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
  return (
    <Card style={[styles.card, toneStyles[tone]]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
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
    color: Colors.textPrimary,
  },
  label: {
    marginTop: Spacing.xs,
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
    color: Colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});

const toneStyles = StyleSheet.create({
  primary: {
    borderColor: Colors.primaryContainer,
  },
  secondary: {
    borderColor: Colors.secondaryContainer,
  },
  muted: {
    borderColor: Colors.surfaceHigh,
  },
});
