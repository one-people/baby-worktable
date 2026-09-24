// SDK 54 起默认导出为新的 File/Directory API，旧异步 API 迁移至 /legacy 子路径
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

import { newId } from '@/core/utils/id';

/**
 * 照片附件存储：所有照片复制进应用沙盒 photos/ 目录，
 * 数据库只保存相对路径。删除附件时同步清理文件，卸载应用即全量清除。
 */
const PHOTO_DIR = () => `${FileSystem.documentDirectory}photos/`;

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTO_DIR());
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR(), { intermediates: true });
  }
}

/** 申请相册权限并拉起选图，返回临时 URI；用户取消返回 null */
export async function pickPhotoFromLibrary(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.85,
  });
  if (result.canceled) return null;
  return result.assets[0]?.uri ?? null;
}

/** 将临时 URI 的图片落盘到沙盒，返回相对路径（如 photos/abc.jpg） */
export async function savePhoto(tempUri: string): Promise<string> {
  await ensureDir();
  const ext = guessExtension(tempUri);
  const fileName = `${newId()}${ext}`;
  const dest = `${PHOTO_DIR()}${fileName}`;
  await FileSystem.copyAsync({ from: tempUri, to: dest });
  return `photos/${fileName}`;
}

/** 相对路径 -> 可用于 <Image source> 的绝对 URI */
export function resolvePhotoUri(relativePath: string): string {
  return `${FileSystem.documentDirectory}${relativePath}`;
}

/** 删除沙盒内的一张照片（记录删除时由服务层调用） */
export async function deletePhoto(relativePath: string): Promise<void> {
  const uri = resolvePhotoUri(relativePath);
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }
}

function guessExtension(uri: string): string {
  const m = uri.split('?')[0]?.match(/\.(\w{3,4})$/);
  if (m) return `.${m[1]!.toLowerCase()}`;
  return '.jpg';
}
