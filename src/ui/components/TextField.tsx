import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  View,
} from 'react-native';

import { theme } from '@/ui/theme';
import { AppText } from './AppText';

interface TextFieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  containerStyle?: StyleProp<TextStyle>;
}

/** 带标签的文本输入框（多行文本传 multiline）：聚焦时珊瑚橙描边 */
export function TextField({ label, hint, containerStyle, style, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.wrap, containerStyle]}>
      {label != null && <AppText variant="caption" style={styles.label}>{label}</AppText>}
      <TextInput
        placeholderTextColor={theme.colors.textSubdued}
        underlineColorAndroid="transparent"
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        {...rest}
        style={[styles.input, focused && styles.inputFocused, style]}
      />
      {hint != null && hint.length > 0 && (
        <AppText variant="caption" style={styles.hint}>
          {hint}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontWeight: '600', color: theme.colors.text },
  input: {
    backgroundColor: theme.colors.card,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 11,
    fontSize: 15,
    // iOS Safari 聚焦 <16px 输入框会自动放大页面且键盘收起后不回落，web 端强制 16
    ...Platform.select({ web: { fontSize: 16 } }),
    color: theme.colors.text,
  },
  inputFocused: { borderColor: theme.colors.primary },
  hint: { marginTop: 2 },
});
