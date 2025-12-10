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
  type TimeFormatSettings,
  type WorkflowSettings,
} from '@/utils/storage';
import { WorkflowSection } from './components/WorkflowSection';
import { TimeFormatSection } from './components/TimeFormatSection';
import { PreviewSection } from './components/PreviewSection';
import './App.css';

dayjs.extend(relativeTime);

function App() {
  const [settings, setSettings] = useState<TimeFormatSettings>(DEFAULT_TIME_FORMAT_SETTINGS);
  const [wfSettings, setWfSettings] = useState<WorkflowSettings>(DEFAULT_WORKFLOW_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    timeFormatSettings.getValue().then(setSettings);
    workflowSettings.getValue().then(setWfSettings);
  }, []);

  const handleSave = async () => {
    await Promise.all([
      timeFormatSettings.setValue(settings),
      workflowSettings.setValue(wfSettings),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="app">
      <h1>GitHub Workflow Refined</h1>

      <WorkflowSection settings={wfSettings} onSettingsChange={setWfSettings} />

      <TimeFormatSection settings={settings} onSettingsChange={setSettings} />

      <PreviewSection settings={settings} />

      <button className="save-button" onClick={handleSave}>
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}

export default App;
