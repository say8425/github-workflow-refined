import type { WorkflowSettings } from "@/utils/storage";

interface WorkflowSectionProps {
  settings: WorkflowSettings;
  onSettingsChange: (settings: WorkflowSettings) => void;
}

export function WorkflowSection({
  settings,
  onSettingsChange,
}: WorkflowSectionProps) {
  const handleAutoExpandChange = (checked: boolean) => {
    onSettingsChange({ ...settings, autoExpandWorkflows: checked });
  };

  return (
    <div className="rounded-lg bg-bg-section p-3">
      <h2 className="font-semibold text-base text-primary">Workflow List</h2>
      <div className="mt-3 flex flex-col gap-4">
        <section>
          <label className="flex cursor-pointer items-center gap-2 text-[0.85rem]">
            <input
              type="checkbox"
              className="m-0 cursor-pointer"
              checked={settings.autoExpandWorkflows}
              onChange={(e) => handleAutoExpandChange(e.target.checked)}
            />
            <span>Auto-expand "Show more workflows..."</span>
          </label>
        </section>
      </div>
    </div>
  );
}
