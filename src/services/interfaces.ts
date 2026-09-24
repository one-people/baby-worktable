import type { Baby, BabyDraft } from '@/models/Baby';
import type { FeedingDayStats, FeedingDraft, FeedingRecord } from '@/models/Feeding';
import type { AbnormalEvent, AbnormalEventDraft } from '@/models/AbnormalEvent';
import type {
  Memo,
  MemoCategory,
  MemoCategoryDraft,
  MemoCategoryNode,
  MemoDraft,
} from '@/models/Memo';
import type {
  Allergen,
  AllergenDraft,
  AllergyWarning,
  BabyAllergen,
  BabyAllergenDraft,
} from '@/models/Allergen';
import type {
  GrowthComparison,
  GrowthDraft,
  GrowthPoint,
  GrowthRecord,
  GrowthSummary,
} from '@/models/Growth';
import type { GrowthMetric, ISODate, ISODateTime, TimeRangeQuery } from '@/models/common';

/**
 * 核心服务层契约：UI 只依赖这些接口，不感知 SQLite 与文件系统细节。
 * 每个接口与一个功能模块一一对应；新增模块时在此追加接口并在
 * services/index.tsx 的 Services 工厂中注册实现。
 */

export interface IBabyService {
  list(): Promise<Baby[]>;
  get(id: string): Promise<Baby | null>;
  create(draft: BabyDraft): Promise<Baby>;
  update(baby: Baby): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface IFeedingService {
  /** 按 id 读取单条记录（详情页用），不存在返回 null */
  get(id: string): Promise<FeedingRecord | null>;
  add(draft: FeedingDraft): Promise<FeedingRecord>;
  update(record: FeedingRecord): Promise<void>;
  remove(id: string): Promise<void>;
  listForBaby(babyId: string, query?: TimeRangeQuery): Promise<FeedingRecord[]>;
  /** 当日统计：总奶量、次数、分方式统计、距上次喂养间隔 */
  getDayStats(babyId: string, date?: ISODate): Promise<FeedingDayStats>;
}

export interface IAbnormalEventService {
  /** 按 id 读取单条事件（含照片附件，详情页用），不存在返回 null */
  get(id: string): Promise<AbnormalEvent | null>;
  add(draft: AbnormalEventDraft): Promise<AbnormalEvent>;
  update(event: AbnormalEvent): Promise<void>;
  remove(id: string): Promise<void>;
  listForBaby(babyId: string, query?: TimeRangeQuery): Promise<AbnormalEvent[]>;
}

export interface IMemoService {
  /* ---- 备忘 CRUD ---- */
  add(draft: MemoDraft): Promise<Memo>;
  update(memo: Memo): Promise<void>;
  remove(id: string): Promise<void>;
  list(categoryId?: string | null): Promise<Memo[]>;
  search(keyword: string): Promise<Memo[]>;
  /* ---- 分类树（多级分类管理） ---- */
  addCategory(draft: MemoCategoryDraft): Promise<MemoCategory>;
  updateCategory(category: MemoCategory): Promise<void>;
  removeCategory(id: string): Promise<void>;
  listCategoryTree(): Promise<MemoCategoryNode[]>;
  /* ---- 智能提醒 ---- */
  /** 启用/更新/关闭提醒（at 为 null 时关闭）并同步系统通知 */
  setReminder(memo: Memo, at: ISODateTime | null, repeat: Memo['reminderRepeat']): Promise<Memo>;
}

export interface IAllergenService {
  /** 首次启动时写入内置过敏原库（幂等） */
  ensurePresets(): Promise<void>;
  listAll(): Promise<Allergen[]>;
  createCustom(draft: AllergenDraft): Promise<Allergen>;
  removeCustom(id: string): Promise<void>;
  /* ---- 宝宝关联与预警 ---- */
  listForBaby(babyId: string): Promise<BabyAllergen[]>;
  link(draft: BabyAllergenDraft): Promise<BabyAllergen>;
  unlink(babyId: string, allergenId: string): Promise<void>;
  /**
   * 预警机制：检查一段自由文本（备忘内容、事件描述、辅食备注等）
   * 是否命中某宝宝已关联的过敏原名称，命中则返回预警列表。
   */
  checkTextForWarnings(babyId: string, text: string): Promise<AllergyWarning[]>;
}

export interface IGrowthService {
  add(draft: GrowthDraft): Promise<GrowthRecord>;
  update(record: GrowthRecord): Promise<void>;
  remove(id: string): Promise<void>;
  listForBaby(babyId: string): Promise<GrowthRecord[]>;
  /** 某指标的曲线点序列（横轴日龄） */
  buildSeries(baby: Baby, records: GrowthRecord[], metric: GrowthMetric): Promise<GrowthPoint[]>;
  getSummary(baby: Baby): Promise<GrowthSummary>;
  /** 与（占位）参考值对比，返回 z-score / 百分位 / 区间 */
  compareWithReference(
    baby: Baby,
    record: GrowthRecord,
    metric: GrowthMetric,
  ): GrowthComparison | null;
}

export interface IBackupService {
  /** 导出全部业务数据：web 优先系统保存对话框、否则浏览器下载；原生写沙盒并尝试分享 */
  exportAll(): Promise<{ rowCount: number; fileName: string; filePath: string; via?: 'picker' | 'download' | 'cancel' }>;
  /** 校验并全量导入备份 JSON（覆盖现有数据），返回恢复的行数 */
  importAll(json: string): Promise<number>;
}
