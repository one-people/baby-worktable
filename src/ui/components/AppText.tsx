import React from 'react';
import { Text, type TextProps, type StyleProp, type TextStyle } from 'react-native';

import { typography } from '@/ui/theme';

export type AppTextVariant = keyof typeof typography;

interface AppTextProps extends TextProps {
  variant?: AppTextVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
}

/** 统一字体风格的文本组件 */
export function AppText({ variant = 'body', color, style, ...rest }: AppTextProps) {
  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={1.4}
      {...rest}
      style={[typography[variant], color != null ? { color } : undefined, style]}
    />
  );
}
