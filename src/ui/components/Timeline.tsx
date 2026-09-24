import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { theme, tones, type Tone } from '@/ui/theme';
import { AppText } from './AppText';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'] as const;

/** 时间轴日期标签：今天 / 昨天 + M月D日 周X */
export function timelineDayLabel(day: string): string {
  const d = new Date(`${day}T00:00:00`);
  if (Number.isNaN(d.getTime())) return day;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
  const base = `${d.getMonth() + 1}月${d.getDate()}日 周${WEEKDAYS[d.getDay()]}`;
  if (diffDays === 0) return `今天 · ${base}`;
  if (diffDays === 1) return `昨天 · ${base}`;
  return base;
}

/** 时间轴的日期分组胶囊，与下方轨道左对齐 */
export function TimelineDay({ label }: { label: string }) {
  return (
    <View style={styles.dayWrap}>
      <View style={styles.dayPill}>
        <AppText variant="caption" style={styles.dayText}>{label}</AppText>
      </View>
    </View>
  );
}

interface TimelineItemProps {
  /** 左侧时间列文本（如 13:41） */
  time: string;
  /** 轨道圆点色调，随记录类型区分 */
  tone?: Tone;
  /** 组内首条：轨道从圆点处开始 */
  first?: boolean;
  /** 组内末条：轨道到圆点处结束 */
  last?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
}

/** 时间轴单条：时间列 + 圆点轨道 + 内容卡片 */
export function TimelineItem({
  time,
  tone = 'coral',
  first = false,
  last = false,
  onPress,
  onLongPress,
  children,
}: TimelineItemProps) {
  const rail = (
    <View style={styles.railCol}>
      <View
        style={[
          styles.railLine,
          first && styles.railLineFirst,
          // 组内仅一条时保留向下的短轨，避免圆点悬空
          last && !first && styles.railLineLast,
        ]}
      />
      <View style={[styles.dot, { backgroundColor: tones[tone].deep, borderColor: theme.colors.bg }]} />
    </View>
  );
  const pressable = onPress != null || onLongPress != null;
  return (
    <View style={styles.itemRow}>
      <View style={styles.timeCol}>
        <AppText variant="caption" style={styles.timeText}>{time}</AppText>
      </View>
      {rail}
      <View style={styles.contentWrap}>
        {pressable ? (
          <Pressable
            accessibilityRole="button"
            onPress={onPress}
            onLongPress={onLongPress}
            style={({ pressed }) => [styles.card, theme.shadows.card, pressed && styles.pressed]}
          >
            {children}
          </Pressable>
        ) : (
          <View style={[styles.card, theme.shadows.card]}>{children}</View>
        )}
      </View>
    </View>
  );
}

// 日期胶囊与内容卡片左对齐：时间列宽 + 轨道列宽
const RAIL_LEFT = 44 + 22;

const styles = StyleSheet.create({
  dayWrap: { marginLeft: RAIL_LEFT, marginTop: 16, marginBottom: 10 },
  dayPill: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.chipOff,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 5,
  },
  dayText: { color: theme.colors.text, fontWeight: '700' },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  timeCol: { width: 44, alignItems: 'flex-end', paddingRight: 8 },
  timeText: { fontWeight: '600' },
  railCol: { width: 22, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  railLine: {
    position: 'absolute',
    left: 10,
    width: 2,
    top: 0,
    bottom: 0,
    borderRadius: 1,
    backgroundColor: theme.colors.rail,
  },
  railLineFirst: { top: '50%' },
  railLineLast: { bottom: '50%' },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
  },
  contentWrap: { flex: 1, paddingBottom: 10 },
  card: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 12,
    gap: 4,
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
});
