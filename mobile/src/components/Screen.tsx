import { ReactNode } from 'react';
import { SafeAreaView, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing } from '../theme';

export const Screen = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => {
  return <SafeAreaView style={[styles.container, style]}>{children}</SafeAreaView>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.marginMobile,
  },
});
