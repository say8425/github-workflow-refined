import { storage } from '#imports';

export type TimeDisplayMode = 'relative' | 'absolute' | 'auto';

export type SupportedLocale =
  | 'en'
  | 'ko'
  | 'ja'
  | 'zh-cn'
  | 'zh-tw'
  | 'de'
  | 'fr'
  | 'es'
  | 'pt'
  | 'ru';

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  ko: '한국어',
  ja: '日本語',
  'zh-cn': '简体中文',
  'zh-tw': '繁體中文',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
  ru: 'Русский',
};

export interface TimeFormatSettings {
  displayMode: TimeDisplayMode;
  absoluteFormat: string;
  autoThresholdMs: number;
  locale: SupportedLocale;
  showTodayIndicator: boolean;
}

export const DEFAULT_TIME_FORMAT_SETTINGS: TimeFormatSettings = {
  displayMode: 'auto',
  absoluteFormat: 'YYYY-MM-DD HH:mm:ss',
  autoThresholdMs: 24 * 60 * 60 * 1000, // 24 hours
  locale: 'en',
  showTodayIndicator: false,
};

export const timeFormatSettings = storage.defineItem<TimeFormatSettings>(
  'local:timeFormatSettings',
  {
    fallback: DEFAULT_TIME_FORMAT_SETTINGS,
  }
);
