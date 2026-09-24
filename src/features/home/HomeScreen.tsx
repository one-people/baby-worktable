import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { formatTime, formatAgeYMD, relativeTime } from '@/core/utils/datetime';
import { VolumeUnit } from '@/models/common';
import { fromMl } from '@/core/utils/volume';
import type { FeedingDayStats } from '@/models/Feeding';
import type { AbnormalEvent } from '@/models/AbnormalEvent';
import type { GrowthSummary } from '@/models/Growth';
import { useServices } from '@/services';
import { useApp } from '@/store/AppStore';
import {
  AppText,
  Button,
  Card,
  EmptyState,
  ListRow,
  PressableScale,
  Screen,
  SectionTitle,
  StatCard,
  Tag,
  theme,
  tones,
  AppIcon,
  type IconName,
} from '@/ui';
import type { MainTabScreenProps } from '@/navigation/types';

type Props = MainTabScreenProps<'Home'>;

/** 快捷记录入口：矢量图标 + 马卡龙色气泡，点击跳转对应模块 */
const QUICK_ACTIONS: ReadonlyArray<{
  icon: IconName;
  label: string;
  tone: keyof typeof tones;
  target: 'Feeding' | 'Events' | 'Memos' | 'Growth' | 'Allergens';
}> = [
  { icon: 'bottle', label: '喂奶', tone: 'pink', target: 'Feeding' },
  { icon: 'heartPulse', label: '异常事件', tone: 'lemon', target: 'Events' },
  { icon: 'note', label: '备忘', tone: 'sky', target: 'Memos' },
  { icon: 'ruler', label: '生长', tone: 'mint', target: 'Growth' },
  { icon: 'alert', label: '过敏原', tone: 'coral', target: 'Allergens' },
];

function greetingByHour(): string {
  const h = new Date().getHours();
  if (h < 6) return '夜深啦，注意休息 🌙';
  if (h < 11) return '早安，新的一天 ☀️';
  if (h < 14) return '午安 🌤️';
  if (h < 18) return '下午好 🍃';
  return '晚安 🌙';
}

/** 首页：宝宝头像问候 + 今日统计看板 + 马卡龙快捷入口 */
export function HomeScreen({ navigation }: Props) {
  const { feeding, event, growth } = useServices();
  const { activeBaby, volumeUnit, dataVersion } = useApp();

  const [stats, setStats] = useState<FeedingDayStats | null>(null);
  const [lastEvent, setLastEvent] = useState<AbnormalEvent | null>(null);
  const [growthSummary, setGrowthSummary] = useState<GrowthSummary | null>(null);

  const load = useCallback(async () => {
    if (!activeBaby) return;
    const [s, events, summary] = await Promise.all([
      feeding.getDayStats(activeBaby.id),
      event.listForBaby(activeBaby.id, { limit: 1 }),
      growth.getSummary(activeBaby),
    ]);
    setStats(s);
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
  const milkUnit = volumeUnit === VolumeUnit.OZ ? 'oz' : 'ml';

  return (
    <Screen bottomInset>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <AppText style={styles.avatarEmoji}>👶</AppText>
        </View>
        <View style={styles.headerTexts}>
          <AppText variant="caption">{greetingByHour()}</AppText>
          <AppText variant="title" numberOfLines={1}>
            {activeBaby.name}
          </AppText>
          <AppText variant="caption">
            {formatAgeYMD(activeBaby.birthDate)} · 出生 {activeBaby.birthDate}
          </AppText>
        </View>
        <Button
          title="档案"
          size="sm"
          variant="secondary"
          onPress={() => navigation.navigate('BabyEditor', { babyId: activeBaby.id })}
        />
      </View>

      <View style={styles.statsRow}>
        <StatCard
          label="今日奶量"
          icon="bottle"
          tone="pink"
          value={milkValue}
          unit={milkUnit}
          hint={stats ? `共 ${stats.totalCount} 次` : undefined}
        />
        <StatCard
          label="距上次喂养"
          icon="clock"
          tone="lemon"
          value={stats?.minutesSinceLast != null ? formatInterval(stats.minutesSinceLast) : '—'}
          hint={stats?.lastStartedAt ? `上次 ${formatTime(stats.lastStartedAt)}` : undefined}
        />
      </View>

      <View style={styles.statsRow}>
        <StatCard
          label="最近体重"
          icon="weight"
          tone="mint"
          value={growthSummary?.latestWeightG != null ? `${(growthSummary.latestWeightG / 1000).toFixed(1)}` : '—'}
          unit="kg"
          hint={growthSummary?.daysSinceLastMeasure != null ? `${growthSummary.daysSinceLastMeasure} 天前测量` : '尚未测量'}
        />
        <StatCard
          label="最近身高"
          icon="ruler"
          tone="sky"
          value={growthSummary?.latestHeightCm != null ? `${growthSummary.latestHeightCm.toFixed(1)}` : '—'}
          unit="cm"
          hint={
            growthSummary?.latestHeadCircumferenceCm != null
              ? `头围 ${growthSummary.latestHeadCircumferenceCm.toFixed(1)}cm`
              : growthSummary?.daysSinceLastMeasure != null
                ? `${growthSummary.daysSinceLastMeasure} 天前测量`
                : '尚未测量'
          }
        />
      </View>

      <SectionTitle title="快捷记录" icon="check" />
      <View style={styles.quickGrid}>
        {QUICK_ACTIONS.map((q) => {
          const t = tones[q.tone];
          return (
            <PressableScale
              key={q.label}
              onPress={() => navigation.navigate(q.target)}
              accessibilityLabel={q.label}
              style={styles.quickItem}
            >
              <View style={[styles.quickBubble, { backgroundColor: t.soft }]}>
                <AppIcon name={q.icon} size={22} color={t.deep} strokeWidth={2.1} />
              </View>
              <AppText variant="caption" style={styles.quickLabel}>
                {q.label}
              </AppText>
            </PressableScale>
          );
        })}
      </View>

      <SectionTitle title="最近异常" icon="heartPulse" />
      {lastEvent ? (
        <ListRow
          icon={lastEvent.category === 'fever' ? '🌡️' : '🩹'}
          title={`${lastEvent.category === 'fever' && lastEvent.temperatureC != null ? `${lastEvent.temperatureC}℃ ` : ''}异常记录`}
          subtitle={`${relativeTime(lastEvent.occurredAt)} · 详见事件页`}
          onPress={() => navigation.navigate('Events')}
          trailing={<Tag text={lastEvent.severity === 'severe' ? '重度' : lastEvent.severity === 'moderate' ? '中度' : '轻度'} />}
        />
      ) : (
        <Card>
          <AppText variant="caption">暂无异常记录，一切安好 🌤️</AppText>
        </Card>
      )}
    </Screen>
  );
}

function formatInterval(minutes: number): string {
  if (minutes < 60) return `${minutes} 分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24) return m === 0 ? `${h} 小时` : `${h} 小时 ${m} 分`;
  const d = Math.floor(h / 24);
  return `${d} 天`;
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 12 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.lg,
    backgroundColor: tones.pink.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 28 },
  headerTexts: { flex: 1, gap: 2 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickItem: {
    width: 102,
    paddingVertical: 12,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    gap: 7,
    ...theme.shadows.card,
  },
  quickBubble: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { color: theme.colors.text, fontWeight: '600' },
});
