import {
  EventAttachmentRepository,
  EventRepository,
} from '@/core/database/repositories/eventRepo';
import { touch } from '@/core/database/BaseRepository';
import { deletePhoto, savePhoto } from '@/core/files/photoStore';
import { nowISO } from '@/core/utils/datetime';
import { newId } from '@/core/utils/id';
import type { AbnormalEvent, AbnormalEventDraft } from '@/models/AbnormalEvent';

import type { IAbnormalEventService } from './interfaces';

export function createEventService(
  repo: EventRepository,
  attachments: EventAttachmentRepository,
): IAbnormalEventService {
  return {
    async get(id: string): Promise<AbnormalEvent | null> {
      const event = await repo.getById(id);
      if (!event) return null;
      const all = await attachments.listAll();
      return { ...event, attachments: all.filter((a) => a.eventId === id) };
    },

    async add(draft: AbnormalEventDraft): Promise<AbnormalEvent> {
      const now = nowISO();
      const event: AbnormalEvent = {
        id: newId(),
        babyId: draft.babyId,
        occurredAt: draft.occurredAt,
        category: draft.category,
        severity: draft.severity,
        temperatureC: draft.temperatureC ?? null,
        description: draft.description?.trim() || null,
        attachments: [],
        createdAt: now,
        updatedAt: now,
      };
      await repo.insert(event);

      for (const uri of draft.newPhotoUris ?? []) {
        const filePath = await savePhoto(uri);
        await attachments.insert({
          id: newId(),
          eventId: event.id,
          filePath,
          mimeType: guessMime(uri),
          createdAt: now,
        });
      }
      return event;
    },

    async update(event: AbnormalEvent): Promise<void> {
      await repo.update(touch(event));
    },

    async remove(id: string): Promise<void> {
      const existing = await repo.getById(id);
      if (existing) {
        const rows = await attachments.listAll();
        for (const a of rows.filter((x) => x.eventId === id)) {
          await deletePhoto(a.filePath);
        }
        await attachments.deleteForEvent(id);
      }
      await repo.remove(id);
    },

    async listForBaby(babyId, query = {}) {
      return repo.listForBabyWithAttachments(babyId, query);
    },
  };
}

function guessMime(uri: string): string {
  if (/\.png(\?|$)/i.test(uri)) return 'image/png';
  if (/\.webp(\?|$)/i.test(uri)) return 'image/webp';
  return 'image/jpeg';
}
