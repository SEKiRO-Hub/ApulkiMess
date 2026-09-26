import { AppSettings } from '../types';
import { ref, get, set } from 'firebase/database';
import { db } from '../../firebase';

export const DEFAULT_SETTINGS: AppSettings = {
  messName: 'Apulki Mess',
  warningDays: 3,
  enableNotifications: true,
};

export const settingsService = {
  async getSettings(): Promise<AppSettings> {
    try {
      const snapshot = await get(ref(db, 'settings'));
      if (snapshot.exists()) {
        const saved = snapshot.val();
        return { ...DEFAULT_SETTINGS, ...saved };
      }
      await set(ref(db, 'settings'), DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Failed to fetch settings from Firebase:', error);
      return DEFAULT_SETTINGS;
    }
  },

  async updateSettings(newSettings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...newSettings };
    try {
      await set(ref(db, 'settings'), updated);
    } catch (error) {
      console.error('Failed to update settings in Firebase:', error);
    }
    return updated;
  },

  async resetSettings(): Promise<AppSettings> {
    try {
      await set(ref(db, 'settings'), DEFAULT_SETTINGS);
    } catch (error) {
      console.error('Failed to reset settings in Firebase:', error);
    }
    return DEFAULT_SETTINGS;
  },
};
