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

    const autoExpandWorkflows = () => {
      const showMoreButton = document.querySelector<HTMLButtonElement>(
        'button[class*="ActionListSectionExpandButton"]'
      ) || Array.from(document.querySelectorAll('button')).find(
        (btn) => btn.textContent?.includes('Show more workflows')
      );

      if (showMoreButton) {
        showMoreButton.click();
      }
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

      const workflowItems = workflowList.querySelectorAll('li');
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

        // Insert button at the end of the list item
        const container = li.querySelector('a > span') || link;
        container.parentElement?.appendChild(pinBtn);
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

    const initWorkflowFeatures = () => {
      // Auto-expand workflows
      if (wfSettings.autoExpandWorkflows) {
        // Try multiple times as the button may load dynamically
        const tryExpand = (attempts: number) => {
          autoExpandWorkflows();
          if (attempts < 5) {
            setTimeout(() => tryExpand(attempts + 1), 500);
          }
        };
        tryExpand(0);
      }

      // Add pin buttons and render pinned section
      const tryAddPinButtons = (attempts: number) => {
        const workflowList = document.querySelector('ul[aria-label="Workflows"]');
        if (workflowList) {
          addPinButtonsToWorkflows();
          renderPinnedWorkflows();
        } else if (attempts < 10) {
          setTimeout(() => tryAddPinButtons(attempts + 1), 300);
        }
      };
      tryAddPinButtons(0);
    };

    const init = async () => {
      [settings, wfSettings] = await Promise.all([
        timeFormatSettings.getValue(),
        workflowSettings.getValue(),
      ]);

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

    init();
  },
});
