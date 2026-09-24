import { Gender, GrowthMetric } from '@/models/common';
import type { ReferencePoint } from '@/models/Growth';

/**
 * ⚠️ 占位示例数据（非官方 WHO LMS 全量表） ⚠️
 *
 * 当前为演示用粗略参考集（月龄中位数与 ±2SD 近似值），
 * 仅用于生长曲线参考带的可视化演示，不可用于任何医学判断。
 *
 * 正式版规划：从 WHO 官方生长标准数据
 * (https://www.who.int/tools/child-growth-standards/standards)
 * 导入完整 LMS 表（按性别 × 月龄 × 指标），保持本模块的导出接口不变，
 * growthService 与 UI 层无需任何改动。
 */

interface ReferenceSeries {
  metric: GrowthMetric;
  gender: Gender;
  /** 变异系数近似值（z-score 粗算用） */
  s: number;
  points: { ageDays: number; median: number; minus2sd: number; plus2sd: number }[];
}

const MONTH = 30.4375;
const at = (months: number) => Math.round(months * MONTH);

/** 体重（kg），0–24 月，男女各自的中位数与 ±2SD 近似 */
const WEIGHT: Record<Gender, [number, number, number][]> = {
  // [中位数, -2SD, +2SD]
  [Gender.Male]: [
    [3.3, 2.5, 4.4], [4.5, 3.4, 5.8], [5.6, 4.3, 7.1], [6.4, 5.0, 8.0],
    [7.0, 5.6, 8.7], [7.5, 6.0, 9.4], [7.9, 6.4, 9.8], [8.3, 6.7, 10.3],
    [8.6, 6.9, 10.7], [8.9, 7.1, 11.0], [9.2, 7.4, 11.4], [9.4, 7.6, 11.7],
    [9.6, 7.7, 12.0], [9.9, 7.9, 12.4], [10.1, 8.2, 12.7], [10.3, 8.4, 13.0],
    [10.5, 8.6, 13.2], [10.7, 8.8, 13.5], [10.9, 9.0, 13.7], [11.1, 9.2, 14.0],
    [11.3, 9.4, 14.2], [11.5, 9.5, 14.5], [11.8, 9.7, 14.7], [12.0, 9.9, 15.0],
    [12.2, 10.1, 15.3],
  ],
  [Gender.Female]: [
    [3.2, 2.4, 4.2], [4.2, 3.2, 5.5], [5.1, 3.9, 6.6], [5.8, 4.5, 7.5],
    [6.4, 5.0, 8.2], [6.9, 5.4, 8.8], [7.3, 5.7, 9.3], [7.6, 6.0, 9.8],
    [7.9, 6.3, 10.2], [8.2, 6.5, 10.5], [8.4, 6.7, 10.9], [8.6, 6.9, 11.2],
    [8.8, 7.0, 11.5], [9.0, 7.2, 11.8], [9.2, 7.4, 12.1], [9.4, 7.6, 12.4],
    [9.6, 7.7, 12.7], [9.8, 7.9, 13.0], [10.0, 8.1, 13.3], [10.2, 8.2, 13.5],
    [10.4, 8.4, 13.8], [10.6, 8.6, 14.0], [10.8, 8.8, 14.3], [11.0, 8.9, 14.5],
    [11.2, 9.1, 14.8],
  ],
  // 其他性别暂用女宝曲线占位
  [Gender.Other]: [],
};

