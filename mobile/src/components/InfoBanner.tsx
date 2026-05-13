import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Spacing, TypeScale } from '../theme';

export const InfoBanner = ({ title, message }: { title: string; message: string }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    borderRadius: 18,
    padding: Spacing.md,
  },
  title: {
    fontFamily: Fonts.title,
    fontSize: TypeScale.body,
    color: Colors.textPrimary,
  },
  message: {
    marginTop: Spacing.xs,
    fontFamily: Fonts.body,
    fontSize: TypeScale.bodySmall,
    color: Colors.textSecondary,
  },
});
