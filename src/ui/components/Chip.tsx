import React from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { theme } from '@/ui/theme';
import { AppText } from './AppText';
import { SeverityLevel } from '@/models/common';

interface ChipProps extends PressableProps {
  label: string;
  selected?: boolean;
}

/** 可选中标签（枚举单选/多选的基础交互件）：胶囊形，按下轻微缩放 */
export function Chip({ label, selected = false, disabled, ...rest }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ selected, disabled: disabled ?? undefined }}
      disabled={disabled}
      {...rest}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.selected : styles.unselected,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <AppText variant="body" style={selected ? styles.selectedLabel : styles.label}>
        {selected ? `✿ ${label}` : label}
      </AppText>
    </Pressable>
  );
}

/** 严重程度徽标：轻度绿 / 中度橙 / 重度红 */
export function SeverityTag({ severity }: { severity: SeverityLevel }) {
  const conf = {
    [SeverityLevel.Mild]: { bg: theme.colors.successSoft, fg: theme.colors.success, text: '😊 轻度' },
    [SeverityLevel.Moderate]: { bg: theme.colors.warningSoft, fg: theme.colors.warning, text: '😣 中度' },
    [SeverityLevel.Severe]: { bg: theme.colors.dangerSoft, fg: theme.colors.danger, text: '🤒 重度' },
  }[severity];
  return (
    <AppText variant="caption" style={[styles.tag, { backgroundColor: conf.bg, color: conf.fg }]}>
      {conf.text}
    </AppText>
  );
}

/** 通用小徽标 */
export function Tag({
  text,
  color = theme.colors.text,
  bg = theme.colors.infoSoft,
}: {
  text: string;
  color?: string;
  bg?: string;
}) {
  return (
    <AppText variant="caption" style={[styles.tag, { backgroundColor: bg, color }]}>
      {text}
    </AppText>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: theme.radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  unselected: { backgroundColor: theme.colors.chipOff },
  selected: { backgroundColor: theme.colors.primary },
  pressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
  disabled: { opacity: 0.4 },
  label: { color: theme.colors.textSubdued, fontWeight: '500' },
  selectedLabel: { color: '#FFFFFF', fontWeight: '700' },
  tag: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    fontWeight: '700',
  },
});
