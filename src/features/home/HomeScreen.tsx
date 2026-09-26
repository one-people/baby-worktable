import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
  ListRow,
  PressableScale,
  Screen,
  SectionTitle,
  Tag,
  theme,
  tones,
} from '@/ui';
import type { MainTabScreenProps } from '@/navigation/types';

type Props = MainTabScreenProps<'Home'>;

/** 距上次喂养超过该分钟数时，首页间隔条转为提醒态 */
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
 * 宝宝信息 Hero 卡 + 今日喂养焦点卡 + 成长速览 + 最近记录流。
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
  const milkValue = stats
    ? isOz
      ? fromMl(stats.totalMl, VolumeUnit.OZ).toFixed(1)
      : `${Math.round(stats.totalMl)}`
    : '—';
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

  return (
    <Screen bottomInset>
      {/* Hero：宝宝信息卡 */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <AppText style={styles.avatarEmoji}>👶</AppText>
        </View>
        <View style={styles.heroTexts}>
          <AppText variant="caption" style={styles.heroGreeting}>{greetingByHour()}</AppText>
          <AppText variant="title" numberOfLines={1}>
            {activeBaby.name} · {formatAgeYMD(activeBaby.birthDate)}
          </AppText>
          <AppText variant="caption">出生 {activeBaby.birthDate}</AppText>
        </View>
        <Button
          title="档案"
          size="sm"
          variant="secondary"
          onPress={() => navigation.navigate('BabyEditor', { babyId: activeBaby.id })}
        />
      </View>

      {/* 今日喂养焦点卡：点击进喂养页 */}
      <PressableScale onPress={() => navigation.navigate('Feeding')} style={styles.focusCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBubble, { backgroundColor: tones.pink.soft }]}>
            <AppIcon name="bottle" size={18} color={tones.pink.deep} strokeWidth={2.2} />
          </View>
          <AppText variant="heading" style={styles.cardTitle}>今日奶量</AppText>
          <AppIcon name="chevronRight" size={18} color={theme.colors.textSubdued} strokeWidth={2.2} />
        </View>

        {stats != null && stats.totalCount > 0 ? (
          <>
            <View style={styles.valueRow}>
              <AppText variant="stat">{milkValue}</AppText>
              <AppText style={styles.valueUnit}>{milkUnit}</AppText>
              <AppText variant="caption" style={styles.valueCount}>共 {stats.totalCount} 次</AppText>
            </View>
            {methodChips.length > 0 && (
              <View style={styles.chipRow}>
                {methodChips.map((c) => (
                  <View key={c.key} style={styles.methodChip}>
                    <AppText variant="caption" style={styles.methodChipText}>{c.label}</AppText>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <AppText variant="caption" style={styles.emptyHint}>今天还没有记录，去喂养页记第一笔吧 🍼</AppText>
        )}

        {minutesSince != null && (
          <View style={[styles.intervalBanner, hungry && styles.intervalOverdue]}>
            <AppText
              variant="caption"
              style={[styles.intervalText, hungry && styles.intervalTextHot]}
            >
              {`距上次喂养 ${formatInterval(minutesSince)}`}
              {stats?.lastStartedAt ? ` · 上次 ${formatTime(stats.lastStartedAt)}` : ''}
              {hungry ? ' · 宝宝可能饿啦' : ''}
            </AppText>
          </View>
        )}
      </PressableScale>

      {/* 成长速览卡：点击进成长页 */}
      <PressableScale onPress={() => navigation.navigate('Growth')} style={styles.focusCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBubble, { backgroundColor: tones.mint.soft }]}>
            <AppIcon name="trendingUp" size={18} color={tones.mint.deep} strokeWidth={2.2} />
          </View>
          <AppText variant="heading" style={styles.cardTitle}>成长速览</AppText>
          <AppIcon name="chevronRight" size={18} color={theme.colors.textSubdued} strokeWidth={2.2} />
        </View>
        <View style={styles.growthRow}>
          {([
            { label: '体重', value: growthSummary?.latestWeightG != null ? `${(growthSummary.latestWeightG / 1000).toFixed(1)}` : '—', unit: 'kg', tone: 'mint' as const },
            { label: '身高', value: growthSummary?.latestHeightCm != null ? growthSummary.latestHeightCm.toFixed(1) : '—', unit: 'cm', tone: 'sky' as const },
            { label: '头围', value: growthSummary?.latestHeadCircumferenceCm != null ? growthSummary.latestHeadCircumferenceCm.toFixed(1) : '—', unit: 'cm', tone: 'lemon' as const },
          ]).map((m) => (
            <View key={m.label} style={styles.growthCell}>
              <AppText variant="caption">{m.label}</AppText>
              <View style={styles.growthValueRow}>
                <AppText variant="heading" style={{ color: tones[m.tone].deep }}>{m.value}</AppText>
                {m.value !== '—' && <AppText variant="caption"> {m.unit}</AppText>}
              </View>
            </View>
          ))}
        </View>
        <AppText variant="caption" style={styles.growthHint}>
          {growthSummary?.daysSinceLastMeasure != null
            ? `${growthSummary.daysSinceLastMeasure} 天前测量 · 点击查看趋势`
            : '尚未测量 · 点击去记录'}
        </AppText>
      </PressableScale>

      <SectionTitle title="最近记录" icon="clock" />
      {feedItems.length > 0 ? (
        <View>
          {feedItems.map((item) =>
            item.kind === 'feeding' ? (
              <ListRow
                key={`f-${item.record.id}`}
                icon="bottle"
                tone="pink"
                title={`${labelOf(item.record.method)}${fmtVol(item.record.volumeMl) ? ` ${fmtVol(item.record.volumeMl)}` : ''}`}
                subtitle={`${relativeTime(item.record.startedAt)}${item.record.note ? ` · ${item.record.note}` : ''}`}
                onPress={() => navigation.navigate('Feeding')}
                trailing={<AppIcon name="chevronRight" size={16} color={theme.colors.textSubdued} strokeWidth={2.2} />}
              />
            ) : (
              <ListRow
                key={`e-${item.record.id}`}
                icon={item.record.category === 'fever' ? '🌡️' : '🩹'}
                title={`${labelOf(item.record.category)}${item.record.temperatureC != null ? ` ${item.record.temperatureC}℃` : ''}`}
                subtitle={relativeTime(item.record.occurredAt)}
                onPress={() => navigation.navigate('Events')}
                trailing={
                  <Tag
                    text={
                      item.record.severity === 'severe' ? '重度' : item.record.severity === 'moderate' ? '中度' : '轻度'
                    }
                  />
                }
              />
            ),
          )}
        </View>
      ) : (
        <Card>
          <AppText variant="caption">还没有记录，喂养 / 事件 / 成长页随时开始 🌱</AppText>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },

  /* Hero 信息卡 */
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg - 4,
    backgroundColor: tones.coral.soft,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md + 2,
    ...theme.shadows.float,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 27 },
  heroTexts: { flex: 1, gap: 2 },
  heroGreeting: { color: theme.colors.primaryDeep, fontWeight: '600' },

  /* 焦点卡通用 */
  focusCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm + 2,
    ...theme.shadows.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { flex: 1, fontSize: 16 },

  /* 今日喂养 */
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, paddingBottom: 2 },
  valueUnit: { fontWeight: '700', fontSize: 14, lineHeight: 20, color: theme.colors.textSubdued, paddingBottom: 3 },
  valueCount: { paddingBottom: 5, marginLeft: theme.spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  methodChip: {
    backgroundColor: theme.colors.chipOff,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  methodChipText: { color: theme.colors.text, fontWeight: '500' },
  emptyHint: { color: theme.colors.textSubdued },
  intervalBanner: {
    backgroundColor: theme.colors.chipOff,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
  },
  intervalOverdue: { backgroundColor: theme.colors.warningSoft },
  intervalText: { color: theme.colors.textSubdued, fontWeight: '500' },
  intervalTextHot: { color: theme.colors.warning, fontWeight: '600' },

  /* 成长速览 */
  growthRow: { flexDirection: 'row' },
  growthCell: { flex: 1, gap: 2 },
  growthValueRow: { flexDirection: 'row', alignItems: 'flex-end' },
  growthHint: { color: theme.colors.textSubdued },
});
