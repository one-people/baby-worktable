import { touch } from '@/core/database/BaseRepository';
import { GrowthRepository } from '@/core/database/repositories/growthRepo';
import {
  estimateZScore,
  getReferencePoints,
  normalCDF,
} from '@/data/whoGrowthReference';
import { ageInDays, nowISO } from '@/core/utils/datetime';
import { gramsToKg } from '@/core/utils/volume';
import { newId } from '@/core/utils/id';
import type { Baby } from '@/models/Baby';
import { GrowthMetric } from '@/models/common';
import type {
  GrowthComparison,
  GrowthDraft,
  GrowthPoint,
  GrowthRecord,
  GrowthSummary,
} from '@/models/Growth';

import type { IGrowthService } from './interfaces';

export function createGrowthService(repo: GrowthRepository): IGrowthService {
  return {
    async add(draft: GrowthDraft): Promise<GrowthRecord> {
      const now = nowISO();
      const record: GrowthRecord = {
        id: newId(),
        babyId: draft.babyId,
        measuredAt: draft.measuredAt,
        heightCm: draft.heightCm ?? null,
        weightG: draft.weightG ?? null,
        headCircumferenceCm: draft.headCircumferenceCm ?? null,
        note: draft.note?.trim() || null,
        createdAt: now,
        updatedAt: now,
      };
      await repo.insert(record);
      return record;
    },

    async update(record: GrowthRecord): Promise<void> {
      await repo.update(touch(record));
    },

    async remove(id: string): Promise<void> {
      await repo.remove(id);
    },

    async listForBaby(babyId: string): Promise<GrowthRecord[]> {
      return repo.listForBabyAsc(babyId);
    },

    async buildSeries(baby: Baby, records: GrowthRecord[], metric: GrowthMetric): Promise<GrowthPoint[]> {
      return records
        .map((r) => {
          const value = metricValue(r, metric);
          return value == null ? null : { ageDays: ageInDays(baby.birthDate, new Date(r.measuredAt)), value };
        })
        .filter((p): p is GrowthPoint => p != null)
        .sort((a, b) => a.ageDays - b.ageDays);
    },

    async getSummary(baby: Baby): Promise<GrowthSummary> {
      const records = await repo.listForBabyAsc(baby.id);
      const latest = records[records.length - 1] ?? null;
      let latestBMI: number | null = null;
      if (latest?.heightCm && latest?.weightG) {
        const heightM = latest.heightCm / 100;
        latestBMI = Math.round((gramsToKg(latest.weightG) / (heightM * heightM)) * 10) / 10;
      }
      return {
        ageDays: ageInDays(baby.birthDate),
        latestHeightCm: latest?.heightCm ?? null,
        latestWeightG: latest?.weightG ?? null,
        latestHeadCircumferenceCm: latest?.headCircumferenceCm ?? null,
        latestBMI,
        daysSinceLastMeasure: latest
          ? Math.floor((Date.now() - new Date(latest.measuredAt).getTime()) / 86400000)
          : null,
      };
    },

    compareWithReference(baby, record, metric) {
      const value = metricValue(record, metric);
      if (value == null) return null;
      const ageDaysAtMeasure = ageInDays(baby.birthDate, new Date(record.measuredAt));
      const normalized = metric === GrowthMetric.Weight ? gramsToKg(value) : value;

      const z = estimateZScore(metric, baby.gender, ageDaysAtMeasure, normalized);
      if (z == null) {
        // 头围等暂无参考数据：仅返回测量值本身
        return {
          metric,
          gender: baby.gender,
          value: normalized,
          ageDays: ageDaysAtMeasure,
          zScore: null,
          percentile: null,
          band: 'normal' as const,
        };
      }
      const band: GrowthComparison['band'] = z < -2 ? 'below' : z > 2 ? 'above' : 'normal';
      return {
        metric,
        gender: baby.gender,
        value: normalized,
        ageDays: ageDaysAtMeasure,
        zScore: Math.round(z * 100) / 100,
        percentile: Math.round(normalCDF(z) * 1000) / 10,
        band,
      };
    },
  };
}

/** 参考带数据获取也走服务层，方便 UI 直接调用 */
export function getReferenceBand(metric: GrowthMetric, gender: Baby['gender'], maxAgeDays: number) {
  return getReferencePoints(metric, gender, maxAgeDays);
}

function metricValue(record: GrowthRecord, metric: GrowthMetric): number | null {
  switch (metric) {
    case GrowthMetric.Height:
      return record.heightCm ?? null;
    case GrowthMetric.Weight:
      return record.weightG ?? null;
    case GrowthMetric.HeadCircumference:
      return record.headCircumferenceCm ?? null;
  }
}
