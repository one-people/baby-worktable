import {
  AllergenCategory,
  SeverityLevel,
  type ID,
  type ISODateTime,
} from './common';

/** 过敏原条目：preset 为内置库（isCustom=false），用户可自行扩充 */
export interface Allergen {
  id: ID;
  name: string;
  category: AllergenCategory;
  isCustom: boolean;
  note?: string | null;
  createdAt: ISODateTime;
}

export interface AllergenDraft {
  name: string;
  category: AllergenCategory;
  note?: string | null;
}

/** 宝宝与过敏原的关联（多对多），severity 为该宝宝对此过敏原的反应强度 */
export interface BabyAllergen {
  babyId: ID;
  allergenId: ID;
  severity: SeverityLevel;
  /** 区分“疑似观察中”与“确诊” */
  confirmed: boolean;
  note?: string | null;
  linkedAt: ISODateTime;
}

export interface BabyAllergenDraft {
  babyId: ID;
  allergenId: ID;
  severity: SeverityLevel;
  confirmed?: boolean;
  note?: string | null;
}

/**
 * 过敏预警：当文本内容（备忘/事件描述等）命中某宝宝已关联的过敏原名称时产生。
 * 由服务层统一生成，UI 层只需展示。
 */
export interface AllergyWarning {
  allergen: Allergen;
  severity: SeverityLevel;
  /** 命中的文本片段 */
  matchedText: string;
  /** 面向用户的预警文案 */
  message: string;
}
