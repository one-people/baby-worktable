import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, type Theme as NavTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// 副作用导入：注册全局通知展示策略（前台也弹横幅）
import '@/core/reminders/reminderScheduler';

import { theme } from '@/ui';
import RootNavigator from '@/navigation/RootNavigator';
import { ServicesProvider } from '@/services';
import { AppProvider } from '@/store/AppStore';

const navTheme: NavTheme = {
  colors: {
    primary: theme.colors.primary,
    background: theme.colors.bg,
    card: theme.colors.card,
    text: theme.colors.text,
    border: theme.colors.border,
    notification: theme.colors.primary,
  },
  dark: false,
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '800' },
  },
};

export default function App() {
  // web 端把页面画布刷成主题奶油底：宽屏居中列之外的区域不再露出浏览器默认底色
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.style.backgroundColor = theme.colors.bg;
      document.body.style.backgroundColor = theme.colors.bg;
    }
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.shell}>
        <ServicesProvider>
          <AppProvider>
            <NavigationContainer
              theme={navTheme}
              linking={{ enabled: false, prefixes: [] }}
              // 标签页标题由各屏自定义文案承担，禁止把屏幕名（Home 等）写入浏览器标签标题
              documentTitle={{ enabled: false }}
            >
              <RootNavigator />
            </NavigationContainer>
          </AppProvider>
        </ServicesProvider>
      </View>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  // 桌面宽屏下把应用收敛为居中的手机宽度列，避免内容横向拉伸
  shell: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: theme.colors.bg,
    ...Platform.select({ web: { maxWidth: 520 } as const }),
  },
});
