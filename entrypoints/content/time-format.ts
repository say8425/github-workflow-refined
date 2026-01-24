import dayjs from "dayjs";
import type { TimeFormatSettings } from "@/utils/storage";

const PROCESSED_ATTR = "data-time-formatted";
const REPLACEMENT_ATTR = "data-time-replacement";

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
      case "relative":
        result = d.fromNow();
        break;
      case "absolute":
        result = d.format(settings.absoluteFormat);
        showAbsolute = true;
        break;
      case "auto":
        if (elapsed > settings.autoThresholdMs) {
          result = d.format(settings.absoluteFormat);
          showAbsolute = true;
        } else {
          result = d.fromNow();
        }
        break;
    }

    if (showAbsolute && settings.showTodayIndicator && isToday(date)) {
      result = `📅 ${result}`;
    }

    return result;
  };

  const processTimeElement = (el: HTMLElement) => {
    const datetime = el.getAttribute("datetime");
    if (!datetime) return;

    const date = new Date(datetime);
    if (Number.isNaN(date.getTime())) return;

    const formatted = formatTime(date);

    // Check if already processed
    if (el.hasAttribute(PROCESSED_ATTR)) {
      // Update existing replacement span
      const existingSpan = el.nextElementSibling;
      if (
        existingSpan?.hasAttribute(REPLACEMENT_ATTR) &&
        existingSpan.textContent !== formatted
      ) {
        existingSpan.textContent = formatted;
      }
      return;
    }

    // Mark as processed
    el.setAttribute(PROCESSED_ATTR, "true");

    // Hide original element (GitHub's relative-time re-renders its shadow DOM)
    el.style.display = "none";

    // Create replacement span with our formatted time
    const span = document.createElement("span");
    span.textContent = formatted;
    span.setAttribute(REPLACEMENT_ATTR, "true");
    span.setAttribute("title", dayjs(date).format("YYYY-MM-DD HH:mm:ss"));

    // Insert after the original element
    el.after(span);
  };

  const processAllTimeElements = () => {
    const timeElements =
      document.querySelectorAll<HTMLElement>("relative-time");
    timeElements.forEach((el) => {
      processTimeElement(el);
    });
  };

  // Clean up replacement spans (useful when settings change)
  const cleanup = () => {
    document
      .querySelectorAll<HTMLElement>(`[${REPLACEMENT_ATTR}]`)
      .forEach((span) => {
        span.remove();
      });
    document
      .querySelectorAll<HTMLElement>(`[${PROCESSED_ATTR}]`)
      .forEach((el) => {
        el.removeAttribute(PROCESSED_ATTR);
        el.style.display = "";
      });
  };

  return {
    formatTime,
    processTimeElement,
    processAllTimeElements,
    cleanup,
  };
};

export const setupTimeElementInterceptor = (
  processTimeElement: (el: HTMLElement) => void,
) => {
  // Watch for new relative-time elements being added to the DOM
  const bodyObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          // Check if the added node is a relative-time element
          if (node.tagName === "RELATIVE-TIME") {
            processTimeElement(node);
          }
          // Also check descendants for relative-time elements
          node.querySelectorAll<HTMLElement>("relative-time").forEach((el) => {
            processTimeElement(el);
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
