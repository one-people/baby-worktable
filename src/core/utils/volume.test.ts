import { VolumeUnit } from '@/models/common';

import { ML_PER_OZ, formatMl, fromMl, gramsToKg, kgToGrams, toMl } from './volume';

describe('volume 单位换算', () => {
  it('盎司 -> 毫升往返换算应保持数值（toMl 落库保留两位小数）', () => {
    const oz = 4;
    const ml = toMl(oz, VolumeUnit.OZ);
    expect(ml).toBeCloseTo(4 * ML_PER_OZ, 2);
    expect(fromMl(ml, VolumeUnit.OZ)).toBeCloseTo(oz, 2);
  });

  it('毫升模式下换算是恒等变换', () => {
    expect(toMl(120, VolumeUnit.ML)).toBe(120);
    expect(fromMl(120, VolumeUnit.ML)).toBe(120);
  });

  it('格式化输出跟随单位偏好', () => {
    expect(formatMl(120, VolumeUnit.ML)).toBe('120 ml');
    expect(formatMl(2 * ML_PER_OZ, VolumeUnit.OZ)).toBe('2.0 oz');
  });

  it('克与千克互转', () => {
    expect(gramsToKg(7800)).toBe(7.8);
    expect(kgToGrams(7.8)).toBe(7800);
  });
});
