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
  type TimeFormatSettings,
  type WorkflowSettings,
  DEFAULT_TIME_FORMAT_SETTINGS,
  DEFAULT_WORKFLOW_SETTINGS,
} from '@/utils/storage';

import {
  createTimeFormatter,
  setupTimeElementInterceptor,
} from './content/time-format';

import {
  findAndClickShowMoreButton,
  setupShowMoreObserver,
} from './content/auto-expand';

dayjs.extend(relativeTime);

export default defineContentScript({
  matches: ['*://github.com/*/actions*'],
  main() {
    let settings: TimeFormatSettings = DEFAULT_TIME_FORMAT_SETTINGS;
    let wfSettings: WorkflowSettings = DEFAULT_WORKFLOW_SETTINGS;
    let showMoreObserver: MutationObserver | null = null;

    const initWorkflowFeatures = () => {
      if (wfSettings.autoExpandWorkflows) {
        findAndClickShowMoreButton();

        if (!showMoreObserver) {
          showMoreObserver = setupShowMoreObserver(
            () => wfSettings.autoExpandWorkflows
          );
        }
      }
    };

    const init = async () => {
      // Set up observer immediately before settings load (default is autoExpand=true)
      showMoreObserver = setupShowMoreObserver(() => wfSettings.autoExpandWorkflows);
      findAndClickShowMoreButton();

      [settings, wfSettings] = await Promise.all([
        timeFormatSettings.getValue(),
        workflowSettings.getValue(),
      ]);

      // If autoExpand is disabled, disconnect the observer
      if (!wfSettings.autoExpandWorkflows && showMoreObserver) {
        showMoreObserver.disconnect();
        showMoreObserver = null;
      }

      initWorkflowFeatures();

      // Create time formatter with current settings
      const timeFormatter = createTimeFormatter(settings);

      // Initial processing with retries
      const tryProcess = (attempts: number) => {
        const elements = document.querySelectorAll<HTMLElement>('relative-time');
        let hasContent = false;

        elements.forEach((el) => {
          if (el.shadowRoot?.textContent) {
            hasContent = true;
          }
        });

        if (hasContent || attempts >= 10) {
          timeFormatter.processAllTimeElements();
          setupTimeElementInterceptor(timeFormatter.processTimeElement);
        } else {
          setTimeout(() => tryProcess(attempts + 1), 100);
        }
      };

      setTimeout(() => tryProcess(0), 100);

      // Watch for settings changes
      timeFormatSettings.watch((newSettings) => {
        settings = newSettings;
        const newFormatter = createTimeFormatter(settings);
        newFormatter.processAllTimeElements();
      });

      workflowSettings.watch((newSettings) => {
        wfSettings = newSettings;
      });
    };

    // Handle GitHub's SPA navigation (turbo/pjax)
    let lastUrl = location.href;
    const handleNavigation = () => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        initWorkflowFeatures();

        const timeFormatter = createTimeFormatter(settings);
        setTimeout(() => {
          timeFormatter.processAllTimeElements();
          setupTimeElementInterceptor(timeFormatter.processTimeElement);
        }, 100);
      }
    };

    // Listen for turbo navigation events (GitHub uses Turbo)
    document.addEventListener('turbo:load', handleNavigation);
    document.addEventListener('turbo:render', handleNavigation);
    window.addEventListener('popstate', handleNavigation);

    // Poll for URL changes (catches pushState/replaceState)
    setInterval(handleNavigation, 500);

    init();
  },
});
