import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { theme } from '@/ui/theme';
import { AppText } from './AppText';

interface SegmentedControlProps<T extends string> {
  options: readonly T[];
  labels?: Partial<Record<T, string>>;
  value: T;
  onChange: (next: T) => void;
}

/**
 * 分段控件（iOS 风格）：胶囊容器 + 白色滑块选中态。
 * 用于单位偏好、生长指标等 2~3 个选项的单选。
 */
export function SegmentedControl<T extends string>({
  options,
  labels,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.track}>
      {options.map((opt) => {
        const selected = opt === value;
        return (
          <Pressable
            key={opt}
            accessibilityRole="checkbox"
            accessibilityState={{ selected }}
            onPress={() => onChange(opt)}
            style={[styles.segment, selected && styles.segmentActive]}
          >
            <AppText variant="body" style={selected ? styles.labelActive : styles.label}>
              {labels?.[opt] ?? opt}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: theme.colors.chipOff,
    borderRadius: theme.radius.pill,
    padding: 3,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
  },
  segmentActive: {
    backgroundColor: theme.colors.card,
    ...theme.shadows.card,
  },
  label: { color: theme.colors.textSubdued, fontWeight: '500', fontSize: 14 },
  labelActive: { color: theme.colors.text, fontWeight: '700', fontSize: 14 },
});
