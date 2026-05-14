import { ReactNode } from 'react';
import { SafeAreaView, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Spacing, useTheme } from '../theme';

export const Screen = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => {
  const { colors } = useTheme();
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }, style]}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.marginMobile,
  },
});
