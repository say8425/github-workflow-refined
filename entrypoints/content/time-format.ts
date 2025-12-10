import dayjs from 'dayjs';
import type { TimeFormatSettings } from '@/utils/storage';

export const createTimeFormatter = (settings: TimeFormatSettings) => {
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatTime = (date: Date): string => {
    const d = dayjs(date).locale(settings.locale);
    const elapsed = Date.now() - date.getTime();

    let result: string;
    let showAbsolute = false;

    switch (settings.displayMode) {
      case 'relative':
        result = d.fromNow();
        break;
      case 'absolute':
        result = d.format(settings.absoluteFormat);
        showAbsolute = true;
        break;
      case 'auto':
        if (elapsed > settings.autoThresholdMs) {
          result = d.format(settings.absoluteFormat);
          showAbsolute = true;
        } else {
          result = d.fromNow();
        }
        break;
    }

    if (showAbsolute && settings.showTodayIndicator && isToday(date)) {
      result = '📅 ' + result;
    }

    return result;
  };

  const processTimeElement = (el: HTMLElement) => {
    const datetime = el.getAttribute('datetime');
    if (!datetime) return;

    const date = new Date(datetime);
    if (isNaN(date.getTime())) return;

    const formatted = formatTime(date);

    // Handle Shadow DOM - relative-time uses Shadow DOM
    if (el.shadowRoot) {
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

  return {
    formatTime,
    processTimeElement,
    processAllTimeElements,
  };
};

export const setupTimeElementInterceptor = (
  processTimeElement: (el: HTMLElement) => void
) => {
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

  return bodyObserver;
};
