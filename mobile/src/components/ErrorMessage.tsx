import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/src/theme/colors';

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.danger,
    borderRadius: 14,
    padding: 12,
    marginVertical: 12,
  },
  text: {
    color: Colors.card,
    fontWeight: '600',
    lineHeight: 20,
  },
});
