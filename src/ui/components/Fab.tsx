import React from 'react';
import { StyleSheet, View } from 'react-native';

import { theme } from '@/ui/theme';
import { AppIcon, ICONS, type IconName } from '@/ui/icons';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

interface FabProps {
  label: string;
  /** 可选前置图标：矢量图标名优先，未注册的字符串按 emoji 渲染 */
  icon?: IconName | string;
  onPress: () => void;
}

/** 悬浮添加按钮（经 Screen 的 fab 槽固定在右下角）：胶囊形 + 暖阴影 + 弹簧按压 */
export function Fab({ label, icon, onPress }: FabProps) {
  const isVector = icon != null && icon in ICONS;
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.92}
      accessibilityLabel={label}
      style={styles.fab}
    >
      <View style={styles.row}>
        {isVector ? (
          <AppIcon name={icon as IconName} size={19} color="#FFFFFF" strokeWidth={2.6} />
        ) : icon != null ? (
          <AppText style={styles.emoji}>{icon}</AppText>
        ) : (
          <AppIcon name="plus" size={19} color="#FFFFFF" strokeWidth={2.6} />
        )}
        <AppText style={styles.label}>{label}</AppText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  fab: {
    alignSelf: 'flex-end',
    borderRadius: theme.radius.pill,
    paddingVertical: 15,
    paddingHorizontal: 22,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.float,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  emoji: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  label: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
