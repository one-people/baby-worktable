import { FeedingRepository } from '@/core/database/repositories/feedingRepo';
import { touch } from '@/core/database/BaseRepository';
import {
  dayEnd,
  dayStart,
  diffMinutes,
  nowISO,
  parseISODate,
  toISODate,
} from '@/core/utils/datetime';
import { newId } from '@/core/utils/id';
import { FeedingMethod, type ISODate } from '@/models/common';
import type { FeedingDayStats, FeedingDraft, FeedingRecord } from '@/models/Feeding';

import type { IFeedingService } from './interfaces';

export function createFeedingService(repo: FeedingRepository): IFeedingService {
  return {
    async get(id: string): Promise<FeedingRecord | null> {
      return repo.getById(id);
    },

    async add(draft: FeedingDraft): Promise<FeedingRecord> {
      const record: FeedingRecord = {
        id: newId(),
        babyId: draft.babyId,
        startedAt: draft.startedAt,
        endedAt: draft.endedAt ?? null,
        method: draft.method,
        volumeMl: draft.volumeMl ?? null,
        durationSeconds: draft.durationSeconds ?? null,
        nursingSide: draft.nursingSide ?? null,
        note: draft.note?.trim() || null,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      await repo.insert(record);
      return record;
    },

    async update(record: FeedingRecord): Promise<void> {
      await repo.update(touch(record));
    },

    async remove(id: string): Promise<void> {
      await repo.remove(id);
    },

    async listForBaby(babyId, query = {}) {
      return repo.listForBaby(babyId, query);
    },

    async getDayStats(babyId: string, date?: ISODate): Promise<FeedingDayStats> {
      const day = date ?? toISODate(new Date());
      const base = parseISODate(day);
      const records = await repo.listForBaby(babyId, {
        from: dayStart(base),
        to: dayEnd(base),
      });

      const byMethod: Record<FeedingMethod, number> = {
        [FeedingMethod.Breast]: 0,
        [FeedingMethod.Formula]: 0,
        [FeedingMethod.Mixed]: 0,
        [FeedingMethod.Solid]: 0,
      };
      let totalMl = 0;
      for (const r of records) {
        byMethod[r.method] += 1;
        totalMl += r.volumeMl ?? 0;
      }
      const lastStartedAt = records[0]?.startedAt ?? null;

      return {
        date: day,
        totalCount: records.length,
        totalMl: Math.round(totalMl * 10) / 10,
        byMethod,
        lastStartedAt,
        minutesSinceLast: lastStartedAt ? diffMinutes(nowISO(), lastStartedAt) : null,
      };
    },
  };
}
