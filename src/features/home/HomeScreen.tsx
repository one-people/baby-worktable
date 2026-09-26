import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { formatTime, formatAgeYMD, relativeTime } from '@/core/utils/datetime';
import { FEEDING_METHODS, VolumeUnit, labelOf } from '@/models/common';
import { fromMl } from '@/core/utils/volume';
import type { FeedingDayStats, FeedingRecord } from '@/models/Feeding';
import type { AbnormalEvent } from '@/models/AbnormalEvent';
import type { GrowthSummary } from '@/models/Growth';
import { useServices } from '@/services';
import { useApp } from '@/store/AppStore';
import {
  AppText,
  AppIcon,
  Button,
  Card,
  EmptyState,
  PressableScale,
  Screen,
  SectionTitle,
  theme,
  tones,
} from '@/ui';
import type { MainTabScreenProps } from '@/navigation/types';

type Props = MainTabScreenProps<'Home'>;

/** 距上次喂养超过该分钟数时，间隔条转为提醒态 */
const HUNGRY_AFTER_MIN = 180;

/** 最近记录流的条目：喂养与异常事件按时间混排 */
type FeedItem =
  | { kind: 'feeding'; record: FeedingRecord }
  | { kind: 'event'; record: AbnormalEvent };

function greetingByHour(): string {
  const h = new Date().getHours();
  if (h < 6) return '夜深啦，注意休息 🌙';
  if (h < 11) return '早安，新的一天 ☀️';
  if (h < 14) return '午安 🌤️';
  if (h < 18) return '下午好 🍃';
  return '晚安 🌙';
}

