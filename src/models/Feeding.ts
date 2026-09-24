import {
  FeedingMethod,
  NursingSide,
  type ID,
  type ISODate,
  type ISODateTime,
  type Timestamps,
} from './common';

/** 喂养记录 */
export interface FeedingRecord extends Timestamps {
  id: ID;
  babyId: ID;
  /** 开始时间（主时间轴字段） */
  startedAt: ISODateTime;
  /** 结束时间：亲喂/混合时可推算持续时长 */
  endedAt?: ISODateTime | null;
  method: FeedingMethod;
  /** 奶量，内部固定以毫升存储；盎司单位仅做展示换算 */
  volumeMl?: number | null;
  /** 单次持续时间（秒），用于亲喂与混合喂养 */
  durationSeconds?: number | null;
  /** 亲喂侧别（仅母乳时有意义） */
  nursingSide?: NursingSide | null;
  note?: string | null;
}

export interface FeedingDraft {
  babyId: ID;
  startedAt: ISODateTime;
  endedAt?: ISODateTime | null;
  method: FeedingMethod;
  volumeMl?: number | null;
  durationSeconds?: number | null;
  nursingSide?: NursingSide | null;
  note?: string | null;
}

/** 某天的喂养统计（首页看板 / 喂养页头部） */
export interface FeedingDayStats {
  date: ISODate;
  totalCount: number;
  /** 当日总奶量（ml），亲喂未记奶量按 0 计 */
  totalMl: number;
  byMethod: Record<FeedingMethod, number>;
  lastStartedAt?: ISODateTime | null;
  /** 距上一次喂养的分钟数（用于“距上次喂养 X 小时”） */
  minutesSinceLast?: number | null;
}
