import { useState, useEffect } from 'react';
import {
  LOCALE_LABELS,
  type TimeFormatSettings,
  type TimeDisplayMode,
  type SupportedLocale,
} from '@/utils/storage';
import { PRESET_FORMATS, THRESHOLD_OPTIONS } from '../constants';

interface TimeFormatSectionProps {
  settings: TimeFormatSettings;
  onSettingsChange: (settings: TimeFormatSettings) => void;
}

export function TimeFormatSection({ settings, onSettingsChange }: TimeFormatSectionProps) {
  const [customFormat, setCustomFormat] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    const isPreset = PRESET_FORMATS.some((f) => f.value === settings.absoluteFormat);
    setIsCustom(!isPreset);
    if (!isPreset) {
      setCustomFormat(settings.absoluteFormat);
    }
  }, [settings.absoluteFormat]);

  const handleDisplayModeChange = (mode: TimeDisplayMode) => {
    onSettingsChange({ ...settings, displayMode: mode });
  };

  const handleFormatChange = (format: string) => {
    if (format === 'custom') {
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

  return (
    <div className="section-group">
      <h2 className="section-title">Time Format</h2>

      <section className="section">
        <h3>Language</h3>
        <select
          className="select"
          value={settings.locale}
          onChange={(e) => handleLocaleChange(e.target.value as SupportedLocale)}
        >
          {(Object.entries(LOCALE_LABELS) as [SupportedLocale, string][]).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </section>

      <section className="section">
        <h3>Display Mode</h3>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="displayMode"
              checked={settings.displayMode === 'relative'}
              onChange={() => handleDisplayModeChange('relative')}
            />
            <span>Relative</span>
            <span className="hint">e.g., "2 hours ago"</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="displayMode"
              checked={settings.displayMode === 'absolute'}
              onChange={() => handleDisplayModeChange('absolute')}
            />
            <span>Absolute</span>
            <span className="hint">e.g., "2024-01-15 14:30:00"</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="displayMode"
              checked={settings.displayMode === 'auto'}
              onChange={() => handleDisplayModeChange('auto')}
            />
            <span>Auto</span>
            <span className="hint">Relative within threshold, then absolute</span>
          </label>
        </div>
      </section>

      {settings.displayMode === 'auto' && (
        <section className="section">
          <h3>Auto Threshold</h3>
          <p className="description">
            Show relative time until this duration has passed, then switch to absolute.
          </p>
          <select
            className="select"
            value={settings.autoThresholdMs}
            onChange={(e) => handleThresholdChange(Number(e.target.value))}
          >
            {THRESHOLD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </section>
      )}

      {(settings.displayMode === 'absolute' || settings.displayMode === 'auto') && (
        <section className="section">
          <h3>Absolute Format</h3>
          <p className="description">
            Uses{' '}
            <a href="https://day.js.org/docs/en/display/format" target="_blank" rel="noreferrer">
              Day.js format tokens
            </a>
          </p>
          <select
            className="select"
            value={isCustom ? 'custom' : settings.absoluteFormat}
            onChange={(e) => handleFormatChange(e.target.value)}
          >
            {PRESET_FORMATS.map((format) => (
              <option key={format.value} value={format.value}>
                {format.label}
              </option>
            ))}
            <option value="custom">Custom...</option>
          </select>
          {isCustom && (
            <input
              type="text"
              className="input"
              placeholder="Enter custom format..."
              value={customFormat}
              onChange={(e) => handleCustomFormatChange(e.target.value)}
            />
          )}
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.showTodayIndicator}
              onChange={(e) => handleTodayIndicatorChange(e.target.checked)}
            />
            <span>Show today indicator (📅)</span>
          </label>
        </section>
      )}
    </div>
  );
}
