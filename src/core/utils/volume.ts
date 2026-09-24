import { VolumeUnit } from '@/models/common';

/** 1 液体盎司（US fluid ounce）= 29.5735295625 毫升 */
export const ML_PER_OZ = 29.5735295625;

/** 内部值（ml）-> 目标单位的展示值 */
export function fromMl(ml: number, unit: VolumeUnit): number {
  return unit === VolumeUnit.OZ ? ml / ML_PER_OZ : ml;
}

/** 目标单位输入值 -> 内部存储值（ml），保留两位小数避免浮点尾巴 */
export function toMl(value: number, unit: VolumeUnit): number {
  const ml = unit === VolumeUnit.OZ ? value * ML_PER_OZ : value;
  return Math.round(ml * 100) / 100;
}

/** 克 -> 千克展示 */
export function gramsToKg(g: number): number {
  return Math.round((g / 1000) * 100) / 100;
}

export function kgToGrams(kg: number): number {
  return Math.round(kg * 1000);
}

export function formatMl(ml: number, unit: VolumeUnit): string {
  if (unit === VolumeUnit.OZ) {
    return `${fromMl(ml, unit).toFixed(1)} oz`;
  }
  return `${Math.round(ml)} ml`;
}
