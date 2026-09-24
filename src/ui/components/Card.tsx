import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { theme, tones, type Tone } from '@/ui/theme';
import { AppText } from './AppText';
import { AppIcon, type IconName } from '@/ui/icons';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** 轻量强调（如统计看板）：投影更明显 */
  elevated?: boolean;
}

/** 卡片容器：无描边 + 暖色软阴影的贴纸感 */
export function Card({ children, style, elevated }: CardProps) {
  return <View style={[styles.card, elevated ? theme.shadows.float : theme.shadows.card, style]}>{children}</View>;
}

interface StatCardProps {
  label: string;
  value: string;
  /** 数值后的单位，小一号显示（如 "120" + "ml"） */
  unit?: string;
  hint?: string;
  accent?: string;
  /** 左上角矢量图标 */
  icon?: IconName;
  /** 马卡龙色调（气泡底色 + 数值颜色） */
  tone?: Tone;
}

/** 统计看板卡片：图标气泡 + 大数字(带小单位) + 可选说明 */
export function StatCard({ label, value, unit, hint, accent, icon, tone = 'coral' }: StatCardProps) {
  const t = tones[tone];
  const showUnit = unit != null && unit.length > 0 && value !== '—';
  return (
    <View style={[styles.card, theme.shadows.card, styles.statCard]}>
      <View style={styles.topRow}>
        {icon != null && (
          <View style={[styles.iconBubble, { backgroundColor: t.soft }]}>
            <AppIcon name={icon} size={17} color={t.deep} strokeWidth={2.2} />
          </View>
        )}
        <AppText variant="caption" style={styles.label}>{label}</AppText>
      </View>
      <View style={styles.valueRow}>
        <AppText variant="stat" style={accent != null ? { color: accent } : styles.value}>
          {value}
        </AppText>
        {showUnit && (
          <AppText variant="body" style={[styles.unit, accent != null && { color: accent }]}>
            {unit}
          </AppText>
        )}
      </View>
      {hint != null && hint.length > 0 && (
        <AppText variant="caption" style={styles.hint}>
          {hint}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
  },
  statCard: { flex: 1, minWidth: 150, gap: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontWeight: '500' },
  value: { color: theme.colors.text },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, paddingBottom: 2 },
  unit: { fontWeight: '700', fontSize: 14, lineHeight: 20, color: theme.colors.textSubdued },
  hint: { marginTop: 0 },
});
