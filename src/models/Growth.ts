import { Gender, GrowthMetric, type ID, type ISODateTime, type Timestamps } from './common';

/** 单次生长测量记录：身高/体重/头围可在同一次测量中部分填写 */
export interface GrowthRecord extends Timestamps {
  id: ID;
  babyId: ID;
  measuredAt: ISODateTime;
  heightCm?: number | null;
  /** 体重以克存储，展示层再转为 kg / 斤 */
  weightG?: number | null;
  headCircumferenceCm?: number | null;
  note?: string | null;
}

export interface GrowthDraft {
  babyId: ID;
  measuredAt: ISODateTime;
  heightCm?: number | null;
  weightG?: number | null;
  headCircumferenceCm?: number | null;
  note?: string | null;
}

/** 曲线上的一个点：横轴为日龄 */
export interface GrowthPoint {
  ageDays: number;
  value: number;
}

/** WHO 参考曲线上的一个参考点（LMS 简化形式） */
export interface ReferencePoint {
  ageDays: number;
  median: number;
  minus2sd: number;
  plus2sd: number;
}

/** 生长统计摘要（首页看板 / 生长页顶部） */
export interface GrowthSummary {
  ageDays: number;
  latestHeightCm?: number | null;
  latestWeightG?: number | null;
  latestHeadCircumferenceCm?: number | null;
  /** BMI = 体重kg / 身高m²，需要同次测量同时具备身高体重 */
  latestBMI?: number | null;
  daysSinceLastMeasure?: number | null;
}

/**
 * 与参考值的对比结果。
 * 注意：参考数据当前为示例占位集（见 src/data/whoGrowthReference.ts），
 * percentile 仅作趋势参考，不构成医学判断。
 */
export interface GrowthComparison {
  metric: GrowthMetric;
  gender: Gender;
  value: number;
  ageDays: number;
  /** 相对参考中位数的 z-score（示例数据下的近似值） */
  zScore?: number | null;
  percentile?: number | null;
  band: 'below' | 'normal' | 'above';
}
