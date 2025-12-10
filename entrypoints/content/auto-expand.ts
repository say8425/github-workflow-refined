export const scrollWorkflowListToTop = () => {
  const workflowList = document.querySelector('ul[aria-label="Workflows"]');
  if (workflowList) {
    const scrollContainer =
      workflowList.closest('[class*="overflow"]') || workflowList.parentElement;
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

export const findAndClickShowMoreButton = (): boolean => {
  // Find the "Show more workflows..." button
  // GitHub uses different class names, so we search by text content with whitespace handling
  const allButtons = document.querySelectorAll<HTMLButtonElement>('button');

  for (const btn of allButtons) {
    const text = btn.textContent?.trim() || '';
    if (text.includes('Show more workflows')) {
      btn.click();
      setTimeout(scrollWorkflowListToTop, 100);
      return true;
    }
  }
  return false;
};

export const setupShowMoreObserver = (
  isEnabled: () => boolean
): MutationObserver => {
  // Use MutationObserver to detect when the "Show more workflows..." button appears
  const observer = new MutationObserver((mutations) => {
    if (!isEnabled()) return;

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          // Check if this node is or contains the button
          const buttons =
            node.tagName === 'BUTTON'
              ? [node as HTMLButtonElement]
              : Array.from(node.querySelectorAll<HTMLButtonElement>('button'));

          for (const btn of buttons) {
            const text = btn.textContent?.trim() || '';
            if (text.includes('Show more workflows')) {
              btn.click();
              setTimeout(scrollWorkflowListToTop, 100);
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
