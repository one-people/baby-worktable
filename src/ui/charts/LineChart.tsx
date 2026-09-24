import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Polyline, Text as SvgText } from 'react-native-svg';

import { theme } from '@/ui/theme';

export interface ChartPoint {
  x: number;
  y: number;
}

export interface BandSeries {
  lower: ChartPoint[];
  upper: ChartPoint[];
}

interface LineChartProps {
  /** 主数据线（宝宝实测值） */
  series: ChartPoint[];
  /** 参考带（WHO 中位数 ±2SD 围成的区域） */
  band?: BandSeries;
  /** y 轴单位后缀，如 ' cm' / ' kg' */
  unitSuffix?: string;
  /** y 轴刻度个数 */
  yTickCount?: number;
}

const W = 320;
const H = 200;
const PAD = { top: 14, right: 14, bottom: 26, left: 40 };

/**
 * 轻量 SVG 折线图：为生长曲线定制（参考带 + 散点 + 主线）。
 * 选择自绘而非第三方图表库：当前只有这一种图，自绘可控且依赖更少。
 */
export function LineChart({ series, band, unitSuffix = '', yTickCount = 5 }: LineChartProps) {
  const all = useMemo(() => {
    const pts = [...series];
    if (band) pts.push(...band.lower, ...band.upper);
    return pts;
  }, [series, band]);

  if (all.length === 0) return null;

  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const xMin = Math.min(...xs, 0);
  const xMax = Math.max(...xs, 1);
  let yMin = Math.min(...ys);
  let yMax = Math.max(...ys);
  const ySpan = yMax - yMin || Math.max(1, yMax * 0.1);
  yMin -= ySpan * 0.12;
  yMax += ySpan * 0.12;

  const sx = (x: number) =>
    PAD.left + ((x - xMin) / (xMax - xMin || 1)) * (W - PAD.left - PAD.right);
  const sy = (y: number) =>
    H - PAD.bottom - ((y - yMin) / (yMax - yMin || 1)) * (H - PAD.top - PAD.bottom);

  const toPoints = (pts: ChartPoint[]) =>
    pts.map((p) => `${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');

  const yTicks = Array.from({ length: yTickCount }, (_, i) => {
    const t = i / (yTickCount - 1);
    const value = yMin + t * (yMax - yMin);
    return { value, y: sy(value) };
  });

  const bandPolygon =
    band && band.lower.length > 0 && band.upper.length > 0
      ? [...band.upper, ...[...band.lower].reverse()]
          .map((p) => `${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`)
          .join(' ')
      : null;

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        {yTicks.map((tick, i) => (
          <G key={i}>
            <Line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={tick.y}
              y2={tick.y}
              stroke={theme.colors.border}
              strokeWidth={1}
            />
            <SvgText
              x={PAD.left - 6}
              y={tick.y + 4}
              textAnchor="end"
              fontSize={10}
              fill={theme.colors.textSubdued}
            >
              {formatTick(tick.value)}
              {i === yTickCount - 1 ? unitSuffix : ''}
            </SvgText>
          </G>
        ))}

        {bandPolygon != null && (
          <Polygon points={bandPolygon} fill={theme.colors.infoSoft} opacity={0.55} />
        )}

        {series.length > 1 && (
          <Polyline
            points={toPoints(series)}
            fill="none"
            stroke={theme.colors.primary}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {series.map((p, i) => (
          <Circle key={`${p.x}-${i}`} cx={sx(p.x)} cy={sy(p.y)} r={3.5} fill={theme.colors.primaryDeep} />
        ))}
      </Svg>
    </View>
  );
}

function formatTick(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
  },
});
