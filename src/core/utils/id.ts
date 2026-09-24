import * as Crypto from 'expo-crypto';

/** 生成 UUID v4 主键 */
export function newId(): string {
  return Crypto.randomUUID();
}
