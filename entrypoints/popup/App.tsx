import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';
import 'dayjs/locale/ja';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/zh-tw';
import 'dayjs/locale/de';
import 'dayjs/locale/fr';
import 'dayjs/locale/es';
import 'dayjs/locale/pt';
import 'dayjs/locale/ru';
import {
  timeFormatSettings,
  workflowSettings,
  DEFAULT_TIME_FORMAT_SETTINGS,
  DEFAULT_WORKFLOW_SETTINGS,
  LOCALE_LABELS,
  type TimeFormatSettings,
  type WorkflowSettings,
  type TimeDisplayMode,
  type SupportedLocale,
} from '@/utils/storage';
import './App.css';

dayjs.extend(relativeTime);

const PRESET_FORMATS = [
  { label: 'YYYY-MM-DD HH:mm:ss', value: 'YYYY-MM-DD HH:mm:ss' },
  { label: 'YYYY/MM/DD HH:mm', value: 'YYYY/MM/DD HH:mm' },
  { label: 'MM/DD/YYYY h:mm A', value: 'MM/DD/YYYY h:mm A' },
  { label: 'DD/MM/YYYY HH:mm', value: 'DD/MM/YYYY HH:mm' },
  { label: 'MMM DD, YYYY h:mm A', value: 'MMM DD, YYYY h:mm A' },
  { label: 'MMMM DD, YYYY HH:mm', value: 'MMMM DD, YYYY HH:mm' },
];

const THRESHOLD_OPTIONS = [
  { label: '1 hour', value: 60 * 60 * 1000 },
  { label: '6 hours', value: 6 * 60 * 60 * 1000 },
  { label: '12 hours', value: 12 * 60 * 60 * 1000 },
  { label: '24 hours', value: 24 * 60 * 60 * 1000 },
  { label: '7 days', value: 7 * 24 * 60 * 60 * 1000 },
  { label: '30 days', value: 30 * 24 * 60 * 60 * 1000 },
];

function App() {
  const [settings, setSettings] = useState<TimeFormatSettings>(DEFAULT_TIME_FORMAT_SETTINGS);
  const [wfSettings, setWfSettings] = useState<WorkflowSettings>(DEFAULT_WORKFLOW_SETTINGS);
  const [customFormat, setCustomFormat] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    timeFormatSettings.getValue().then((value) => {
      setSettings(value);
      const isPreset = PRESET_FORMATS.some((f) => f.value === value.absoluteFormat);
      setIsCustom(!isPreset);
      if (!isPreset) {
        setCustomFormat(value.absoluteFormat);
      }
    });
    workflowSettings.getValue().then((value) => {
      setWfSettings(value);
    });
  }, []);

  const handleDisplayModeChange = (mode: TimeDisplayMode) => {
    setSettings((prev) => ({ ...prev, displayMode: mode }));
  };

  const handleFormatChange = (format: string) => {
    if (format === 'custom') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      setSettings((prev) => ({ ...prev, absoluteFormat: format }));
    }
  };

  const handleCustomFormatChange = (format: string) => {
    setCustomFormat(format);
    setSettings((prev) => ({ ...prev, absoluteFormat: format }));
  };

  const handleThresholdChange = (threshold: number) => {
    setSettings((prev) => ({ ...prev, autoThresholdMs: threshold }));
  };

  const handleLocaleChange = (locale: SupportedLocale) => {
    setSettings((prev) => ({ ...prev, locale }));
  };

  const handleTodayIndicatorChange = (checked: boolean) => {
    setSettings((prev) => ({ ...prev, showTodayIndicator: checked }));
  };

  const handleAutoExpandChange = (checked: boolean) => {
    setWfSettings((prev) => ({ ...prev, autoExpandWorkflows: checked }));
  };

  const handleRemovePinnedWorkflow = (url: string) => {
    setWfSettings((prev) => ({
      ...prev,
      pinnedWorkflows: prev.pinnedWorkflows.filter((w) => w.url !== url),
    }));
  };

  const handleSave = async () => {
    await Promise.all([
      timeFormatSettings.setValue(settings),
      workflowSettings.setValue(wfSettings),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const previewTime = dayjs().subtract(2, 'hour');
  const getPreview = () => {
    const localizedTime = previewTime.locale(settings.locale);
    const elapsed = Date.now() - previewTime.valueOf();
    let result: string;
    let showAbsolute = false;

    switch (settings.displayMode) {
      case 'relative':
        result = localizedTime.fromNow();
        break;
      case 'absolute':
        result = localizedTime.format(settings.absoluteFormat);
        showAbsolute = true;
        break;
      case 'auto':
        if (elapsed > settings.autoThresholdMs) {
          result = localizedTime.format(settings.absoluteFormat);
          showAbsolute = true;
        } else {
          result = localizedTime.fromNow();
        }
        break;
    }

    // Preview is 2 hours ago, so it's always "today"
    if (showAbsolute && settings.showTodayIndicator) {
      result = '📅 ' + result;
    }

    return result;
  };

  return (
    <div className="app">
      <h1>GitHub Workflow Refined</h1>

      <div className="section-group">
        <h2 className="section-title">Workflow List</h2>

        <section className="section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={wfSettings.autoExpandWorkflows}
              onChange={(e) => handleAutoExpandChange(e.target.checked)}
            />
            <span>Auto-expand "Show more workflows..."</span>
          </label>
        </section>

        <section className="section">
          <h3>Pinned Workflows</h3>
          <p className="description">
            Pin workflows from the GitHub Actions page using the pin button next to each workflow.
          </p>
          {wfSettings.pinnedWorkflows.length === 0 ? (
            <p className="empty-message">No pinned workflows</p>
          ) : (
            <ul className="pinned-list">
              {wfSettings.pinnedWorkflows.map((workflow) => (
                <li key={workflow.url} className="pinned-item">
                  <span className="pinned-name" title={workflow.repo}>
                    {workflow.name}
                  </span>
                  <button
                    className="unpin-button"
                    onClick={() => handleRemovePinnedWorkflow(workflow.url)}
                    title="Unpin"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

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

        <section className="section preview">
          <h3>Preview</h3>
          <div className="preview-box">{getPreview()}</div>
        </section>
      </div>

      <button className="save-button" onClick={handleSave}>
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}

export default App;
