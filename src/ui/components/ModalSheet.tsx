import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { theme } from '@/ui/theme';
import { AppText } from './AppText';
import { AppIcon } from '@/ui/icons';

interface ModalSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** 底部弹层：顶部拖动手柄 + 大圆角，各模块“新增/编辑”表单的统一容器 */
export function ModalSheet({ visible, title, onClose, children, footer }: ModalSheetProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable accessibilityRole="button" style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.grip} />
          <View style={styles.header}>
            <AppText variant="heading">{title}</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="关闭"
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
            >
              <AppIcon name="close" size={17} color={theme.colors.textSubdued} strokeWidth={2.4} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer != null && <View style={styles.footer}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(74,55,40,0.4)' },
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: theme.colors.bg,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '86%',
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    ...theme.shadows.float,
  },
  grip: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.border,
    marginTop: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.chipOff,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md },
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
});