function formatInterval(minutes: number): string {
  if (minutes < 60) return `${minutes} 分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24) return m === 0 ? `${h} 小时` : `${h} 小时 ${m} 分`;
  const d = Math.floor(h / 24);
  return `${d} 天`;
}

/**
 * 首页：纯看板（导航交给底部 Tab）。
 * 视觉层级：珊瑚底「今日奶量」强调卡（第一眼）→ 白卡数字 → 区块标题 → 列表行。
 */
export function HomeScreen({ navigation }: Props) {
  const { feeding, event, growth } = useServices();
  const { activeBaby, volumeUnit, dataVersion } = useApp();

  const [stats, setStats] = useState<FeedingDayStats | null>(null);
  const [recentFeedings, setRecentFeedings] = useState<FeedingRecord[]>([]);
  const [lastEvent, setLastEvent] = useState<AbnormalEvent | null>(null);
  const [growthSummary, setGrowthSummary] = useState<GrowthSummary | null>(null);

  const load = useCallback(async () => {
    if (!activeBaby) return;
    const [s, feedings, events, summary] = await Promise.all([
      feeding.getDayStats(activeBaby.id),
      feeding.listForBaby(activeBaby.id, { limit: 2 }),
      event.listForBaby(activeBaby.id, { limit: 1 }),
      growth.getSummary(activeBaby),
    ]);
    setStats(s);
    setRecentFeedings(feedings);
    setLastEvent(events[0] ?? null);
    setGrowthSummary(summary);
  }, [activeBaby, feeding, event, growth, dataVersion]);

  // 切回首页时刷新统计（Tab 页常驻挂载，useEffect 只在首次挂载时执行一次）
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!activeBaby) {
    return (
      <Screen style={styles.center}>
        <EmptyState
          icon="👶"
          title="还没有宝宝档案"
          subtitle="先创建宝宝档案，喂养、事件、成长记录都会归属到宝宝名下。"
          action={<Button title="创建宝宝档案" onPress={() => navigation.navigate('BabyEditor')} />}
        />
      </Screen>
    );
  }

  const isOz = volumeUnit === VolumeUnit.OZ;
  const hasToday = stats != null && stats.totalCount > 0;
  const milkValue = stats
    ? isOz
      ? fromMl(stats.totalMl, VolumeUnit.OZ).toFixed(1)
      : `${Math.round(stats.totalMl)}`
    : '0';
  const milkUnit = isOz ? 'oz' : 'ml';
  const fmtVol = (ml?: number | null) =>
    ml == null ? null : isOz ? `${fromMl(ml, VolumeUnit.OZ).toFixed(1)} oz` : `${Math.round(ml)} ml`;

  const minutesSince = stats?.minutesSinceLast ?? null;
  const hungry = minutesSince != null && minutesSince >= HUNGRY_AFTER_MIN;
  const methodChips = stats
    ? FEEDING_METHODS.filter((m) => (stats.byMethod[m] ?? 0) > 0).map((m) => ({
        key: m,
        label: `${labelOf(m)} ×${stats.byMethod[m]}`,
      }))
    : [];

  // 最近记录流：喂养 + 异常事件按时间倒序合并
  const timeOf = (item: FeedItem): string =>
    item.kind === 'feeding' ? item.record.startedAt : item.record.occurredAt;
  const feedItems: FeedItem[] = [
    ...recentFeedings.map((record): FeedItem => ({ kind: 'feeding', record })),
    ...(lastEvent != null ? [{ kind: 'event' as const, record: lastEvent }] : []),
  ]
    .sort((a, b) => timeOf(b).localeCompare(timeOf(a)))
    .slice(0, 3);

  const growthCells = [
    { key: 'weight', label: '体重', value: growthSummary?.latestWeightG != null ? `${(growthSummary.latestWeightG / 1000).toFixed(1)}` : '—', unit: 'kg', dot: tones.mint.deep },
    { key: 'height', label: '身高', value: growthSummary?.latestHeightCm != null ? growthSummary.latestHeightCm.toFixed(1) : '—', unit: 'cm', dot: tones.sky.deep },
    { key: 'head', label: '头围', value: growthSummary?.latestHeadCircumferenceCm != null ? growthSummary.latestHeadCircumferenceCm.toFixed(1) : '—', unit: 'cm', dot: tones.lemon.deep },
  ];

  return (
    <Screen bottomInset>
      {/* 档案条：紧凑的宝宝信息 */}
      <View style={styles.profileBar}>
        <View style={styles.avatar}>
          <AppText style={styles.avatarEmoji}>👶</AppText>
        </View>
        <View style={styles.profileTexts}>
          <AppText variant="heading" numberOfLines={1}>
            {activeBaby.name} · {formatAgeYMD(activeBaby.birthDate)}
          </AppText>
          <AppText variant="caption" numberOfLines={1}>
            {greetingByHour()} · 出生 {activeBaby.birthDate}
          </AppText>
        </View>
        <Button
          title="档案"
          size="sm"
          variant="secondary"
          onPress={() => navigation.navigate('BabyEditor', { babyId: activeBaby.id })}
        />
      </View>

      {/* 今日奶量：首页唯一的强调卡，点击进喂养页 */}
      <PressableScale stretch onPress={() => navigation.navigate('Feeding')} style={styles.todayCard}>
        <View style={styles.decoA} />
        <View style={styles.decoB} />
        <View style={styles.todayTop}>
          <AppText style={styles.todayLabel}>今日奶量</AppText>
          {hasToday && (
            <View style={styles.whitePill}>
              <AppText style={styles.whitePillText}>共 {stats!.totalCount} 次</AppText>
            </View>
          )}
        </View>

        {hasToday ? (
          <>
            <View style={styles.todayValueRow}>
              <AppText style={styles.todayValue}>{milkValue}</AppText>
              <AppText style={styles.todayUnit}>{milkUnit}</AppText>
            </View>
            {methodChips.length > 0 && (
              <View style={styles.methodRow}>
                {methodChips.map((c) => (
                  <View key={c.key} style={styles.ghostPill}>
                    <AppText style={styles.ghostPillText}>{c.label}</AppText>
                  </View>
                ))}
              </View>
            )}
            {minutesSince != null && (
              <View style={[styles.intervalBar, hungry && styles.intervalBarHot]}>
                <AppText style={[styles.intervalText, hungry && styles.intervalTextHot]}>
                  {`距上次喂养 ${formatInterval(minutesSince)}`}
                  {stats?.lastStartedAt ? ` · 上次 ${formatTime(stats.lastStartedAt)}` : ''}
                  {hungry ? ' · 宝宝可能饿啦 🍼' : ''}
                </AppText>
              </View>
            )}
          </>
        ) : (
          <View style={styles.todayEmpty}>
            <AppText style={styles.todayEmptyText}>今天还没有喂养记录</AppText>
            <View style={styles.actionPill}>
              <AppText style={styles.actionPillText}>去记一笔 🍼</AppText>
            </View>
          </View>
        )}
      </PressableScale>

      {/* 成长速览：白卡三列，点击进成长页 */}
      <PressableScale stretch onPress={() => navigation.navigate('Growth')} style={styles.panelCard}>
        <View style={styles.panelHeader}>
          <AppText variant="heading" style={styles.panelTitle}>成长速览</AppText>
          <AppText style={styles.panelLink}>成长曲线 ›</AppText>
        </View>
        <View style={styles.growthRow}>
          {growthCells.map((m, i) => (
            <React.Fragment key={m.key}>
              {i > 0 && <View style={styles.colDivider} />}
              <View style={styles.growthCell}>
                <View style={styles.growthLabelRow}>
                  <View style={[styles.toneDot, { backgroundColor: m.dot }]} />
                  <AppText variant="caption">{m.label}</AppText>
                </View>
                <View style={styles.growthValueRow}>
                  <AppText style={styles.growthValue}>{m.value}</AppText>
                  {m.value !== '—' && <AppText style={styles.growthUnit}>{m.unit}</AppText>}
                </View>
              </View>
            </React.Fragment>
          ))}
        </View>
        <View style={styles.panelDivider} />
        <AppText variant="caption" style={styles.panelHint}>
          {growthSummary?.daysSinceLastMeasure != null
            ? `距上次测量 ${growthSummary.daysSinceLastMeasure} 天 · 点击查看趋势`
            : '尚未测量 · 点击去记录'}
        </AppText>
      </PressableScale>

      {/* 最近记录：单卡列表，行间分隔线 */}
      <SectionTitle title="最近记录" icon="clock" />
      {feedItems.length > 0 ? (
        <View style={styles.feedCard}>
          {feedItems.map((item, idx) => {
            const isFeeding = item.kind === 'feeding';
            const vol = isFeeding ? fmtVol(item.record.volumeMl) : null;
            const title = isFeeding
              ? `${labelOf(item.record.method)}${vol ? ` ${vol}` : ''}`
              : `${labelOf(item.record.category)}${item.record.temperatureC != null ? ` ${item.record.temperatureC}℃` : ''}`;
            const subtitle = isFeeding
              ? (item.record.note ?? '喂养记录')
              : (item.record.description ?? '异常事件记录');
            const emoji = !isFeeding && item.record.category === 'fever' ? '🌡️' : '🩹';
            return (
              <React.Fragment key={isFeeding ? `f-${item.record.id}` : `e-${item.record.id}`}>
                {idx > 0 && <View style={styles.feedDivider} />}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => navigation.navigate(isFeeding ? 'Feeding' : 'Events')}
                  style={({ pressed }) => [styles.feedRow, pressed && styles.feedRowPressed]}
                >
                <View style={[styles.feedChip, { backgroundColor: (isFeeding ? tones.pink : tones.lemon).soft }]}>
                  {isFeeding ? (
                    <AppIcon name="bottle" size={19} color={tones.pink.deep} strokeWidth={2.2} />
                  ) : (
                    <AppText style={styles.feedEmoji}>{emoji}</AppText>
                  )}
                </View>
                <View style={styles.feedTexts}>
                  <AppText numberOfLines={1} style={styles.feedTitle}>{title}</AppText>
                  <AppText variant="caption" numberOfLines={1}>{subtitle}</AppText>
                </View>
                <AppText variant="caption" style={styles.feedTime}>{relativeTime(timeOf(item))}</AppText>
                <AppIcon name="chevronRight" size={15} color={theme.colors.textSubdued} strokeWidth={2.2} />
                </Pressable>
              </React.Fragment>
            );
          })}
        </View>
      ) : (
        <Card>
          <AppText variant="caption">还没有记录，喂养 / 事件 / 成长页随时开始 🌱</AppText>
        </Card>
      )}
    </Screen>
  );
}

const WHITE = '#FFFFFF';

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },

  /* 档案条 */
  profileBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: tones.coral.soft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 23 },
  profileTexts: { flex: 1, gap: 2 },

  /* 今日奶量强调卡（珊瑚底白字） */
  todayCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm + 2,
    overflow: 'hidden',
    ...theme.shadows.float,
  },
  decoA: {
    position: 'absolute',
    top: -46,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  decoB: {
    position: 'absolute',
    bottom: -58,
    right: 64,
    width: 110,
    height: 110,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  todayTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  todayLabel: { color: 'rgba(255,255,255,0.88)', fontSize: 13, fontWeight: '600', lineHeight: 19 },
  whitePill: {
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  whitePillText: { color: WHITE, fontSize: 12, fontWeight: '600', lineHeight: 17 },
  todayValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  todayValue: { color: WHITE, fontSize: 34, fontWeight: '800', lineHeight: 40 },
  todayUnit: { color: WHITE, fontSize: 14, fontWeight: '700', lineHeight: 20, paddingBottom: 5 },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ghostPill: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  ghostPillText: { color: WHITE, fontSize: 12, fontWeight: '600', lineHeight: 17 },
  intervalBar: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 7,
  },
  intervalBarHot: { backgroundColor: 'rgba(255,255,255,0.96)' },
  intervalText: { color: WHITE, fontSize: 12.5, fontWeight: '600', lineHeight: 18 },
  intervalTextHot: { color: theme.colors.primaryDeep },
  todayEmpty: { gap: theme.spacing.md, paddingBottom: 2 },
  todayEmptyText: { color: 'rgba(255,255,255,0.92)', fontSize: 14, lineHeight: 20 },
  actionPill: {
    alignSelf: 'flex-start',
    backgroundColor: WHITE,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionPillText: { color: theme.colors.primaryDeep, fontSize: 14, fontWeight: '700', lineHeight: 20 },

  /* 白卡面板（成长速览） */
  panelCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelTitle: { fontSize: 16 },
  panelLink: { color: theme.colors.primaryDeep, fontSize: 12.5, fontWeight: '600', lineHeight: 18 },
  growthRow: { flexDirection: 'row', alignItems: 'stretch' },
  growthCell: { flex: 1, gap: 4 },
  growthLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  toneDot: { width: 7, height: 7, borderRadius: theme.radius.pill },
  growthValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  growthValue: { color: theme.colors.text, fontSize: 21, fontWeight: '800', lineHeight: 27 },
  growthUnit: { color: theme.colors.textSubdued, fontSize: 12, fontWeight: '600', lineHeight: 17, paddingBottom: 3 },
  colDivider: { width: 1, backgroundColor: theme.colors.rail, marginHorizontal: theme.spacing.md },
  panelDivider: { height: 1, backgroundColor: theme.colors.rail },
  panelHint: { color: theme.colors.textSubdued },

  /* 最近记录列表卡 */
  feedCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    paddingVertical: 4,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: 13,
    paddingHorizontal: theme.spacing.md,
  },
  feedDivider: { height: 1, backgroundColor: theme.colors.rail, marginHorizontal: theme.spacing.md },
  feedRowPressed: { opacity: 0.75 },
  feedChip: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedEmoji: { fontSize: 19 },
  feedTexts: { flex: 1, gap: 2 },
  feedTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  feedTime: { color: theme.colors.textSubdued },
});
