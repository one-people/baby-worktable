import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { theme, tones, type Tone } from '@/ui/theme';
import { AppText } from './AppText';
import { AppIcon, ICONS, type IconName } from '@/ui/icons';

interface ListRowProps {
  title: string;
  subtitle?: string;
  /** 左侧图标：矢量图标名优先，未注册的字符串按 emoji 渲染 */
  icon?: IconName | string;
  /** 指定气泡色调；缺省按图标名稳定散列到五种马卡龙色 */
  tone?: Tone;
  trailing?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
}

const TONE_KEYS = Object.keys(tones) as Tone[];
/** 图标气泡的柔和底色：按图标字符稳定散列到五种马卡龙色 */
function toneFor(icon: string): Tone {
  let h = 0;
  for (const ch of icon) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return TONE_KEYS[h % TONE_KEYS.length]!;
}

/** 列表行：图标气泡 + 标题/副标题 + 右侧内容 */
export function ListRow({ title, subtitle, icon, tone, trailing, onPress, onLongPress }: ListRowProps) {
  const isVector = icon != null && icon in ICONS;
  const resolvedTone = tone ?? (icon != null ? toneFor(icon) : undefined);
  const inner = (
    <View style={styles.row}>
      {icon != null && (
        <View style={[styles.iconBubble, resolvedTone != null && { backgroundColor: tones[resolvedTone].soft }]}>
          {isVector ? (
            <AppIcon
              name={icon as IconName}
              size={20}
              color={resolvedTone != null ? tones[resolvedTone].deep : theme.colors.primaryDeep}
              strokeWidth={2.1}
            />
          ) : (
            <AppText style={styles.icon}>{icon}</AppText>
          )}
        </View>
      )}
      <View style={styles.texts}>
        <AppText variant="body" style={styles.title} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle != null && subtitle.length > 0 && (
          <AppText variant="caption" numberOfLines={2}>
            {subtitle}
          </AppText>
        )}
      </View>
      {trailing}
    </View>
  );
  if (onPress == null && onLongPress == null) return <View style={styles.container}>{inner}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.container, theme.shadows.card, pressed && styles.pressed]}
    >
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 21 },
  texts: { flex: 1, gap: 2 },
  title: { fontWeight: '600' },
});
