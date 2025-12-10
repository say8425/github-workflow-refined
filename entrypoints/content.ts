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
  type PinnedWorkflow,
  DEFAULT_TIME_FORMAT_SETTINGS,
  DEFAULT_WORKFLOW_SETTINGS,
} from '@/utils/storage';

dayjs.extend(relativeTime);

export default defineContentScript({
  matches: ['*://github.com/*/actions*'],
  main() {
    let settings: TimeFormatSettings = DEFAULT_TIME_FORMAT_SETTINGS;
    let wfSettings: WorkflowSettings = DEFAULT_WORKFLOW_SETTINGS;

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

    // ========== Workflow List Features ==========

    const getRepoFromUrl = (): string => {
      const match = window.location.pathname.match(/^\/([^/]+\/[^/]+)/);
      return match ? match[1] : '';
    };

    const scrollWorkflowListToTop = () => {
      const workflowList = document.querySelector('ul[aria-label="Workflows"]');
      if (workflowList) {
        const scrollContainer = workflowList.closest('[class*="overflow"]') || workflowList.parentElement;
        if (scrollContainer) {
          scrollContainer.scrollTop = 0;
        }
      }
      const nav = document.querySelector('nav[aria-label="Actions Workflows"]');
      if (nav) {
        nav.scrollTop = 0;
        let parent = nav.parentElement;
        while (parent) {
          if (parent.scrollTop > 0) {
            parent.scrollTop = 0;
          }
          parent = parent.parentElement;
        }
      }
    };

    const findAndClickShowMoreButton = (): boolean => {
      // Find the "Show more workflows..." button
      // GitHub uses different class names, so we search by text content with whitespace handling
      const allButtons = document.querySelectorAll<HTMLButtonElement>('button');

      for (const btn of allButtons) {
        const text = btn.textContent?.trim() || '';
        if (text.includes('Show more workflows')) {
          btn.click();
          setTimeout(scrollWorkflowListToTop, 50);
          return true;
        }
      }
      return false;
    };

    const setupShowMoreObserver = () => {
      // Use MutationObserver to detect when the "Show more workflows..." button appears
      const observer = new MutationObserver((mutations) => {
        if (!wfSettings.autoExpandWorkflows) return;

        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node instanceof HTMLElement) {
              // Check if this node is or contains the button
              const buttons = node.tagName === 'BUTTON'
                ? [node as HTMLButtonElement]
                : Array.from(node.querySelectorAll<HTMLButtonElement>('button'));

              for (const btn of buttons) {
                const text = btn.textContent?.trim() || '';
                if (text.includes('Show more workflows')) {
                  btn.click();
                  setTimeout(scrollWorkflowListToTop, 50);
                  return;
                }
              }
            }
          }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      return observer;
    };

    const createPinButton = (
      workflowName: string,
      workflowUrl: string,
      isPinned: boolean
    ): HTMLButtonElement => {
      const btn = document.createElement('button');
      btn.className = 'gwr-pin-btn';
      btn.title = isPinned ? 'Unpin workflow' : 'Pin workflow';
      btn.innerHTML = isPinned ? '📌' : '📍';
      btn.style.cssText = `
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px 4px;
        font-size: 14px;
        opacity: ${isPinned ? '1' : '0.5'};
        transition: opacity 0.2s;
      `;

      btn.addEventListener('mouseenter', () => {
        btn.style.opacity = '1';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.opacity = isPinned ? '1' : '0.5';
      });

      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const repo = getRepoFromUrl();
        const currentPinned = wfSettings.pinnedWorkflows;

        if (isPinned) {
          // Unpin
          wfSettings.pinnedWorkflows = currentPinned.filter(
            (w) => !(w.repo === repo && w.url === workflowUrl)
          );
        } else {
          // Pin
          const newPinned: PinnedWorkflow = {
            repo,
            name: workflowName,
            url: workflowUrl,
          };
          wfSettings.pinnedWorkflows = [...currentPinned, newPinned];
        }

        await workflowSettings.setValue(wfSettings);
        renderPinnedWorkflows();
        addPinButtonsToWorkflows();
      });

      return btn;
    };

    const addPinButtonsToWorkflows = () => {
      const repo = getRepoFromUrl();
      const workflowList = document.querySelector('ul[aria-label="Workflows"]');
      if (!workflowList) return;

      // Add styles for workflow items if not already added
      if (!document.querySelector('#gwr-pin-styles')) {
        const style = document.createElement('style');
        style.id = 'gwr-pin-styles';
        style.textContent = `
          ul[aria-label="Workflows"] > li {
            position: relative;
          }
          .gwr-pin-btn {
            position: absolute !important;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 10;
          }
        `;
        document.head.appendChild(style);
      }

      const workflowItems = workflowList.querySelectorAll(':scope > li');
      workflowItems.forEach((li) => {
        // Remove existing pin button
        const existingBtn = li.querySelector('.gwr-pin-btn');
        if (existingBtn) existingBtn.remove();

        const link = li.querySelector('a');
        if (!link) return;

        const workflowName = link.textContent?.trim() || '';
        const workflowUrl = link.getAttribute('href') || '';

        const isPinned = wfSettings.pinnedWorkflows.some(
          (w) => w.repo === repo && w.url === workflowUrl
        );

        const pinBtn = createPinButton(workflowName, workflowUrl, isPinned);

        // Append button directly to the li element
        li.appendChild(pinBtn);
      });
    };

    const renderPinnedWorkflows = () => {
      const repo = getRepoFromUrl();
      const pinnedForRepo = wfSettings.pinnedWorkflows.filter(
        (w) => w.repo === repo
      );

      // Find or create pinned section
      let pinnedSection = document.querySelector('.gwr-pinned-section');
      const workflowNav = document.querySelector('nav[aria-label="Actions Workflows"]');

      if (!workflowNav) return;

      if (pinnedForRepo.length === 0) {
        pinnedSection?.remove();
        return;
      }

      if (!pinnedSection) {
        pinnedSection = document.createElement('div');
        pinnedSection.className = 'gwr-pinned-section';
        pinnedSection.innerHTML = `
          <style>
            .gwr-pinned-section {
              padding: 8px 0;
              border-bottom: 1px solid var(--borderColor-muted, #30363d);
            }
            .gwr-pinned-title {
              font-size: 12px;
              font-weight: 600;
              color: var(--fgColor-muted, #8b949e);
              padding: 4px 16px;
              text-transform: uppercase;
            }
            .gwr-pinned-list {
              list-style: none;
              margin: 0;
              padding: 0;
            }
            .gwr-pinned-item {
              display: flex;
              align-items: center;
              padding: 6px 16px;
            }
            .gwr-pinned-item:hover {
              background-color: var(--bgColor-muted, #161b22);
            }
            .gwr-pinned-link {
              flex: 1;
              color: var(--fgColor-default, #e6edf3);
              text-decoration: none;
              font-size: 14px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .gwr-pinned-link:hover {
              color: var(--fgColor-accent, #58a6ff);
            }
            .gwr-unpin-btn {
              background: none;
              border: none;
              cursor: pointer;
              padding: 2px 4px;
              font-size: 12px;
              opacity: 0.5;
              transition: opacity 0.2s;
            }
            .gwr-unpin-btn:hover {
              opacity: 1;
            }
          </style>
          <div class="gwr-pinned-title">📌 Pinned</div>
          <ul class="gwr-pinned-list"></ul>
        `;

        // Insert at the beginning of the nav
        const firstChild = workflowNav.firstChild;
        if (firstChild) {
          workflowNav.insertBefore(pinnedSection, firstChild);
        } else {
          workflowNav.appendChild(pinnedSection);
        }
      }

      const pinnedList = pinnedSection.querySelector('.gwr-pinned-list');
      if (!pinnedList) return;

      pinnedList.innerHTML = '';

      pinnedForRepo.forEach((workflow) => {
        const li = document.createElement('li');
        li.className = 'gwr-pinned-item';

        const link = document.createElement('a');
        link.className = 'gwr-pinned-link';
        link.href = workflow.url;
        link.textContent = workflow.name;

        const unpinBtn = document.createElement('button');
        unpinBtn.className = 'gwr-unpin-btn';
        unpinBtn.title = 'Unpin';
        unpinBtn.textContent = '✕';
        unpinBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();

          wfSettings.pinnedWorkflows = wfSettings.pinnedWorkflows.filter(
            (w) => !(w.repo === repo && w.url === workflow.url)
          );
          await workflowSettings.setValue(wfSettings);
          renderPinnedWorkflows();
          addPinButtonsToWorkflows();
        });

        li.appendChild(link);
        li.appendChild(unpinBtn);
        pinnedList.appendChild(li);
      });
    };

    let showMoreObserver: MutationObserver | null = null;

    const initWorkflowFeatures = () => {
      // Auto-expand workflows
      if (wfSettings.autoExpandWorkflows) {
        // Try to click immediately if button exists
        findAndClickShowMoreButton();

        // Set up observer to catch button when it appears dynamically
        if (!showMoreObserver) {
          showMoreObserver = setupShowMoreObserver();
        }
      }

      // Add pin buttons and render pinned section
      const tryAddPinButtons = (attempts: number) => {
        const workflowList = document.querySelector('ul[aria-label="Workflows"]');
        if (workflowList) {
          addPinButtonsToWorkflows();
          renderPinnedWorkflows();
        } else if (attempts < 20) {
          setTimeout(() => tryAddPinButtons(attempts + 1), 200);
        }
      };
      tryAddPinButtons(0);
    };

    const init = async () => {
      // Set up observer immediately before settings load (default is autoExpand=true)
      // This ensures we catch the button even if it appears before settings are loaded
      showMoreObserver = setupShowMoreObserver();

      // Also try to click immediately in case button already exists
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

      // Initialize workflow features
      initWorkflowFeatures();

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

      workflowSettings.watch((newSettings) => {
        wfSettings = newSettings;
        renderPinnedWorkflows();
        addPinButtonsToWorkflows();
      });
    };

    // Handle GitHub's SPA navigation (turbo/pjax)
    let lastUrl = location.href;
    const handleNavigation = () => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        // Re-initialize workflow features on navigation
        initWorkflowFeatures();
        // Re-process time elements
        setTimeout(() => {
          processAllTimeElements();
          setupElementInterceptor();
        }, 100);
      }
    };

    // Listen for turbo navigation events (GitHub uses Turbo)
    document.addEventListener('turbo:load', handleNavigation);
    document.addEventListener('turbo:render', handleNavigation);

    // Fallback: watch for URL changes via popstate and polling
    window.addEventListener('popstate', handleNavigation);

    // Poll for URL changes (catches pushState/replaceState)
    setInterval(handleNavigation, 500);

    init();
  },
});
