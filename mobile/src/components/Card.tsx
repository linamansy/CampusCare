import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Shadows, useTheme } from '../theme';

export const Card = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => {
  const { colors } = useTheme();

  return (
    <View 
      style={[
        styles.card, 
        { 
          backgroundColor: colors.surfaceLowest, 
          borderColor: colors.surfaceHigh 
        }, 
        style
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    ...Shadows.soft,
  },
});
