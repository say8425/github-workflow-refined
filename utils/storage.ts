import { storage } from "#imports";

export type TimeDisplayMode = "relative" | "absolute" | "auto";

export type SupportedLocale =
  | "en"
  | "ko"
  | "ja"
  | "zh-cn"
  | "zh-tw"
  | "de"
  | "fr"
  | "es"
  | "pt"
  | "ru";

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: "English",
  ko: "한국어",
  ja: "日本語",
  "zh-cn": "简体中文",
  "zh-tw": "繁體中文",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  pt: "Português",
  ru: "Русский",
};

function getBrowserLocale(): SupportedLocale {
  const browserLang = navigator.language.toLowerCase();

  // zh-CN, zh-TW 등 특수 케이스 처리
  if (browserLang.startsWith("zh")) {
    if (browserLang.includes("tw") || browserLang.includes("hant")) {
      return "zh-tw";
    }
    return "zh-cn";
  }

  // 언어 코드 추출 (ko-KR -> ko)
  const langCode = browserLang.split("-")[0];

  const supportedLocales: SupportedLocale[] = [
    "en",
    "ko",
    "ja",
    "de",
    "fr",
    "es",
    "pt",
    "ru",
  ];

  if (supportedLocales.includes(langCode as SupportedLocale)) {
    return langCode as SupportedLocale;
  }

  return "en";
}

export interface TimeFormatSettings {
  displayMode: TimeDisplayMode;
  absoluteFormat: string;
  autoThresholdMs: number;
  locale: SupportedLocale;
  showTodayIndicator: boolean;
}

export interface WorkflowSettings {
  autoExpandWorkflows: boolean;
}

export const DEFAULT_TIME_FORMAT_SETTINGS: TimeFormatSettings = {
  displayMode: "auto",
  absoluteFormat: "YYYY-MM-DD HH:mm:ss",
  autoThresholdMs: 24 * 60 * 60 * 1000, // 24 hours
  locale: getBrowserLocale(),
  showTodayIndicator: false,
};

export const timeFormatSettingsStorage = storage.defineItem<TimeFormatSettings>(
  "local:timeFormatSettings",
  {
    fallback: DEFAULT_TIME_FORMAT_SETTINGS,
  },
);

export const DEFAULT_WORKFLOW_SETTINGS: WorkflowSettings = {
  autoExpandWorkflows: true,
};

export const workflowSettingsStorage = storage.defineItem<WorkflowSettings>(
  "local:workflowSettings",
  {
    fallback: DEFAULT_WORKFLOW_SETTINGS,
  },
);
