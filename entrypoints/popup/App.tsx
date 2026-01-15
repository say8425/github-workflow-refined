import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useState } from "react";
import "dayjs/locale/ko";
import "dayjs/locale/ja";
import "dayjs/locale/zh-cn";
import "dayjs/locale/zh-tw";
import "dayjs/locale/de";
import "dayjs/locale/fr";
import "dayjs/locale/es";
import "dayjs/locale/pt";
import "dayjs/locale/ru";
import {
  DEFAULT_TIME_FORMAT_SETTINGS,
  DEFAULT_WORKFLOW_SETTINGS,
  type TimeFormatSettings,
  timeFormatSettingsStorage,
  type WorkflowSettings,
  workflowSettingsStorage,
} from "@/utils/storage";
import { PreviewSection } from "./components/PreviewSection";
import { TimeFormatSection } from "./components/TimeFormatSection";
import { WorkflowSection } from "./components/WorkflowSection";
import "./App.css";

dayjs.extend(relativeTime);

function App() {
  const [timeFormatSettings, setTimeFormatSettings] =
    useState<TimeFormatSettings>(DEFAULT_TIME_FORMAT_SETTINGS);
  const [workflowSettings, setWorkflowSettings] = useState<WorkflowSettings>(
    DEFAULT_WORKFLOW_SETTINGS,
  );

  useEffect(() => {
    timeFormatSettingsStorage.getValue().then(setTimeFormatSettings);
    workflowSettingsStorage.getValue().then(setWorkflowSettings);
  }, []);

  return (
    <div className="app">
      <h1>GitHub Workflow Refined</h1>
      <WorkflowSection
        settings={workflowSettings}
        onSettingsChange={async (event) => {
          setWorkflowSettings(event);
          await workflowSettingsStorage.setValue(event);
        }}
      />
      <TimeFormatSection
        settings={timeFormatSettings}
        onSettingsChange={async (event) => {
          setTimeFormatSettings(event);
          await timeFormatSettingsStorage.setValue(event);
        }}
      />
      <PreviewSection settings={timeFormatSettings} />
    </div>
  );
}

export default App;
