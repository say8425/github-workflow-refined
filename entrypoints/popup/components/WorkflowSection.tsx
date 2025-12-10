import type { WorkflowSettings } from '@/utils/storage';

interface WorkflowSectionProps {
  settings: WorkflowSettings;
  onSettingsChange: (settings: WorkflowSettings) => void;
}

export function WorkflowSection({ settings, onSettingsChange }: WorkflowSectionProps) {
  const handleAutoExpandChange = (checked: boolean) => {
    onSettingsChange({ ...settings, autoExpandWorkflows: checked });
  };

  return (
    <div className="section-group">
      <h2 className="section-title">Workflow List</h2>

      <section className="section">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={settings.autoExpandWorkflows}
            onChange={(e) => handleAutoExpandChange(e.target.checked)}
          />
          <span>Auto-expand "Show more workflows..."</span>
        </label>
      </section>
    </div>
  );
}
