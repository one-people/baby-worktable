import React from 'react';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

import { palette } from '@/ui/theme';

/**
 * 统一矢量图标集：24px 网格、2px 圆头描边的圆润线条风格。
 * 界面元素（Tab / 快捷入口 / 统计卡 / 表单动作）一律用这里，
 * 数据行内容图标（记录里的 🍼🌡️ 等）保留 emoji 以保持活泼。
 */
export type IconName =
  | 'home'
  | 'bottle'
  | 'heartPulse'
  | 'trendingUp'
  | 'user'
  | 'note'
  | 'ruler'
  | 'alert'
  | 'clock'
  | 'weight'
  | 'milk'
  | 'plus'
  | 'close'
  | 'chevronRight'
  | 'calendar'
  | 'search'
  | 'trash'
  | 'camera'
  | 'check'
  | 'download'
  | 'upload'
  | 'edit'
  | 'bell'
  | 'pin'
  | 'baby'
  | 'tag';

type GlyphProps = { color: string; sw: number };

export const ICONS: Record<IconName, (p: GlyphProps) => React.ReactElement> = {
  home: ({ color, sw }) => (
    <Path
      d="M3.5 10.8 12 3.5l8.5 7.3V19a2 2 0 0 1-2 2h-4v-5h-5v5h-4a2 2 0 0 1-2-2v-8.2z"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  bottle: ({ color, sw }) => (
    <>
      <Path
        d="M10 3h4M10.5 3v2.3c0 .5-.2 1-.6 1.3C8.2 8 7 9.8 7 12.3V18a2.5 2.5 0 0 0 2.5 2.5h5A2.5 2.5 0 0 0 17 18v-5.7c0-2.5-1.2-4.3-2.9-5.7-.4-.3-.6-.8-.6-1.3V3"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M7 14.5h10" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </>
  ),
  heartPulse: ({ color, sw }) => (
    <>
      <Path
        d="M12 20.3C7.2 16.6 3.5 13.3 3.5 9.4 3.5 6.9 5.4 5 7.8 5c1.7 0 3.2 1 4.2 2.5C13 6 14.5 5 16.2 5c2.4 0 4.3 1.9 4.3 4.4 0 3.9-3.7 7.2-8.5 10.9z"
        stroke={color}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <Polyline
        points="7.5,12 10,12 11.3,9.5 13,14.5 14.3,12 16.5,12"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  trendingUp: ({ color, sw }) => (
    <>
      <Polyline
        points="3.5,16.5 9,11 13,14.5 20.5,7"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="15,7 20.5,7 20.5,12.5"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  user: ({ color, sw }) => (
    <>
      <Circle cx="12" cy="8" r="3.8" stroke={color} strokeWidth={sw} />
      <Path
        d="M4.5 20.5c0-3.6 3.3-5.7 7.5-5.7s7.5 2.1 7.5 5.7"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
      />
    </>
  ),
  note: ({ color, sw }) => (
    <>
      <Rect x="5" y="3.5" width="14" height="17" rx="2.5" stroke={color} strokeWidth={sw} />
      <Path d="M9 8.5h6M9 12.5h6M9 16.5h3.5" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </>
  ),
  ruler: ({ color, sw }) => (
    <>
      <Rect x="3.5" y="9" width="17" height="6.5" rx="2" stroke={color} strokeWidth={sw} />
      <Path d="M7.5 9v3M11 9v3M14.5 9v3M18 9v3" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </>
  ),
  alert: ({ color, sw }) => (
    <>
      <Path
        d="M12 4.5 21 19a1.2 1.2 0 0 1-1 1.8H4a1.2 1.2 0 0 1-1-1.8L12 4.5z"
        stroke={color}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <Path d="M12 10v4.2" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Circle cx="12" cy="17.2" r="1" fill={color} />
    </>
  ),
  clock: ({ color, sw }) => (
    <>
      <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={sw} />
      <Polyline
        points="12,7.5 12,12 15.3,14"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  weight: ({ color, sw }) => (
    <>
      <Rect x="4" y="4.5" width="16" height="15.5" rx="4" stroke={color} strokeWidth={sw} />
      <Path d="M8.5 14.5a3.5 3.5 0 0 1 7 0" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <Circle cx="12" cy="14.5" r="1.1" fill={color} />
    </>
  ),
  milk: ({ color, sw }) => (
    <Path
      d="M12 3.8s6 6 6 10a6 6 0 0 1-12 0c0-4 6-10 6-10z"
      stroke={color}
      strokeWidth={sw}
      strokeLinejoin="round"
    />
  ),
  plus: ({ color, sw }) => (
    <Path d="M12 5.5v13M5.5 12h13" stroke={color} strokeWidth={sw} strokeLinecap="round" />
  ),
  close: ({ color, sw }) => (
    <Path d="M6.5 6.5l11 11M17.5 6.5l-11 11" stroke={color} strokeWidth={sw} strokeLinecap="round" />
  ),
  chevronRight: ({ color, sw }) => (
    <Polyline
      points="9.5,5.5 16,12 9.5,18.5"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  calendar: ({ color, sw }) => (
    <>
      <Rect x="4" y="5.5" width="16" height="15" rx="3" stroke={color} strokeWidth={sw} />
      <Path d="M8 3.5v4M16 3.5v4M4 10.5h16" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </>
  ),
  search: ({ color, sw }) => (
    <>
      <Circle cx="11" cy="11" r="6.5" stroke={color} strokeWidth={sw} />
      <Path d="M15.8 15.8 20.5 20.5" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </>
  ),
  trash: ({ color, sw }) => (
    <>
      <Path
        d="M4.5 7h15M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7M6.5 7l.9 12.1A1.5 1.5 0 0 0 8.9 20.5h6.2a1.5 1.5 0 0 0 1.5-1.4L17.5 7"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10 11v5.5M14 11v5.5" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </>
  ),
  camera: ({ color, sw }) => (
    <>
      <Path
        d="M8.2 7l1.4-2.6h4.8L15.8 7"
        stroke={color}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <Rect x="3.5" y="7" width="17" height="13" rx="3" stroke={color} strokeWidth={sw} />
      <Circle cx="12" cy="13.2" r="3.4" stroke={color} strokeWidth={sw} />
    </>
  ),
  check: ({ color, sw }) => (
    <Polyline
      points="4.5,12.5 9.5,17.5 19.5,7"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  download: ({ color, sw }) => (
    <>
      <Path d="M12 4v11m0 0 3.8-3.8M12 15l-3.8-3.8" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4.5 16.5V18a2.5 2.5 0 0 0 2.5 2.5h10a2.5 2.5 0 0 0 2.5-2.5v-1.5" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </>
  ),
  upload: ({ color, sw }) => (
    <>
      <Path d="M12 15V4m0 0 3.8 3.8M12 4 8.2 7.8" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4.5 16.5V18a2.5 2.5 0 0 0 2.5 2.5h10a2.5 2.5 0 0 0 2.5-2.5v-1.5" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </>
  ),
  edit: ({ color, sw }) => (
    <>
      <Path
        d="M4.5 19.5l.9-3.6L16.4 4.9a2 2 0 0 1 2.8 2.8L8.2 18.7l-3.7.8z"
        stroke={color}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <Path d="M14.8 6.5l2.8 2.8" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </>
  ),
  bell: ({ color, sw }) => (
    <>
      <Path
        d="M6.2 15.8v-4.5a5.8 5.8 0 0 1 11.6 0v4.5l1.7 2.4a.6.6 0 0 1-.5 1H5a.6.6 0 0 1-.5-1l1.7-2.4z"
        stroke={color}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <Path d="M10 20.8a2.2 2.2 0 0 0 4 0" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </>
  ),
  pin: ({ color, sw }) => (
    <>
      <Path
        d="M12 21s-6.3-5.6-6.3-10.5a6.3 6.3 0 0 1 12.6 0C18.3 15.4 12 21 12 21z"
        stroke={color}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10.3" r="2.2" stroke={color} strokeWidth={sw} />
    </>
  ),
  baby: ({ color, sw }) => (
    <>
      <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={sw} />
      <Circle cx="9.3" cy="10" r="1" fill={color} />
      <Circle cx="14.7" cy="10" r="1" fill={color} />
      <Path d="M9 14.3c.9.9 1.9 1.3 3 1.3s2.1-.4 3-1.3" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </>
  ),
  tag: ({ color, sw }) => (
    <>
      <Path
        d="M4 11.5V5a1 1 0 0 1 1-1h6.5L20 12.5 12.5 20 4 11.5z"
        stroke={color}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      <Circle cx="8.3" cy="8.3" r="1.3" fill={color} />
    </>
  ),
};

interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** 统一图标组件：默认 22px、可可棕、2px 圆头描边 */
export function AppIcon({ name, size = 22, color = palette.text, strokeWidth = 2 }: AppIconProps) {
  const Glyph = ICONS[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Glyph color={color} sw={strokeWidth} />
    </Svg>
  );
}
