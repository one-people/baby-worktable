import { Gender, type ID, type ISODate, type Timestamps } from './common';

/** 宝宝档案：过敏原关联、所有记录都以宝宝为主体外键 */
export interface Baby extends Timestamps {
  id: ID;
  name: string;
  gender: Gender;
  birthDate: ISODate;
  /** 本地沙盒内头像相对路径（可选） */
  avatarPath?: string | null;
  note?: string | null;
}

export interface BabyDraft {
  name: string;
  gender: Gender;
  birthDate: ISODate;
  avatarPath?: string | null;
  note?: string | null;
}
