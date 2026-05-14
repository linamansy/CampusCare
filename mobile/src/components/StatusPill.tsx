import { StyleSheet, Text, View } from 'react-native';
import { Fonts, Spacing, TypeScale, useTheme } from '../theme';

interface StatusPillProps {
  label: string;
  tone?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'muted';
}

export const StatusPill = ({ label, tone = 'muted' }: StatusPillProps) => {
  const { colors } = useTheme();

  const bgColor: Record<NonNullable<StatusPillProps['tone']>, string> = {
    primary: colors.primaryContainer,
    secondary: colors.secondaryContainer,
    tertiary: colors.tertiaryContainer,
    error: colors.errorContainer,
    muted: colors.surfaceHigh,
  };

  const textColor: Record<NonNullable<StatusPillProps['tone']>, string> = {
    primary: colors.onPrimary,
    secondary: colors.onSecondary,
    tertiary: colors.onTertiary,
    error: colors.error,
    muted: colors.textSecondary,
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
