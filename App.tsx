import React from 'react';
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
  return (
    <SafeAreaProvider>
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
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
