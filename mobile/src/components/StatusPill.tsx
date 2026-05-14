import { StyleSheet, Text, View } from 'react-native';
import { Fonts, Spacing, TypeScale, useTheme } from '../theme';

type StatusTone = 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'muted';

interface StatusPillProps {
  label: string;
  tone?: StatusTone;
}

// Maps issue statuses to semantic tones
export const statusTone = (status?: string): StatusTone => {
  switch (status?.toLowerCase()) {
    case 'pending':       return 'warning';
    case 'assigned':      return 'primary';
    case 'in progress':   return 'tertiary';
    case 'under review':  return 'secondary';
    case 'resolved':      return 'success';
    case 'verified':      return 'success';
    case 'rejected':      return 'error';
    case 'rework':        return 'warning';
    default:              return 'muted';
  }
};

// Maps priority levels to semantic tones
export const priorityTone = (priority?: string): StatusTone => {
  switch (priority?.toLowerCase()) {
    case 'urgent':  return 'error';
    case 'high':    return 'warning';
    case 'normal':  return 'primary';
    case 'low':     return 'muted';
    default:        return 'muted';
  }
};

export const StatusPill = ({ label, tone = 'muted' }: StatusPillProps) => {
  const { colors } = useTheme();

  const bgColor: Record<StatusTone, string> = {
    primary:   colors.primaryContainer,
    secondary: colors.secondaryContainer,
    tertiary:  colors.tertiaryContainer,
    success:   colors.successContainer,
    warning:   colors.warningContainer,
    error:     colors.errorContainer,
    muted:     colors.surfaceHigh,
  };

  const textColor: Record<StatusTone, string> = {
    primary:   colors.primary,
    secondary: colors.secondary,
    tertiary:  colors.tertiary,
    success:   colors.success,
    warning:   colors.warning,
    error:     colors.error,
    muted:     colors.textSecondary,
  };

  return (
    <View style={[styles.base, { backgroundColor: bgColor[tone] }]}>
      <Text style={[styles.label, { color: textColor[tone] }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: Fonts.labelBold,
    fontSize: TypeScale.label,
    letterSpacing: 0.6,
  },
});
