import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

// RNW 运行时提供 createElement（渲染 DOM 原生元素），原生端无此导出但 web 分支不会执行
const createElement: typeof React.createElement = (require('react-native') as unknown as {
  createElement?: typeof React.createElement;
}).createElement ?? React.createElement;

import type { ISODateTime } from '@/models/common';
import { formatDate, formatTime } from '@/core/utils/datetime';
import { theme } from '@/ui/theme';
import { AppText } from './AppText';

interface DateTimeFieldProps {
  label: string;
  value: ISODateTime;
  onChange: (next: ISODateTime) => void;
  /** date 模式只选日期（生日等） */
  mode?: 'date' | 'datetime';
}

/**
 * 日期时间选择：iOS 内联系统选择器；Android 弹系统对话框；
 * Web 叠加透明原生 input（date / datetime-local），点击唤起浏览器日历。
 */
export function DateTimeField({ label, value, onChange, mode = 'datetime' }: DateTimeFieldProps) {
  const [showAndroid, setShowAndroid] = useState(false);
  const date = new Date(value.replace(' ', 'T'));

  const pickerMode = mode === 'date' ? 'date' : Platform.OS === 'ios' ? 'datetime' : 'date';

  const handleChange = (_event: unknown, picked?: Date) => {
    if (Platform.OS === 'android') setShowAndroid(false);
    if (picked == null) return;
    if (mode === 'date') {
      const base = new Date(value.replace(' ', 'T'));
      picked.setHours(base.getHours(), base.getMinutes(), 0, 0);
    }
    onChange(toLocalISO(picked));
  };

  const display = `🗓️ ${mode === 'date' ? formatDate(value) : `${formatDate(value)} ${formatTime(value)}`}`;

  return (
    <View style={styles.wrap}>
      <AppText variant="caption" style={styles.label}>{label}</AppText>
      {Platform.OS === 'web' ? (
        <View style={styles.webField}>
          <View style={styles.fakeInput} pointerEvents="none">
            <AppText variant="body">{display}</AppText>
          </View>
          {createElement('input', {
            type: mode === 'date' ? 'date' : 'datetime-local',
            value: toWebValue(value, mode),
            max: toWebValue(toLocalISO(new Date()), mode),
            'aria-label': label,
            onChange: (e: { target: { value: string } }) => {
              const next = e.target.value;
              if (!next) return; // 用户清空时保留原值
              if (mode === 'date') {
                // 只换日期，保留原时间部分
                onChange(`${next}T${value.replace(' ', 'T').slice(11, 16)}:00`);
              } else {
                onChange(`${next.slice(0, 16)}:00`);
              }
            },
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
              fontSize: 16,
            },
          })}
        </View>
      ) : Platform.OS === 'ios' ? (
        <View style={styles.iosPickerWrap}>
          <DateTimePicker
            value={Number.isNaN(date.getTime()) ? new Date() : date}
            mode={pickerMode}
            display="compact"
            locale="zh-CN"
            onChange={handleChange}
            maximumDate={new Date()}
          />
        </View>
      ) : (
        <>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.fakeInput, pressed && styles.fakeInputPressed]}
            onPress={() => setShowAndroid(true)}
          >
            <AppText variant="body">{display}</AppText>
          </Pressable>
          {showAndroid && (
            <DateTimePicker
              value={Number.isNaN(date.getTime()) ? new Date() : date}
              mode={pickerMode}
              is24Hour
              onChange={handleChange}
              maximumDate={new Date()}
            />
          )}
        </>
      )}
      {mode === 'datetime' && Platform.OS === 'android' && (
        <TimeHint value={value} onChange={onChange} />
      )}
    </View>
  );
}

/** ISO 时间 → 原生 input 的 value 格式（date: YYYY-MM-DD；datetime-local: YYYY-MM-DDTHH:mm） */
function toWebValue(value: ISODateTime, mode: 'date' | 'datetime'): string {
  const normalized = value.replace(' ', 'T');
  return mode === 'date' ? normalized.slice(0, 10) : normalized.slice(0, 16);
}

/** Android 无 datetime 混合模式，单独提供时间微调（简化实现：按 15 分钟步进） */
function TimeHint({ value, onChange }: { value: ISODateTime; onChange: (v: ISODateTime) => void }) {
  const bump = (minutes: number) => {
    const d = new Date(value.replace(' ', 'T'));
    d.setMinutes(d.getMinutes() + minutes);
    onChange(toLocalISO(d));
  };
  return (
    <View style={styles.timeHintRow}>
      <Pressable style={styles.timeHintBtn} onPress={() => bump(-15)}>
        <AppText variant="caption">－15分钟</AppText>
      </Pressable>
      <AppText variant="caption">{formatTime(value)}</AppText>
      <Pressable style={styles.timeHintBtn} onPress={() => bump(15)}>
        <AppText variant="caption">＋15分钟</AppText>
      </Pressable>
    </View>
  );
}

function toLocalISO(d: Date): ISODateTime {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontWeight: '600', color: theme.colors.text },
  webField: { position: 'relative' },
  fakeInput: {
    backgroundColor: theme.colors.card,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
  },
  fakeInputPressed: { borderColor: theme.colors.primary, opacity: 0.85 },
  iosPickerWrap: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    paddingVertical: 4,
  },
  timeHintRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  timeHintBtn: {
    backgroundColor: theme.colors.chipOff,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
