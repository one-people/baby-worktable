import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Pressable,
  Platform,
  StyleSheet,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface PressableScaleProps extends PressableProps {
  children: React.ReactNode;
  /** 按下时缩放到的比例，默认 0.95 */
  scaleTo?: number;
  /** 外观与布局样式（背景、圆角、阴影、尺寸都放这里） */
  style?: StyleProp<ViewStyle>;
  /** 内容撑满容器（整行大卡片用）；默认居中收缩（按钮/瓦片用） */
  stretch?: boolean;
}

// Pressable 自身承载样式与缩放动画：点击热区覆盖整个元素（含内边距），
// 绝对定位子元素（如勾选徽标）也以本元素为定位基准
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * 弹簧按压缩放容器：按钮 / 瓦片 / 卡片的「果冻感」按压反馈。
 * 外观样式与 transform 作用在同一个节点上，保证热区与视觉一致。
 */
export function PressableScale({
  children,
  scaleTo = 0.95,
  style,
  stretch,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;
  // Web 端不支持原生驱动，退回 JS 驱动避免告警
  const native = Platform.OS !== 'web';

  const handleIn = useCallback(
    (e: GestureResponderEvent) => {
      Animated.spring(scale, { toValue: scaleTo, speed: 50, bounciness: 7, useNativeDriver: native }).start();
      onPressIn?.(e);
    },
    [onPressIn, scale, scaleTo, native],
  );
  const handleOut = useCallback(
    (e: GestureResponderEvent) => {
      Animated.spring(scale, { toValue: 1, speed: 28, bounciness: 9, useNativeDriver: native }).start();
      onPressOut?.(e);
    },
    [onPressOut, scale, native],
  );

  return (
    <AnimatedPressable
      {...rest}
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={handleIn}
      onPressOut={handleOut}
      style={[styles.self, stretch && styles.stretch, style, { transform: [{ scale }] }, disabled && { opacity: 0.5 }]}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  self: { alignItems: 'center', justifyContent: 'center' },
  stretch: { alignItems: 'stretch', justifyContent: 'flex-start' },
});
