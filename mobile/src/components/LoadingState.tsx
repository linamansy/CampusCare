import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Spacing, TypeScale } from '../theme';

export const LoadingState = ({ label = 'Loading...' }: { label?: string }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.label}>{label}</Text>
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
    color: Colors.textSecondary,
  },
});
