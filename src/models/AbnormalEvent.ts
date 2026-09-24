import {
  EventCategory,
  SeverityLevel,
  type ID,
  type ISODateTime,
  type Timestamps,
} from './common';

/** 异常事件的照片/文件附件，文件本体存于应用沙盒 photos/ 目录 */
export interface EventAttachment {
  id: ID;
  eventId: ID;
  /** 相对应用沙盒的路径，如 photos/abc123.jpg */
  filePath: string;
  mimeType: string;
  createdAt: ISODateTime;
}

/** 异常事件：发热、皮疹等健康异常的结构化记录 */
export interface AbnormalEvent extends Timestamps {
  id: ID;
  babyId: ID;
  occurredAt: ISODateTime;
  category: EventCategory;
  severity: SeverityLevel;
  /** 体温（℃），发热类事件的关键字段 */
  temperatureC?: number | null;
  /** 结构化详细描述 */
  description?: string | null;
  attachments: EventAttachment[];
}

export interface AbnormalEventDraft {
  babyId: ID;
  occurredAt: ISODateTime;
  category: EventCategory;
  severity: SeverityLevel;
  temperatureC?: number | null;
  description?: string | null;
  /** 待落盘的照片临时 URI（来自相册选择器） */
  newPhotoUris?: string[];
}
