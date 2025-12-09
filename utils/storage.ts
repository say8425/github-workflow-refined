import { storage } from '#imports';

export type TimeDisplayMode = 'relative' | 'absolute' | 'auto';

export interface TimeFormatSettings {
  displayMode: TimeDisplayMode;
  absoluteFormat: string;
  autoThresholdMs: number;
}

export const DEFAULT_TIME_FORMAT_SETTINGS: TimeFormatSettings = {
  displayMode: 'auto',
  absoluteFormat: 'YYYY-MM-DD HH:mm:ss',
  autoThresholdMs: 24 * 60 * 60 * 1000, // 24 hours
};

export const timeFormatSettings = storage.defineItem<TimeFormatSettings>(
  'local:timeFormatSettings',
  {
    fallback: DEFAULT_TIME_FORMAT_SETTINGS,
  }
);
