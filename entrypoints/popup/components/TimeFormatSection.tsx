import { useEffect, useState } from "react";
import { t } from "@/utils/i18n";
import {
  LOCALE_LABELS,
  type SupportedLocale,
  type TimeDisplayMode,
  type TimeFormatSettings,
} from "@/utils/storage";
import { getThresholdOptions, PRESET_FORMATS } from "../constants";

interface TimeFormatSectionProps {
  settings: TimeFormatSettings;
  onSettingsChange: (settings: TimeFormatSettings) => void;
}

export function TimeFormatSection({
  settings,
  onSettingsChange,
}: TimeFormatSectionProps) {
  const [customFormat, setCustomFormat] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    const isPreset = PRESET_FORMATS.some(
      (f) => f.value === settings.absoluteFormat,
    );
    setIsCustom(!isPreset);
    if (!isPreset) {
      setCustomFormat(settings.absoluteFormat);
    }
  }, [settings.absoluteFormat]);

  const handleDisplayModeChange = (mode: TimeDisplayMode) => {
    onSettingsChange({ ...settings, displayMode: mode });
  };

  const handleFormatChange = (format: string) => {
    if (format === "custom") {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      onSettingsChange({ ...settings, absoluteFormat: format });
    }
  };

  const handleCustomFormatChange = (format: string) => {
    setCustomFormat(format);
    onSettingsChange({ ...settings, absoluteFormat: format });
  };

  const handleThresholdChange = (threshold: number) => {
    onSettingsChange({ ...settings, autoThresholdMs: threshold });
  };

  const handleLocaleChange = (locale: SupportedLocale) => {
    onSettingsChange({ ...settings, locale });
  };

  const handleTodayIndicatorChange = (checked: boolean) => {
    onSettingsChange({ ...settings, showTodayIndicator: checked });
  };

  const thresholdOptions = getThresholdOptions();

  return (
    <div className="rounded-lg bg-bg-section p-3">
      <h2 className="font-semibold text-base text-primary">
        {t("timeFormatTitle")}
      </h2>
      <div className="mt-3 flex flex-col gap-4">
        <section>
          <h3 className="mb-2 text-sm">{t("timeFormatLanguage")}</h3>
          <select
            className="w-full cursor-pointer rounded-md border border-border bg-bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
            value={settings.locale}
            onChange={(e) =>
              handleLocaleChange(e.target.value as SupportedLocale)
            }
          >
            {(Object.entries(LOCALE_LABELS) as [SupportedLocale, string][]).map(
              ([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ),
            )}
          </select>
        </section>

        <section>
          <h3 className="mb-2 text-sm">{t("timeFormatDisplayMode")}</h3>
          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="displayMode"
                className="m-0 cursor-pointer"
                checked={settings.displayMode === "relative"}
                onChange={() => handleDisplayModeChange("relative")}
              />
              <span>{t("displayModeRelative")}</span>
              <span className="text-text-muted text-xs">
                {t("displayModeRelativeEx")}
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="displayMode"
                className="m-0 cursor-pointer"
                checked={settings.displayMode === "absolute"}
                onChange={() => handleDisplayModeChange("absolute")}
              />
              <span>{t("displayModeAbsolute")}</span>
              <span className="text-text-muted text-xs">
                {t("displayModeAbsoluteEx")}
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="displayMode"
                className="m-0 cursor-pointer"
                checked={settings.displayMode === "auto"}
                onChange={() => handleDisplayModeChange("auto")}
              />
              <span>{t("displayModeAuto")}</span>
              <span className="text-text-muted text-xs">
                {t("displayModeAutoDesc")}
              </span>
            </label>
          </div>
        </section>

        {settings.displayMode === "auto" && (
          <section>
            <h3 className="mb-2 text-sm">{t("autoThresholdTitle")}</h3>
            <p className="mb-2 text-text-muted text-xs">
              {t("autoThresholdDesc")}
            </p>
            <select
              className="w-full cursor-pointer rounded-md border border-border bg-bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
              value={settings.autoThresholdMs}
              onChange={(e) => handleThresholdChange(Number(e.target.value))}
            >
              {thresholdOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </section>
        )}

        {(settings.displayMode === "absolute" ||
          settings.displayMode === "auto") && (
          <section>
            <h3 className="mb-2 text-sm">{t("absoluteFormatTitle")}</h3>
            <p className="mb-2 text-text-muted text-xs">
              <a
                href="https://day.js.org/docs/en/display/format"
                target="_blank"
                rel="noreferrer"
                className="text-primary"
              >
                {t("absoluteFormatDesc")}
              </a>
            </p>
            <select
              className="w-full cursor-pointer rounded-md border border-border bg-bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
              value={isCustom ? "custom" : settings.absoluteFormat}
              onChange={(e) => handleFormatChange(e.target.value)}
            >
              {PRESET_FORMATS.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
              <option value="custom">{t("absoluteFormatCustom")}</option>
            </select>
            {isCustom && (
              <input
                type="text"
                className="mt-2 w-full cursor-text rounded-md border border-border bg-bg-input px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder={t("absoluteFormatPlaceholder")}
                value={customFormat}
                onChange={(e) => handleCustomFormatChange(e.target.value)}
              />
            )}
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-[0.85rem]">
              <input
                type="checkbox"
                className="m-0 cursor-pointer"
                checked={settings.showTodayIndicator}
                onChange={(e) => handleTodayIndicatorChange(e.target.checked)}
              />
              <span>{t("showTodayIndicator")}</span>
            </label>
          </section>
        )}
      </div>
    </div>
  );
}
