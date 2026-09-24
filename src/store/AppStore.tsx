import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useServices } from '@/services';
import type { Baby } from '@/models/Baby';
import { VolumeUnit } from '@/models/common';

/**
 * 轻量全局状态：当前宝宝、奶量单位偏好。
 * 数据本身都在 SQLite，由服务层读写；这里只放跨页面共享的会话级状态。
 */
interface AppState {
  babies: Baby[];
  activeBabyId: string | null;
  volumeUnit: VolumeUnit;
  loaded: boolean;
  /** 底层数据版本号：导入备份等整库变更时自增，页面依赖它重新加载 */
  dataVersion: number;
}

type Action =
  | { type: 'loaded'; babies: Baby[]; activeBabyId: string | null }
  | { type: 'babiesChanged'; babies: Baby[]; activeBabyId: string | null }
  | { type: 'setActiveBaby'; id: string }
  | { type: 'setVolumeUnit'; unit: VolumeUnit }
  | { type: 'dataReloaded' };

const STORAGE_KEY = 'babyworktable.settings.v1';

interface AppContextValue extends AppState {
  activeBaby: Baby | null;
  setActiveBaby: (id: string) => void;
  setVolumeUnit: (unit: VolumeUnit) => void;
  /** 增删改宝宝后由页面调用，统一刷新列表并校正当前选中项 */
  refreshBabies: () => Promise<void>;
  /** 整库数据变更（导入备份）后调用：刷新宝宝列表并让各页面重新加载数据 */
  notifyDataReloaded: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { baby: babyService } = useServices();
  const [state, dispatch] = useReducer(reducer, {
    babies: [],
    activeBabyId: null,
    volumeUnit: VolumeUnit.ML,
    loaded: false,
    dataVersion: 0,
  });

  // 启动时载入宝宝列表与持久化的偏好
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let activeBabyId: string | null = null;
      let volumeUnit = VolumeUnit.ML;
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw) as { activeBabyId?: string | null; volumeUnit?: VolumeUnit };
          activeBabyId = saved.activeBabyId ?? null;
          volumeUnit = saved.volumeUnit ?? VolumeUnit.ML;
        }
      } catch {
        // 偏好读取失败时使用默认值
      }
      const babies = await babyService.list();
      if (!cancelled) {
        const stillExists = activeBabyId && babies.some((b) => b.id === activeBabyId);
        dispatch({
          type: 'loaded',
          babies,
          activeBabyId: stillExists ? activeBabyId : (babies[0]?.id ?? null),
        });
        dispatch({ type: 'setVolumeUnit', unit: volumeUnit });
      }
    })().catch((err) => console.error('[AppStore] 初始化失败', err));
    return () => {
      cancelled = true;
    };
  }, [babyService]);

  // 偏好持久化
  useEffect(() => {
    if (!state.loaded) return;
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ activeBabyId: state.activeBabyId, volumeUnit: state.volumeUnit }),
    ).catch(() => undefined);
  }, [state.activeBabyId, state.volumeUnit, state.loaded]);

  const refreshBabies = useCallback(async () => {
    const babies = await babyService.list();
    const stillExists = state.activeBabyId && babies.some((b) => b.id === state.activeBabyId);
    dispatch({
      type: 'babiesChanged',
      babies,
      activeBabyId: stillExists ? state.activeBabyId : (babies[0]?.id ?? null),
    });
  }, [babyService, state.activeBabyId]);

  const notifyDataReloaded = useCallback(async () => {
    await refreshBabies();
    dispatch({ type: 'dataReloaded' });
  }, [refreshBabies]);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      activeBaby: state.babies.find((b) => b.id === state.activeBabyId) ?? null,
      setActiveBaby: (id: string) => dispatch({ type: 'setActiveBaby', id }),
      setVolumeUnit: (unit: VolumeUnit) => dispatch({ type: 'setVolumeUnit', unit }),
      refreshBabies,
      notifyDataReloaded,
    }),
    [state, refreshBabies, notifyDataReloaded],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'loaded':
      return { ...state, babies: action.babies, activeBabyId: action.activeBabyId, loaded: true };
    case 'babiesChanged':
      return { ...state, babies: action.babies, activeBabyId: action.activeBabyId };
    case 'setActiveBaby':
      return { ...state, activeBabyId: action.id };
    case 'setVolumeUnit':
      return { ...state, volumeUnit: action.unit };
    case 'dataReloaded':
      return { ...state, dataVersion: state.dataVersion + 1 };
  }
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp 必须在 <AppProvider> 内使用');
  return ctx;
}
