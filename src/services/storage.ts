import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage Service abstraction layer.
 * All AsyncStorage calls are routed through this layer to allow seamless
 * swapping with PostgreSQL, Supabase, Firebase, or a custom REST API in the future.
 */
export const storage = {
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? (JSON.parse(jsonValue) as T) : null;
    } catch (e) {
      console.error(`[StorageService] Error reading key "${key}":`, e);
      return null;
    }
  },

  async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      return true;
    } catch (e) {
      console.error(`[StorageService] Error saving key "${key}":`, e);
      return false;
    }
  },

  async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`[StorageService] Error removing key "${key}":`, e);
      return false;
    }
  },

  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (e) {
      console.error('[StorageService] Error clearing storage:', e);
      return false;
    }
  },
};
