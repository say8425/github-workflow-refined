import { useState, useEffect } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  timeFormatSettings,
  DEFAULT_TIME_FORMAT_SETTINGS,
  type TimeFormatSettings,
  type TimeDisplayMode,
} from "@/utils/storage";
import "./App.css";

dayjs.extend(relativeTime);

const PRESET_FORMATS = [
  { label: "YYYY-MM-DD HH:mm:ss", value: "YYYY-MM-DD HH:mm:ss" },
  { label: "YYYY/MM/DD HH:mm", value: "YYYY/MM/DD HH:mm" },
  { label: "MM/DD/YYYY h:mm A", value: "MM/DD/YYYY h:mm A" },
  { label: "DD/MM/YYYY HH:mm", value: "DD/MM/YYYY HH:mm" },
  { label: "MMM DD, YYYY h:mm A", value: "MMM DD, YYYY h:mm A" },
  { label: "MMMM DD, YYYY HH:mm", value: "MMMM DD, YYYY HH:mm" },
];

const THRESHOLD_OPTIONS = [
  { label: "1 hour", value: 60 * 60 * 1000 },
  { label: "6 hours", value: 6 * 60 * 60 * 1000 },
  { label: "12 hours", value: 12 * 60 * 60 * 1000 },
  { label: "24 hours", value: 24 * 60 * 60 * 1000 },
  { label: "7 days", value: 7 * 24 * 60 * 60 * 1000 },
  { label: "30 days", value: 30 * 24 * 60 * 60 * 1000 },
];

function App() {
  const [settings, setSettings] = useState<TimeFormatSettings>(
    DEFAULT_TIME_FORMAT_SETTINGS,
  );
  const [customFormat, setCustomFormat] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    timeFormatSettings.getValue().then((value) => {
      setSettings(value);
      const isPreset = PRESET_FORMATS.some(
        (f) => f.value === value.absoluteFormat,
      );
      setIsCustom(!isPreset);
      if (!isPreset) {
        setCustomFormat(value.absoluteFormat);
      }
    });
  }, []);

  const handleDisplayModeChange = (mode: TimeDisplayMode) => {
    setSettings((prev) => ({ ...prev, displayMode: mode }));
  };

  const handleFormatChange = (format: string) => {
    if (format === "custom") {
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

  const handleSave = async () => {
    await timeFormatSettings.setValue(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const previewTime = dayjs().subtract(2, "hour");
  const getPreview = () => {
    const elapsed = Date.now() - previewTime.valueOf();
    switch (settings.displayMode) {
      case "relative":
        return previewTime.fromNow();
      case "absolute":
        return previewTime.format(settings.absoluteFormat);
      case "auto":
        return elapsed > settings.autoThresholdMs
          ? previewTime.format(settings.absoluteFormat)
          : previewTime.fromNow();
    }
  };

  return (
    <div className="app">
      <h1>GitHub Workflow Refined</h1>
      <p className="subtitle">Time Format Settings</p>

      <section className="section">
        <h2>Display Mode</h2>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="displayMode"
              checked={settings.displayMode === "relative"}
              onChange={() => handleDisplayModeChange("relative")}
            />
            <span>Relative</span>
            <span className="hint">e.g., "2 hours ago"</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="displayMode"
              checked={settings.displayMode === "absolute"}
              onChange={() => handleDisplayModeChange("absolute")}
            />
            <span>Absolute</span>
            <span className="hint">e.g., "2024-01-15 14:30:00"</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="displayMode"
              checked={settings.displayMode === "auto"}
              onChange={() => handleDisplayModeChange("auto")}
            />
            <span>Auto</span>
            <span className="hint">
              Relative within threshold, then absolute
            </span>
          </label>
        </div>
      </section>

      {settings.displayMode === "auto" && (
        <section className="section">
          <h2>Auto Threshold</h2>
          <p className="description">
            Show relative time until this duration has passed, then switch to
            absolute.
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

      {(settings.displayMode === "absolute" ||
        settings.displayMode === "auto") && (
        <section className="section">
          <h2>Absolute Format</h2>
          <p className="description">
            Uses{" "}
            <a
              href="https://day.js.org/docs/en/display/format"
              target="_blank"
              rel="noreferrer"
            >
              Day.js format tokens
            </a>
          </p>
          <select
            className="select"
            value={isCustom ? "custom" : settings.absoluteFormat}
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
        </section>
      )}

      <section className="section preview">
        <h2>Preview</h2>
        <div className="preview-box">{getPreview()}</div>
      </section>

      <button className="save-button" onClick={handleSave}>
        {saved ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}

export default App;
