import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Fonts, Spacing, TypeScale, useTheme } from '../theme';

export const LoadingState = ({ label = 'Loading...' }: { label?: string }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  label: {
    marginTop: Spacing.md,
    fontFamily: Fonts.body,
    fontSize: TypeScale.body,
  },
});
