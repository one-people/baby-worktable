import {
  AllergenRepository,
  BabyAllergenRepository,
} from '@/core/database/repositories/allergenRepo';
import { nowISO } from '@/core/utils/datetime';
import { newId } from '@/core/utils/id';
import { AllergenCategory, SeverityLevel } from '@/models/common';
import type {
  Allergen,
  AllergenDraft,
  AllergyWarning,
  BabyAllergen,
  BabyAllergenDraft,
} from '@/models/Allergen';

import type { IAllergenService } from './interfaces';

/** 内置过敏原库（首次启动写入，用户可停用/补充，不可删除内置项） */
const PRESET_ALLERGENS: { name: string; category: AllergenCategory }[] = [
  { name: '牛奶蛋白', category: AllergenCategory.Food },
  { name: '鸡蛋', category: AllergenCategory.Food },
  { name: '花生', category: AllergenCategory.Food },
  { name: '大豆', category: AllergenCategory.Food },
  { name: '小麦', category: AllergenCategory.Food },
  { name: '鱼', category: AllergenCategory.Food },
  { name: '虾/蟹/贝类', category: AllergenCategory.Food },
  { name: '坚果', category: AllergenCategory.Food },
  { name: '芒果', category: AllergenCategory.Food },
  { name: '青霉素', category: AllergenCategory.Drug },
  { name: '头孢类', category: AllergenCategory.Drug },
  { name: '阿司匹林', category: AllergenCategory.Drug },
  { name: '尘螨', category: AllergenCategory.Environment },
  { name: '花粉', category: AllergenCategory.Environment },
  { name: '宠物毛发', category: AllergenCategory.Environment },
];

export function createAllergenService(
  repo: AllergenRepository,
  linkRepo: BabyAllergenRepository,
): IAllergenService {
  return {
    async ensurePresets(): Promise<void> {
      const existing = await repo.list('created_at ASC');
      if (existing.length > 0) return;
      const now = nowISO();
      for (const preset of PRESET_ALLERGENS) {
        if (await repo.findByName(preset.name)) continue;
        await repo.insert({
          id: newId(),
          name: preset.name,
          category: preset.category,
          isCustom: false,
          note: null,
          createdAt: now,
        });
      }
    },

    async listAll(): Promise<Allergen[]> {
      return repo.list('category ASC, name ASC');
    },

    async createCustom(draft: AllergenDraft): Promise<Allergen> {
      const name = draft.name.trim();
      const existing = await repo.findByName(name);
      if (existing) return existing;
      const allergen: Allergen = {
        id: newId(),
        name,
        category: draft.category,
        isCustom: true,
        note: draft.note ?? null,
        createdAt: nowISO(),
      };
      await repo.insert(allergen);
      return allergen;
    },

    async removeCustom(id: string): Promise<void> {
      const allergen = await repo.getById(id);
      if (!allergen || !allergen.isCustom) return;
      await repo.remove(id);
    },

    async listForBaby(babyId: string): Promise<BabyAllergen[]> {
      return linkRepo.listForBaby(babyId);
    },

    async link(draft: BabyAllergenDraft): Promise<BabyAllergen> {
      const link: BabyAllergen = {
        babyId: draft.babyId,
        allergenId: draft.allergenId,
        severity: draft.severity,
        confirmed: draft.confirmed ?? false,
        note: draft.note ?? null,
        linkedAt: nowISO(),
      };
      await linkRepo.upsert(link);
      return link;
    },

    async unlink(babyId: string, allergenId: string): Promise<void> {
      await linkRepo.delete(babyId, allergenId);
    },

    async checkTextForWarnings(babyId: string, text: string): Promise<AllergyWarning[]> {
      const trimmed = text.trim();
      if (!trimmed) return [];
      const links = await linkRepo.listForBaby(babyId);
      if (links.length === 0) return [];

      const warnings: AllergyWarning[] = [];
      for (const link of links) {
        const allergen = await repo.getById(link.allergenId);
        if (!allergen) continue;
        // 名称中含“/”的按分词分别匹配（如“虾/蟹/贝类”）
        const keywords = allergen.name.split('/').map((s) => s.trim()).filter(Boolean);
        const hit = keywords.find((kw) => trimmed.includes(kw));
        if (hit) {
          warnings.push({
            allergen,
            severity: link.severity,
            matchedText: hit,
            message: `「${allergen.name}」是宝宝已登记的过敏原（${severityText(link.severity)}），请确认本次记录内容。`,
          });
        }
      }
      return warnings;
    },
  };
}

function severityText(severity: SeverityLevel): string {
  switch (severity) {
    case SeverityLevel.Mild:
      return '轻度';
    case SeverityLevel.Moderate:
      return '中度';
    case SeverityLevel.Severe:
      return '重度';
  }
}
