import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Fonts, Shadows, Spacing, TypeScale, useTheme } from '../theme';

interface InputModalProps {
  visible: boolean;
  title: string;
  placeholder?: string;
  multiline?: boolean;
  onConfirm: (text: string) => void;
  onCancel: () => void;
  confirmLabel?: string;
  required?: boolean;
}

export const InputModal = ({
  visible,
  title,
  placeholder = 'Enter reason...',
  multiline = true,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  required = true,
}: InputModalProps) => {
  const { colors } = useTheme();
  const [text, setText] = useState('');

  const handleConfirm = () => {
    if (required && !text.trim()) return;
    onConfirm(text.trim());
    setText('');
  };

  const handleCancel = () => {
    setText('');
    onCancel();
  };

  const canConfirm = required ? text.trim().length > 0 : true;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <Pressable style={styles.overlay} onPress={handleCancel}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surfaceLowest, borderColor: colors.surfaceHigh }, Shadows.soft]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.surfaceHigh,
                  color: colors.textPrimary,
                },
                multiline && styles.inputMultiline,
              ]}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              value={text}
              onChangeText={setText}
              multiline={multiline}
              numberOfLines={multiline ? 4 : 1}
              autoFocus
            />
            <View style={styles.actions}>
              <Pressable
                style={[styles.btn, { backgroundColor: colors.surfaceHigh }]}
                onPress={handleCancel}
              >
                <Text style={[styles.btnText, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.btn,
                  styles.btnPrimary,
                  { backgroundColor: colors.primary },
                  !canConfirm && styles.btnDisabled,
                ]}
                onPress={handleConfirm}
                disabled={!canConfirm}
              >
                <Text style={[styles.btnText, { color: colors.onPrimary }]}>{confirmLabel}</Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  sheet: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    fontFamily: Fonts.headline,
    fontSize: TypeScale.title,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.md,
    fontFamily: Fonts.body,
    fontSize: TypeScale.body,
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnPrimary: {
    flex: 1.5,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    fontFamily: Fonts.title,
    fontSize: TypeScale.bodySmall,
  },
});
