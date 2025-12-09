import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  timeFormatSettings,
  type TimeFormatSettings,
  DEFAULT_TIME_FORMAT_SETTINGS,
} from '@/utils/storage';

dayjs.extend(relativeTime);

export default defineContentScript({
  matches: ['*://github.com/*/actions*'],
  main() {
    let settings: TimeFormatSettings = DEFAULT_TIME_FORMAT_SETTINGS;
    const processedElements = new WeakSet<Element>();

    const formatTime = (date: Date): string => {
      const d = dayjs(date);
      const elapsed = Date.now() - date.getTime();

      switch (settings.displayMode) {
        case 'relative':
          return d.fromNow();
        case 'absolute':
          return d.format(settings.absoluteFormat);
        case 'auto':
          return elapsed > settings.autoThresholdMs
            ? d.format(settings.absoluteFormat)
            : d.fromNow();
      }
    };

    const processTimeElement = (el: HTMLElement) => {
      const datetime = el.getAttribute('datetime');
      if (!datetime) return;

      const date = new Date(datetime);
      if (isNaN(date.getTime())) return;

      const formatted = formatTime(date);

      // Handle Shadow DOM - relative-time uses Shadow DOM
      if (el.shadowRoot) {
        // Check if content exists in shadow root
        if (el.shadowRoot.textContent) {
          el.shadowRoot.textContent = formatted;
        }
      }

      // Update title attribute for tooltip
      el.setAttribute('title', dayjs(date).format('YYYY-MM-DD HH:mm:ss'));
    };

    const processAllTimeElements = () => {
      const timeElements = document.querySelectorAll<HTMLElement>('relative-time');
      timeElements.forEach((el) => {
        processTimeElement(el);
      });
    };

    // Override the connectedCallback to intercept updates
    const setupElementInterceptor = () => {
      const originalDefine = customElements.define.bind(customElements);

      // Watch for shadow root changes on relative-time elements
      const observeShadowRoot = (el: HTMLElement) => {
        if (!el.shadowRoot) return;

        const shadowObserver = new MutationObserver(() => {
          // Re-apply our formatting when shadow DOM changes
          setTimeout(() => processTimeElement(el), 0);
        });

        shadowObserver.observe(el.shadowRoot, {
          childList: true,
          characterData: true,
          subtree: true,
        });
      };

      // Observe all existing relative-time elements
      document.querySelectorAll<HTMLElement>('relative-time').forEach((el) => {
        if (el.shadowRoot) {
          observeShadowRoot(el);
        }
      });

      // Watch for new relative-time elements being added
      const bodyObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              if (node.tagName === 'RELATIVE-TIME') {
                // Wait for shadow root to be created
                setTimeout(() => {
                  observeShadowRoot(node);
                  processTimeElement(node);
                }, 50);
              }
              // Also check descendants
              node.querySelectorAll<HTMLElement>('relative-time').forEach((el) => {
                setTimeout(() => {
                  observeShadowRoot(el);
                  processTimeElement(el);
                }, 50);
              });
            }
          });
        }
      });

      bodyObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    };

    const init = async () => {
      settings = await timeFormatSettings.getValue();

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
          processAllTimeElements();
          setupElementInterceptor();
        } else {
          setTimeout(() => tryProcess(attempts + 1), 100);
        }
      };

      // Start trying after a short delay
      setTimeout(() => tryProcess(0), 100);

      // Watch for settings changes
      timeFormatSettings.watch((newSettings) => {
        settings = newSettings;
        processAllTimeElements();
      });
    };

    init();
  },
});
