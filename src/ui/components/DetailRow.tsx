import React from 'react';
import { StyleSheet, View } from 'react-native';

import { theme } from '@/ui/theme';
import { AppText } from './AppText';

interface DetailRowProps {
  label: string;
  /** 空值统一显示为 “—” */
  value?: string | null;
  /** 长文本（如描述）：值换行展示在标签下方 */
  multiline?: boolean;
}

/** 详情字段行：左标签右值；multiline 时上下排布，适合长描述 */
export function DetailRow({ label, value, multiline }: DetailRowProps) {
  const text = value == null || value.length === 0 ? '—' : value;
  if (multiline) {
    return (
      <View style={styles.block}>
        <AppText variant="caption" style={styles.label}>{label}</AppText>
        <AppText variant="body" style={styles.multilineValue} selectable>{text}</AppText>
      </View>
    );
  }
  return (
    <View style={styles.row}>
      <AppText variant="caption" style={styles.label}>{label}</AppText>
      <AppText variant="body" style={styles.value} selectable numberOfLines={2}>{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.lg },
  label: { width: 76, flexShrink: 0, paddingTop: 2 },
  value: { flex: 1, textAlign: 'right', fontWeight: '600' },
  block: { gap: 6 },
  multilineValue: { fontWeight: '600', lineHeight: 22 },
});
