import { Gender, GrowthMetric } from '@/models/common';

import { estimateZScore, getReferencePoints, normalCDF } from './whoGrowthReference';

describe('生长参考数据（示例占位集）', () => {
  it('男宝体重参考带覆盖 0-24 月', () => {
    const points = getReferencePoints(GrowthMetric.Weight, Gender.Male, 730);
    expect(points.length).toBeGreaterThan(20);
    const first = points[0]!;
    expect(first.ageDays).toBe(0);
    expect(first.median).toBeCloseTo(3.3, 5);
    // -2SD < median < +2SD 的单调关系
    expect(first.minus2sd).toBeLessThan(first.median);
    expect(first.plus2sd).toBeGreaterThan(first.median);
  });

  it('中位数值的 z-score 应接近 0', () => {
    const z = estimateZScore(GrowthMetric.Weight, Gender.Male, 0, 3.3);
    expect(z).not.toBeNull();
    expect(Math.abs(z!)).toBeLessThan(0.01);
  });

  it('正态分布函数：z=0 为 50%，z=1.96 约 97.5%', () => {
    expect(normalCDF(0)).toBeCloseTo(0.5, 4);
    expect(normalCDF(1.959964)).toBeCloseTo(0.975, 3);
  });

  it('头围暂无参考数据，返回空数组', () => {
    expect(getReferencePoints(GrowthMetric.HeadCircumference, Gender.Male, 365)).toHaveLength(0);
  });
});
