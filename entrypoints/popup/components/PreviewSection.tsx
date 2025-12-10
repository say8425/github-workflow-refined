import dayjs from 'dayjs';
import type { TimeFormatSettings } from '@/utils/storage';

interface PreviewSectionProps {
  settings: TimeFormatSettings;
}

export function PreviewSection({ settings }: PreviewSectionProps) {
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
    <section className="section preview">
      <h3>Preview</h3>
      <div className="preview-box">{getPreview()}</div>
    </section>
  );
}
