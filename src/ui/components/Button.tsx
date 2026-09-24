import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { theme } from '@/ui/theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'md' | 'sm';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  block?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** 主操作按钮：胶囊形 + 弹簧按压，primary / secondary / danger / ghost 四种形态 */
export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const disabledNow = disabled || loading;
  return (
    <PressableScale
      disabled={disabledNow}
      scaleTo={0.94}
      accessibilityLabel={title}
      {...rest}
      style={[
        styles.base,
        styles[variant],
        size === 'sm' && styles.sm,
        block && styles.block,
        disabledNow && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={indicatorColor(variant)} />
      ) : (
        <AppText variant="body" style={[styles.label, labelColor(variant), size === 'sm' && styles.smLabel]}>
          {title}
        </AppText>
      )}
    </PressableScale>
  );
}

function indicatorColor(variant: ButtonVariant): string {
  return variant === 'primary' || variant === 'danger' ? '#FFFFFF' : theme.colors.primaryDeep;
}

function labelColor(variant: ButtonVariant) {
  switch (variant) {
    case 'primary':
    case 'danger':
      return { color: '#FFFFFF' };
    case 'secondary':
      return { color: theme.colors.primaryDeep };
    case 'ghost':
      return { color: theme.colors.textSubdued };
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: 13,
    paddingHorizontal: theme.spacing.xl,
  },
  primary: { backgroundColor: theme.colors.primary, ...theme.shadows.float },
  secondary: { backgroundColor: theme.colors.primarySoft },
  danger: { backgroundColor: theme.colors.danger, ...theme.shadows.float },
  ghost: { backgroundColor: 'transparent' },
  sm: { paddingVertical: 8, paddingHorizontal: theme.spacing.lg },
  smLabel: { fontSize: 13 },
  block: { flex: 1 },
  disabled: { opacity: 0.5 },
  label: { fontWeight: '700' },
});
