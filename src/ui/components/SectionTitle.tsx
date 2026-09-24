import React from 'react';
import { StyleSheet, View } from 'react-native';

import { theme } from '@/ui/theme';
import { AppText } from './AppText';
import { AppIcon, type IconName } from '@/ui/icons';

interface SectionTitleProps {
  title: string;
  /** 可选的小图标，放在标题前 */
  icon?: IconName;
  /** 右侧补充说明或动作 */
  trailing?: React.ReactNode;
}

/** 分区标题：统一的全页节奏（上 24 / 下 12），可带小图标与尾部动作 */
export function SectionTitle({ title, icon, trailing }: SectionTitleProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {icon != null && <AppIcon name={icon} size={17} color={theme.colors.primaryDeep} strokeWidth={2.4} />}
        <AppText variant="heading" style={styles.title}>{title}</AppText>
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 16 },
});