/** 身高/身长（cm），0–24 月 */
const HEIGHT: Record<Gender, [number, number, number][]> = {
  [Gender.Male]: [
    [49.9, 46.1, 53.7], [54.7, 50.8, 58.6], [58.4, 54.4, 62.4], [61.4, 57.3, 65.5],
    [63.9, 59.7, 68.0], [65.9, 61.7, 70.1], [67.6, 63.3, 71.9], [69.2, 64.8, 73.5],
    [70.6, 66.2, 75.0], [72.0, 67.5, 76.5], [73.3, 68.7, 77.9], [74.5, 69.9, 79.2],
    [75.7, 71.0, 80.5], [76.9, 72.1, 81.7], [78.0, 73.1, 82.9], [79.1, 74.1, 84.0],
    [80.2, 75.0, 85.4], [81.2, 75.9, 86.5], [82.3, 76.7, 87.7], [83.2, 77.6, 88.8],
    [84.2, 78.4, 89.8], [85.1, 79.2, 90.9], [86.0, 79.9, 91.9], [86.8, 80.6, 92.9],
    [87.6, 81.2, 93.8],
  ],
  [Gender.Female]: [
    [49.1, 45.4, 52.9], [53.7, 49.8, 57.6], [57.1, 53.0, 61.1], [59.8, 55.6, 64.0],
    [62.1, 57.8, 66.4], [64.0, 59.6, 68.5], [65.7, 61.2, 70.3], [67.3, 62.7, 71.9],
    [68.7, 64.0, 73.5], [70.1, 65.2, 75.0], [71.5, 66.5, 76.4], [72.8, 67.7, 77.8],
    [74.0, 68.9, 79.2], [75.2, 70.0, 80.5], [76.4, 71.0, 81.7], [77.5, 72.0, 82.9],
    [78.6, 72.9, 84.1], [79.7, 73.8, 85.2], [80.7, 74.6, 86.3], [81.7, 75.4, 87.4],
    [82.6, 76.1, 88.4], [83.5, 76.8, 89.4], [84.4, 77.4, 90.3], [85.1, 78.0, 91.2],
    [85.9, 78.6, 92.1],
  ],
  [Gender.Other]: [],
};

function buildSeries(
  metric: GrowthMetric,
  gender: Gender,
  table: Record<Gender, [number, number, number][]>,
  s: number,
): ReferenceSeries {
  const rows = gender === Gender.Other ? (table[Gender.Female] ?? []) : (table[gender] ?? []);
  return {
    metric,
    gender,
    s,
    points: rows.map((row, i) => ({
      ageDays: at(i),
      median: row[0]!,
      minus2sd: row[1]!,
      plus2sd: row[2]!,
    })),
  };
}

const SERIES: ReferenceSeries[] = [
  ...([Gender.Male, Gender.Female, Gender.Other] as Gender[]).flatMap((g) => [
    buildSeries(GrowthMetric.Weight, g, WEIGHT, 0.11),
    buildSeries(GrowthMetric.Height, g, HEIGHT, 0.045),
  ]),
];

/** 查询参考曲线（头围暂无示例数据，返回空数组） */
export function getReferenceSeries(
  metric: GrowthMetric,
  gender: Gender,
): ReferenceSeries | null {
  return SERIES.find((s) => s.metric === metric && s.gender === gender) ?? null;
}

export function getReferencePoints(
  metric: GrowthMetric,
  gender: Gender,
  maxAgeDays: number,
): ReferencePoint[] {
  const series = getReferenceSeries(metric, gender);
  if (!series) return [];
  return series.points.filter((p) => p.ageDays <= maxAgeDays);
}

/**
 * 用简化的 z-score 公式（z ≈ (value/M − 1) / S）在相邻参考点间线性插值估算。
 * 仅作趋势参考；接入官方 LMS 表后会替换为标准公式。
 */
export function estimateZScore(
  metric: GrowthMetric,
  gender: Gender,
  ageDays: number,
  value: number,
): number | null {
  const series = getReferenceSeries(metric, gender);
  if (!series || series.points.length === 0) return null;
  const points = series.points;

  let lower = points[0]!;
  let upper = points[points.length - 1]!;
  if (ageDays <= lower.ageDays) {
    upper = points[1] ?? lower;
  } else if (ageDays >= upper.ageDays) {
    lower = points[points.length - 2] ?? upper;
  } else {
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i]!;
      const b = points[i + 1]!;
      if (ageDays >= a.ageDays && ageDays <= b.ageDays) {
        lower = a;
        upper = b;
        break;
      }
    }
  }

  const t =
    upper.ageDays === lower.ageDays
      ? 0
      : (ageDays - lower.ageDays) / (upper.ageDays - lower.ageDays);
  const median = lower.median + t * (upper.median - lower.median);
  return (value / median - 1) / series.s;
}

/** 标准正态分布的累积函数近似（Abramowitz & Stegun 26.2.17） */
export function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const poly =
    t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const pdf = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  const cdf = 1 - pdf * poly;
  return z >= 0 ? cdf : 1 - cdf;
}
