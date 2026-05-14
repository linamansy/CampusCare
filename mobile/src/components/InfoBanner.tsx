import { StyleSheet, Text, View } from 'react-native';
import { Fonts, Spacing, TypeScale, useTheme } from '../theme';

export const InfoBanner = ({ title, message }: { title: string; message: string }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceLow, borderColor: colors.outlineVariant }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 18,
    padding: Spacing.md,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: TypeScale.body,
  },
  message: {
    marginTop: Spacing.xs,
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
  },
});
