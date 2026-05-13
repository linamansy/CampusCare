import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Spacing, TypeScale } from '../theme';

interface StatusPillProps {
  label: string;
  tone?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'muted';
}

export const StatusPill = ({ label, tone = 'muted' }: StatusPillProps) => {
  return (
    <View style={[styles.base, stylesByTone[tone]]}>
      <Text style={[styles.label, labelByTone[tone]]}>{label}</Text>
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

const stylesByTone = StyleSheet.create({
  primary: { backgroundColor: Colors.primaryContainer },
  secondary: { backgroundColor: Colors.secondaryContainer },
  tertiary: { backgroundColor: Colors.tertiaryContainer },
  error: { backgroundColor: Colors.errorContainer },
  muted: { backgroundColor: Colors.surfaceHigh },
});

const labelByTone = StyleSheet.create({
  primary: { color: Colors.onPrimary },
  secondary: { color: Colors.onSecondary },
  tertiary: { color: Colors.onTertiary },
  error: { color: Colors.error },
  muted: { color: Colors.textSecondary },
});
