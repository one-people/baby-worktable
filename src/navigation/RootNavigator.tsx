import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { theme } from '@/ui';
import { AppText } from '@/ui/components/AppText';
import { AppIcon, type IconName } from '@/ui/icons';
import { AllergensScreen } from '@/features/allergens/AllergensScreen';
import { BabyEditorScreen } from '@/features/settings/BabyEditorScreen';
import { EventDetailScreen } from '@/features/events/EventDetailScreen';
import { EventsScreen } from '@/features/events/EventsScreen';
import { FeedingDetailScreen } from '@/features/feeding/FeedingDetailScreen';
import { FeedingScreen } from '@/features/feeding/FeedingScreen';
import { GrowthScreen } from '@/features/growth/GrowthScreen';
import { HomeScreen } from '@/features/home/HomeScreen';
import { MemosScreen } from '@/features/memos/MemosScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import type { MainTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_META: Record<keyof MainTabParamList, { label: string; icon: IconName }> = {
  Home: { label: '首页', icon: 'home' },
  Feeding: { label: '喂养', icon: 'bottle' },
  Events: { label: '事件', icon: 'heartPulse' },
  Growth: { label: '成长', icon: 'trendingUp' },
  Settings: { label: '我的', icon: 'user' },
};

/** 堆栈页（备忘录/过敏原/宝宝档案）的导航头统一样式 */
const STACK_HEADER_OPTIONS = {
  headerStyle: { backgroundColor: theme.colors.bg },
  headerTitleStyle: { fontWeight: '800' as const, fontSize: 17, color: theme.colors.text },
  headerTintColor: theme.colors.primaryDeep,
  headerShadowVisible: false,
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primaryDeep,
        tabBarInactiveTintColor: theme.colors.textSubdued,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: theme.colors.card,
          borderTopWidth: 0,
          marginHorizontal: 14,
          marginBottom: 10,
          borderRadius: theme.radius.lg,
          height: 64,
          paddingHorizontal: 6,
          ...theme.shadows.float,
        },
        tabBarIcon: ({ color, focused }) => (
          <AppIcon
            name={TAB_META[route.name].icon}
            size={23}
            color={color}
            strokeWidth={focused ? 2.4 : 2}
          />
        ),
        tabBarLabel: ({ color }) => (
          <AppText variant="caption" style={{ color, fontWeight: '700', fontSize: 11, marginBottom: 8 }}>
            {TAB_META[route.name].label}
          </AppText>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Feeding" component={FeedingScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Growth" component={GrowthScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={MainTabs} />
      <Stack.Screen
        name="Memos"
        component={MemosScreen}
        options={{ headerShown: true, headerTitle: '日常备忘录', ...STACK_HEADER_OPTIONS }}
      />
      <Stack.Screen
        name="Allergens"
        component={AllergensScreen}
        options={{ headerShown: true, headerTitle: '过敏原管理', ...STACK_HEADER_OPTIONS }}
      />
      <Stack.Screen
        name="FeedingDetail"
        component={FeedingDetailScreen}
        options={{ headerShown: true, headerTitle: '喂养详情', ...STACK_HEADER_OPTIONS }}
      />
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{ headerShown: true, headerTitle: '事件详情', ...STACK_HEADER_OPTIONS }}
      />
      <Stack.Screen
        name="BabyEditor"
        component={BabyEditorScreen}
        options={{ headerShown: true, headerTitle: '宝宝档案', presentation: 'modal', ...STACK_HEADER_OPTIONS }}
      />
    </Stack.Navigator>
  );
}
