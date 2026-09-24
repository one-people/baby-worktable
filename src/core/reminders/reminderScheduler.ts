import * as Notifications from 'expo-notifications';

import { ReminderRepeat } from '@/models/common';
import type { ISODateTime } from '@/models/common';
import { parseISODateTime } from '@/core/utils/datetime';

/**
 * 全局通知处理：前台收到提醒时也以横幅展示。
 * 在 App 入口处 import 本模块以生效。
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface ReminderInput {
  title: string;
  body?: string;
  at: ISODateTime;
  repeat?: ReminderRepeat;
}

/**
 * 备忘提醒调度器：expo-notifications 的薄封装。
 * 返回通知 id 存入 memos.notification_id，取消/编辑时据此撤销。
 */
export const reminderScheduler = {
  async ensurePermission(): Promise<boolean> {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted || asked.status === Notifications.PermissionStatus.GRANTED;
  },

  async schedule(input: ReminderInput): Promise<string | null> {
    const granted = await this.ensurePermission();
    if (!granted) return null;

    const date = parseISODateTime(input.at);
    const trigger: Notifications.NotificationTriggerInput =
      input.repeat === ReminderRepeat.Daily
        ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: date.getHours(), minute: date.getMinutes() }
        : input.repeat === ReminderRepeat.Weekly
          ? {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: (date.getDay() + 1) || 7, // JS: 0=周日 -> iOS weekday 1=周日
              hour: date.getHours(),
              minute: date.getMinutes(),
            }
          : { type: Notifications.SchedulableTriggerInputTypes.DATE, date };

    return Notifications.scheduleNotificationAsync({
      content: {
        title: input.title,
        body: input.body,
        sound: true,
      },
      trigger,
    });
  },

  async cancel(notificationId: string | null | undefined): Promise<void> {
    if (!notificationId) return;
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  },
};
