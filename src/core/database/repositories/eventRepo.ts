import type * as SQLite from 'expo-sqlite';

import { BaseRepository } from '@/core/database/BaseRepository';
import type { AbnormalEvent, EventAttachment } from '@/models/AbnormalEvent';
import { EventCategory, SeverityLevel, type TimeRangeQuery } from '@/models/common';

interface EventRow {
  id: string;
  baby_id: string;
  occurred_at: string;
  category: string;
  severity: string;
  temperature_c: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface AttachmentRow {
  id: string;
  event_id: string;
  file_path: string;
  mime_type: string;
  created_at: string;
}

export class EventRepository extends BaseRepository<AbnormalEvent, EventRow> {
  constructor(db: SQLite.SQLiteDatabase, private readonly attachments: EventAttachmentRepository) {
    super(db, 'abnormal_events');
  }

  protected toEntity(row: EventRow): AbnormalEvent {
    return {
      id: row.id,
      babyId: row.baby_id,
      occurredAt: row.occurred_at,
      category: row.category as EventCategory,
      severity: row.severity as SeverityLevel,
      temperatureC: row.temperature_c,
      description: row.description,
      attachments: [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  protected toRow(e: AbnormalEvent): Record<string, unknown> {
    return {
      id: e.id,
      baby_id: e.babyId,
      occurred_at: e.occurredAt,
      category: e.category,
      severity: e.severity,
      temperature_c: e.temperatureC ?? null,
      description: e.description ?? null,
      created_at: e.createdAt,
      updated_at: e.updatedAt,
    };
  }

  /** 列表查询并附带每条事件的附件 */
  async listForBabyWithAttachments(
    babyId: string,
    query: TimeRangeQuery = {},
  ): Promise<AbnormalEvent[]> {
    const conditions = ['baby_id = ?'];
    const params: SQLite.SQLiteBindParams = [babyId];
    if (query.from != null) {
      conditions.push('occurred_at >= ?');
      params.push(query.from);
    }
    if (query.to != null) {
      conditions.push('occurred_at <= ?');
      params.push(query.to);
    }
    const rows = await this.db.getAllAsync<EventRow>(
      `SELECT * FROM abnormal_events WHERE ${conditions.join(' AND ')} ORDER BY occurred_at DESC;`,
      params,
    );
    const events = this.mapRows(rows);
    const allAttachments = await this.attachments.listAll();
    const byEvent = new Map<string, EventAttachment[]>();
    for (const a of allAttachments) {
      const list = byEvent.get(a.eventId) ?? [];
      list.push(a);
      byEvent.set(a.eventId, list);
    }
    return events.map((e) => ({ ...e, attachments: byEvent.get(e.id) ?? [] }));
  }
}

export class EventAttachmentRepository {
  constructor(private readonly db: SQLite.SQLiteDatabase) {}

  async listAll(): Promise<EventAttachment[]> {
    const rows = await this.db.getAllAsync<AttachmentRow>(
      'SELECT * FROM event_attachments ORDER BY created_at ASC;',
    );
    return rows.map((row) => ({
      id: row.id,
      eventId: row.event_id,
      filePath: row.file_path,
      mimeType: row.mime_type,
      createdAt: row.created_at,
    }));
  }

  async insert(attachment: EventAttachment): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO event_attachments (id, event_id, file_path, mime_type, created_at)
       VALUES (?, ?, ?, ?, ?);`,
      [attachment.id, attachment.eventId, attachment.filePath, attachment.mimeType, attachment.createdAt],
    );
  }

  async deleteForEvent(eventId: string): Promise<void> {
    await this.db.runAsync('DELETE FROM event_attachments WHERE event_id = ?;', [eventId]);
  }
}
