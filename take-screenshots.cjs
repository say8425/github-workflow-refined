const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const GITHUB_ACTIONS_URL = 'https://github.com/vercel/next.js/actions';

const settings = [
  // English
  { name: 'relative', displayMode: 'relative', showTodayIndicator: false, locale: 'en' },
  { name: 'absolute', displayMode: 'absolute', showTodayIndicator: false, locale: 'en' },
  { name: 'absolute-today', displayMode: 'absolute', showTodayIndicator: true, locale: 'en' },
  { name: 'auto', displayMode: 'auto', showTodayIndicator: false, locale: 'en' },
  { name: 'auto-today', displayMode: 'auto', showTodayIndicator: true, locale: 'en' },
  // 한국어
  { name: 'relative-ko', displayMode: 'relative', showTodayIndicator: false, locale: 'ko' },
  { name: 'absolute-ko', displayMode: 'absolute', showTodayIndicator: false, locale: 'ko' },
  { name: 'absolute-today-ko', displayMode: 'absolute', showTodayIndicator: true, locale: 'ko' },
  { name: 'auto-ko', displayMode: 'auto', showTodayIndicator: false, locale: 'ko' },
  // 일본어
  { name: 'relative-ja', displayMode: 'relative', showTodayIndicator: false, locale: 'ja' },
  { name: 'absolute-ja', displayMode: 'absolute', showTodayIndicator: false, locale: 'ja' },
  { name: 'absolute-today-ja', displayMode: 'absolute', showTodayIndicator: true, locale: 'ja' },
  { name: 'auto-ja', displayMode: 'auto', showTodayIndicator: false, locale: 'ja' },
  // 중국어 간체
  { name: 'relative-zh-cn', displayMode: 'relative', showTodayIndicator: false, locale: 'zh-cn' },
  { name: 'absolute-zh-cn', displayMode: 'absolute', showTodayIndicator: false, locale: 'zh-cn' },
  { name: 'absolute-today-zh-cn', displayMode: 'absolute', showTodayIndicator: true, locale: 'zh-cn' },
  { name: 'auto-zh-cn', displayMode: 'auto', showTodayIndicator: false, locale: 'zh-cn' },
];

async function captureWithSetting(setting) {
  console.log(`\nCapturing: ${setting.name} (locale: ${setting.locale})`);

  const extensionPath = path.resolve('.output/chrome-mv3');
  const userDataDir = `/tmp/chrome-profile-${setting.name}-${Date.now()}`;

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      `--user-data-dir=${userDataDir}`
    ]
  });

  await new Promise(r => setTimeout(r, 2000));

  // Find extension ID
  const targets = await browser.targets();
  let extensionId = null;
  for (const target of targets) {
    const url = target.url();
    if (url.includes('chrome-extension://')) {
      const match = url.match(/chrome-extension:\/\/([^/]+)/);
      if (match) {
        extensionId = match[1];
        break;
      }
    }
  }

  if (!extensionId) {
    console.log('Extension ID not found, skipping...');
    await browser.close();
    return;
  }

  // Open popup and change settings
  const popupPage = await browser.newPage();
  await popupPage.setViewport({ width: 400, height: 600 });
  await popupPage.goto(`chrome-extension://${extensionId}/popup.html`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // Change locale using select dropdown
  await popupPage.evaluate((locale) => {
    const selects = document.querySelectorAll('select');
    for (const select of selects) {
      const options = Array.from(select.querySelectorAll('option'));
      const matchingOption = options.find(opt => opt.value === locale);
      if (matchingOption) {
        select.value = locale;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('Changed locale to:', locale);
        break;
      }
    }
  }, setting.locale);

  await new Promise(r => setTimeout(r, 800));

  // Click the correct radio button for display mode
  await popupPage.evaluate((mode) => {
    const labels = document.querySelectorAll('label');
    labels.forEach(label => {
      const radio = label.querySelector('input[type="radio"]');
      if (radio) {
        const text = label.textContent.toLowerCase();
        if (mode === 'relative' && text.includes('relative') && !text.includes('within')) {
          radio.click();
        }
        if (mode === 'absolute' && text.includes('absolute') && !text.includes('format') && !text.includes('within')) {
          radio.click();
        }
        if (mode === 'auto' && text.includes('auto')) {
          radio.click();
        }
      }
    });
  }, setting.displayMode);

  await new Promise(r => setTimeout(r, 800));

  // Handle today indicator checkbox (only visible in absolute/auto mode)
  if (setting.displayMode !== 'relative') {
    await popupPage.evaluate((shouldCheck) => {
      const labels = document.querySelectorAll('label');
      labels.forEach(label => {
        const checkbox = label.querySelector('input[type="checkbox"]');
        if (checkbox && label.textContent.toLowerCase().includes('today')) {
          if (checkbox.checked !== shouldCheck) {
            checkbox.click();
          }
        }
      });
    }, setting.showTodayIndicator);
    await new Promise(r => setTimeout(r, 500));
  }

  // Take popup screenshot (only for ko absolute-today)
  if (setting.name === 'absolute-today-ko') {
    await popupPage.screenshot({
      path: `screenshots/popup-${setting.name}.png`,
      type: 'png'
    });
    console.log(`Saved: screenshots/popup-${setting.name}.png`);
  }

  // Open GitHub Actions page in new tab
  const actionsPage = await browser.newPage();
  await actionsPage.setViewport({ width: 1920, height: 1080 });
  await actionsPage.goto(GITHUB_ACTIONS_URL, {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  // Wait for extension to apply
  await new Promise(r => setTimeout(r, 4000));

  // Take screenshot
  await actionsPage.screenshot({
    path: `screenshots/actions-${setting.name}.png`,
    type: 'png'
  });
  console.log(`Saved: screenshots/actions-${setting.name}.png`);

  await browser.close();

  // Cleanup temp profile
  fs.rmSync(userDataDir, { recursive: true, force: true });
}

(async () => {
  for (const setting of settings) {
    await captureWithSetting(setting);
  }
  console.log('\nAll done!');
})();
