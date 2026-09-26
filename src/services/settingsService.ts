import { AppSettings } from '../types';
import { storage } from './storage';

const SETTINGS_KEY = '@apulki_mess_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  messName: 'Apulki Mess',
  warningDays: 3,
  enableNotifications: true,
};

export const settingsService = {
  async getSettings(): Promise<AppSettings> {
    const saved = await storage.getItem<AppSettings>(SETTINGS_KEY);
    if (!saved) {
      await storage.setItem(SETTINGS_KEY, DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...saved };
  },

  async updateSettings(newSettings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...newSettings };
    await storage.setItem(SETTINGS_KEY, updated);
    return updated;
  },

  async resetSettings(): Promise<AppSettings> {
    await storage.setItem(SETTINGS_KEY, DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  },
};
