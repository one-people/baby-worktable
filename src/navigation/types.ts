import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/** 根堆栈：Tabs 之外的页面（备忘、过敏原、宝宝编辑、记录详情） */
export type RootStackParamList = {
  Tabs: undefined;
  Memos: undefined;
  Allergens: undefined;
  /** 喂养记录详情 */
  FeedingDetail: { id: string };
  /** 异常事件详情 */
  EventDetail: { id: string };
  /** 传入 babyId 为编辑，否则为新建 */
  BabyEditor: { babyId?: string } | undefined;
};

/** 底部 Tab：五个高频入口 */
export type MainTabParamList = {
  Home: undefined;
  Feeding: undefined;
  Events: undefined;
  Growth: undefined;
  Settings: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

/**
 * Tab 页面的导航属性：既能 navigate 同级 Tab（Feeding/Events/…），
 * 也能 push 根堆栈页面（Memos/Allergens/BabyEditor）。
 */
export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
