import React from 'react';
import { StyleSheet, View } from 'react-native';

import { getReferenceBand } from '@/services/growthService';
import { gramsToKg } from '@/core/utils/volume';
import type { Baby } from '@/models/Baby';
import { GrowthMetric, labelOf } from '@/models/common';
import type { GrowthPoint } from '@/models/Growth';
import { theme } from '@/ui/theme';
import { AppText } from '@/ui/components/AppText';

import { LineChart, type BandSeries, type ChartPoint } from './LineChart';

interface GrowthChartProps {
  baby: Baby;
  metric: GrowthMetric;
  points: GrowthPoint[];
}

/**
 * 生长曲线图：宝宝实测值 + （占位）WHO 参考带。
 * 体重内部以克存储，此处换算为 kg 展示。
 */
export function GrowthChart({ baby, metric, points }: GrowthChartProps) {
  const maxAgeDays = Math.max(points[points.length - 1]?.ageDays ?? 0, 90);
  const reference = getReferenceBand(metric, baby.gender, maxAgeDays);

  const toChart = (p: GrowthPoint): ChartPoint => ({
    x: p.ageDays,
    y: metric === GrowthMetric.Weight ? gramsToKg(p.value) : p.value,
  });

  const band: BandSeries | undefined =
    reference.length > 0
      ? {
          lower: reference.map((p) => ({ x: p.ageDays, y: p.minus2sd })),
          upper: reference.map((p) => ({ x: p.ageDays, y: p.plus2sd })),
        }
      : undefined;

  const unitSuffix = metric === GrowthMetric.Weight ? ' kg' : ' cm';

  return (
    <View style={styles.wrap}>
      <LineChart series={points.map(toChart)} band={band} unitSuffix={unitSuffix} />
      {reference.length > 0 ? (
        <AppText variant="caption" style={styles.note}>
          蓝色区域为参考范围（示例数据 · ±2SD），橙色为宝宝的{labelOf(metric)}实测曲线，横轴为日龄
        </AppText>
      ) : (
        <AppText variant="caption" style={styles.note}>
          {labelOf(metric)}暂无参考数据，仅展示实测曲线，横轴为日龄
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.spacing.sm },
  note: { lineHeight: 18 },
});
