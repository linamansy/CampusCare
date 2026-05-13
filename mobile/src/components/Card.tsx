import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Shadows } from '../theme';

export const Card = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceLowest,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.surfaceHigh,
    padding: 16,
    ...Shadows.soft,
  },
});
