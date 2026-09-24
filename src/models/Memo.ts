import {
  ReminderRepeat,
  type ID,
  type ISODateTime,
  type Timestamps,
} from './common';

/** 备忘分类：通过 parentId 自关联实现任意层级树（多级分类管理） */
export interface MemoCategory extends Timestamps {
  id: ID;
  parentId: ID | null;
  name: string;
  sortOrder: number;
}

/** 日常备忘录 */
export interface Memo extends Timestamps {
  id: ID;
  /** 备忘可全局（null）或归属于某个宝宝 */
  babyId: ID | null;
  categoryId: ID | null;
  title: string;
  content?: string | null;
  pinned: boolean;
  /* ---- 智能提醒 ---- */
  reminderAt: ISODateTime | null;
  reminderRepeat: ReminderRepeat;
  reminderEnabled: boolean;
  /** 系统通知 id，用于取消/更新已排定的提醒 */
  notificationId?: string | null;
}

export interface MemoDraft {
  babyId: ID | null;
  categoryId: ID | null;
  title: string;
  content?: string | null;
  pinned?: boolean;
  reminderAt?: ISODateTime | null;
  reminderRepeat?: ReminderRepeat;
  reminderEnabled?: boolean;
}

export interface MemoCategoryDraft {
  parentId: ID | null;
  name: string;
  sortOrder?: number;
}

/** 分类树节点（服务层组装后的展示形态） */
export interface MemoCategoryNode extends MemoCategory {
  children: MemoCategoryNode[];
  /** 层级，根为 0，用于缩进展示 */
  depth: number;
}
