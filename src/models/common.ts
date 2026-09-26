/**
 * 通用类型与枚举：被所有业务模型共享。
 * 枚举值以字符串落库（SQLite TEXT），保证数据可读、可迁移。
 */

export type ID = string;

/** ISO 8601 本地时间字符串，如 2026-09-24T08:30:00 */
export type ISODateTime = string;
/** ISO 日期字符串，如 2026-09-24 */
export type ISODate = string;

export interface Timestamps {
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Paginated<T> {
  items: T[];
  total: number;
}

/** 通用查询结果：按时间倒序、限定日期范围 */
export interface TimeRangeQuery {
  from?: ISODateTime;
  to?: ISODateTime;
  limit?: number;
  offset?: number;
}

/* ----------------------------- 业务枚举 ----------------------------- */

/** 喂养方式 */
export enum FeedingMethod {
  Breast = 'breast', // 母乳
  Formula = 'formula', // 配方奶
  Mixed = 'mixed', // 混合
  Solid = 'solid', // 辅食
}

/** 亲喂侧别（仅母乳亲喂时有意义） */
export enum NursingSide {
  Left = 'left',
  Right = 'right',
  Both = 'both',
}

/** 奶量单位（内部一律以毫升存储，盎司仅作展示层换算） */
export enum VolumeUnit {
  ML = 'ml',
  OZ = 'oz',
}

export enum Gender {
  Male = 'male',
  Female = 'female',
  Other = 'other',
}

/** 严重程度：异常事件与过敏反应共用同一分级 */
export enum SeverityLevel {
  Mild = 'mild', // 轻度
  Moderate = 'moderate', // 中度
  Severe = 'severe', // 重度
}

/** 异常事件类别（值需全局唯一，LABELS 以枚举值为键） */
export enum EventCategory {
  Fever = 'fever', // 发热
  Rash = 'rash', // 皮疹
  Cough = 'cough', // 咳嗽
  Diarrhea = 'diarrhea', // 腹泻
  Vomit = 'vomit', // 呕吐
  Other = 'event_other', // 其他
}

/** 提醒重复策略 */
export enum ReminderRepeat {
  None = 'none',
  Daily = 'daily',
  Weekly = 'weekly',
}

/** 过敏原类别 */
export enum AllergenCategory {
  Food = 'food', // 食物
  Drug = 'drug', // 药物
  Environment = 'environment', // 环境因素（尘螨/花粉等）
  Other = 'allergen_other',
}

/** 生长发育指标 */
export enum GrowthMetric {
  Height = 'height', // 身高 cm
  Weight = 'weight', // 体重 g（内部以克存储避免浮点误差）
  HeadCircumference = 'head', // 头围 cm
}

export const SEVERITY_LEVELS: readonly SeverityLevel[] = [
  SeverityLevel.Mild,
  SeverityLevel.Moderate,
  SeverityLevel.Severe,
];

export const EVENT_CATEGORIES: readonly EventCategory[] = [
  EventCategory.Fever,
  EventCategory.Rash,
  EventCategory.Cough,
  EventCategory.Diarrhea,
  EventCategory.Vomit,
  EventCategory.Other,
];

export const FEEDING_METHODS: readonly FeedingMethod[] = [
  FeedingMethod.Breast,
  FeedingMethod.Formula,
  FeedingMethod.Mixed,
  FeedingMethod.Solid,
];

export const NURSING_SIDES: readonly NursingSide[] = [
  NursingSide.Left,
  NursingSide.Right,
  NursingSide.Both,
];

export const GENDERS: readonly Gender[] = [Gender.Male, Gender.Female, Gender.Other];

export const ALLERGEN_CATEGORIES: readonly AllergenCategory[] = [
  AllergenCategory.Food,
  AllergenCategory.Drug,
  AllergenCategory.Environment,
  AllergenCategory.Other,
];

/* ----------------------------- 中文标签映射 ----------------------------- */

export const LABELS: Record<string, string> = {
  [FeedingMethod.Breast]: '母乳',
  [FeedingMethod.Formula]: '配方奶',
  [FeedingMethod.Mixed]: '混合',
  [FeedingMethod.Solid]: '辅食',
  [NursingSide.Left]: '左侧',
  [NursingSide.Right]: '右侧',
  [NursingSide.Both]: '双侧',
  [Gender.Male]: '男宝',
  [Gender.Female]: '女宝',
  [Gender.Other]: '未填写',
  [SeverityLevel.Mild]: '轻度',
  [SeverityLevel.Moderate]: '中度',
  [SeverityLevel.Severe]: '重度',
  [EventCategory.Fever]: '发热',
  [EventCategory.Rash]: '皮疹',
  [EventCategory.Cough]: '咳嗽',
  [EventCategory.Diarrhea]: '腹泻',
  [EventCategory.Vomit]: '呕吐',
  [EventCategory.Other]: '其他',
  [ReminderRepeat.None]: '不重复',
  [ReminderRepeat.Daily]: '每天',
  [ReminderRepeat.Weekly]: '每周',
  [AllergenCategory.Food]: '食物',
  [AllergenCategory.Drug]: '药物',
  [AllergenCategory.Environment]: '环境',
  [AllergenCategory.Other]: '其他',
  [GrowthMetric.Height]: '身高',
  [GrowthMetric.Weight]: '体重',
  [GrowthMetric.HeadCircumference]: '头围',
};

export function labelOf(value: string | undefined | null): string {
  if (value == null) return '';
  return LABELS[value] ?? value;
}
