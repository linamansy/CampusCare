import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, Spacing, TypeScale, useTheme } from '../theme';
import { Card } from './Card';

type MetricTone = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'tertiary' | 'muted';

const ICON_MAP: Record<MetricTone, keyof typeof Ionicons.glyphMap> = {
  primary:   'stats-chart',
  secondary: 'layers',
  success:   'checkmark-circle',
  warning:   'time',
  error:     'alert-circle',
  tertiary:  'construct',
  muted:     'ellipse',
};

export const MetricCard = ({
  label,
  value,
  tone = 'primary',
  icon,
}: {
  label: string;
  value: string | number;
  tone?: MetricTone;
  icon?: keyof typeof Ionicons.glyphMap;
}) => {
  const { colors } = useTheme();

  const toneColors: Record<MetricTone, { bg: string; icon: string; text: string }> = {
    primary:   { bg: colors.primaryContainer,   icon: colors.primary,   text: colors.primary },
    secondary: { bg: colors.secondaryContainer, icon: colors.secondary, text: colors.secondary },
    tertiary:  { bg: colors.tertiaryContainer,  icon: colors.tertiary,  text: colors.tertiary },
    success:   { bg: colors.successContainer,   icon: colors.success,   text: colors.success },
    warning:   { bg: colors.warningContainer,   icon: colors.warning,   text: colors.warning },
    error:     { bg: colors.errorContainer,     icon: colors.error,     text: colors.error },
    muted:     { bg: colors.surfaceHigh,        icon: colors.textMuted, text: colors.textSecondary },
  };

  const tc = toneColors[tone];
  const resolvedIcon = icon ?? ICON_MAP[tone];

  return (
    <Card style={styles.card}>
      <View style={[styles.iconBadge, { backgroundColor: tc.bg }]}>
        <Ionicons name={resolvedIcon} size={18} color={tc.icon} />
      </View>
      <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.xs,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  value: {
    fontFamily: Fonts.display,
    fontSize: TypeScale.headline,
  },
  label: {
    fontFamily: Fonts.label,
    fontSize: TypeScale.label,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
