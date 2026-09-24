import React from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { theme } from '@/ui/theme';
import { AppText } from './AppText';

interface ScreenProps extends ScrollViewProps {
  children: React.ReactNode;
  /** 页面主标题（展示在内容区顶部） */
  title?: string;
  /** 标题下的一句副标题，说明本页用途 */
  subtitle?: string;
  /** 底部有 FAB 时给滚动区留出安全间距 */
  bottomInset?: boolean;
  /** 悬浮操作按钮：渲染在滚动区之外，始终固定在右下角 */
  fab?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const edges: Edge[] = ['top', 'left', 'right'];

/** 页面容器：统一安全区、背景色、页标题体系与内边距节奏 */
export function Screen({ children, title, subtitle, bottomInset, fab, style, ...scrollProps }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.root, style]}>
      <ScrollView
        contentContainerStyle={[styles.content, bottomInset && styles.bottomInset]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...scrollProps}
      >
        {title != null && (
          <View style={styles.titleWrap}>
            <AppText variant="title" style={styles.title}>{title}</AppText>
            {subtitle != null && subtitle.length > 0 && (
              <AppText variant="caption" style={styles.subtitle}>{subtitle}</AppText>
            )}
          </View>
        )}
        {children}
      </ScrollView>
      {fab != null && (
        <View pointerEvents="box-none" style={[styles.fabLayer, bottomInset && styles.fabLayerInset]}>
          {fab}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: 20, paddingBottom: theme.spacing.xl },
  // 浮动 Tab 栏（64 高 + 10 底边距）+ 呼吸空间
  bottomInset: { paddingBottom: 140 },
  // FAB 固定层：悬浮于滚动区之外；带底部 Tab 栏时抬高避开胶囊
  fabLayer: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.xl,
    alignItems: 'flex-end',
  },
  fabLayerInset: { bottom: 98 },
  titleWrap: { marginBottom: theme.spacing.lg },
  title: { fontSize: 24 },
  subtitle: { marginTop: 4 },
});
