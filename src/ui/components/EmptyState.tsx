import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';

import { theme, tones } from '@/ui/theme';
import { AppText } from './AppText';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

/** 空状态占位：emoji 坐在马卡龙色气泡里，出现时轻轻弹一下 */
export function EmptyState({ icon = '🍼', title, subtitle, action }: EmptyStateProps) {
  const scale = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 130,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [scale]);

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.bubble, { transform: [{ scale }] }]}>
        <AppText style={styles.icon}>{icon}</AppText>
      </Animated.View>
      <AppText variant="heading" style={styles.title}>
        {title}
      </AppText>
      {subtitle != null && subtitle.length > 0 && (
        <AppText variant="caption" style={styles.subtitle}>
          {subtitle}
        </AppText>
      )}
      {action != null && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: theme.spacing.xxl, gap: theme.spacing.sm },
  bubble: {
    width: 84,
    height: 84,
    borderRadius: theme.radius.xl,
    backgroundColor: tones.pink.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  icon: { fontSize: 40 },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', maxWidth: 260 },
  action: { marginTop: theme.spacing.md },
});
