const puppeteer = require("puppeteer");
const path = require("node:path");
const fs = require("node:fs");

const GITHUB_ACTIONS_URL =
  "https://github.com/vercel/next.js/actions/workflows/copilot-pull-request-reviewer/copilot-pull-request-reviewer";

const settings = [
  // 페이지 스크린샷 (팝업 없이)
  {
    name: "relative-ko",
    displayMode: "relative",
    showTodayIndicator: false,
    locale: "ko",
  },
  {
    name: "absolute-today-ko",
    displayMode: "absolute",
    showTodayIndicator: true,
    locale: "ko",
  },
  // 다국어 (팝업 포함)
  {
    name: "auto-ko",
    displayMode: "auto",
    showTodayIndicator: false,
    locale: "ko",
    withPopup: true,
  },
  {
    name: "auto-ja",
    displayMode: "auto",
    showTodayIndicator: false,
    locale: "ja",
    withPopup: true,
  },
  {
    name: "auto-zh-cn",
    displayMode: "auto",
    showTodayIndicator: false,
    locale: "zh-cn",
    withPopup: true,
  },
  {
    name: "auto-zh-tw",
    displayMode: "auto",
    showTodayIndicator: false,
    locale: "zh-tw",
    withPopup: true,
  },
  {
    name: "auto-es",
    displayMode: "auto",
    showTodayIndicator: false,
    locale: "es",
    withPopup: true,
  },
  {
    name: "auto-en",
    displayMode: "auto",
    showTodayIndicator: false,
    locale: "en",
    withPopup: true,
  },
];

// locale to Chrome --lang format
const CHROME_LANG_MAP = {
  ko: "ko",
  ja: "ja",
  "zh-cn": "zh-CN",
  "zh-tw": "zh-TW",
  es: "es",
  en: "en",
};

// Chrome _locales 폴더명 매핑 (settings의 locale → _locales 폴더명)
const LOCALES_FOLDER_MAP = {
  ko: "ko",
  ja: "ja",
  "zh-cn": "zh_CN",
  "zh-tw": "zh_TW",
  es: "es",
  en: "en",
};

async function captureWithSetting(setting) {
  console.log(`\nCapturing: ${setting.name} (locale: ${setting.locale})`);

  const extensionPath = path.resolve(".output/chrome-mv3");
  const userDataDir = `/tmp/chrome-profile-${setting.name}-${Date.now()}`;
  const defaultDir = path.join(userDataDir, "Default");
  const chromeLang = CHROME_LANG_MAP[setting.locale] || setting.locale;

  // === messages.json 교체로 browser.i18n.getUILanguage() 우회 ===
  const localesPath = path.join(extensionPath, "_locales");
  const systemLocaleFolder = path.join(localesPath, "ko");
  const systemMessagesPath = path.join(systemLocaleFolder, "messages.json");

  // 원본 ko messages.json 백업
  const originalKoMessages = fs.readFileSync(systemMessagesPath, "utf-8");

  // 대상 로케일이 ko가 아니면 messages.json 교체
  if (setting.locale !== "ko") {
    const targetFolder = LOCALES_FOLDER_MAP[setting.locale];
    const targetMessagesPath = path.join(
      localesPath,
      targetFolder,
      "messages.json",
    );
    const targetMessages = fs.readFileSync(targetMessagesPath, "utf-8");
    fs.writeFileSync(systemMessagesPath, targetMessages);
    console.log(
      `  Swapped ko/messages.json with ${targetFolder}/messages.json`,
    );
  }

  // Create Chrome profile with locale preferences BEFORE launching browser
  fs.mkdirSync(defaultDir, { recursive: true });

  // Preferences file for the Default profile (navigator.language 제어용)
  const prefs = {
    intl: {
      accept_languages: chromeLang,
      selected_languages: chromeLang,
    },
  };
  fs.writeFileSync(path.join(defaultDir, "Preferences"), JSON.stringify(prefs));

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        "--no-sandbox",
        `--user-data-dir=${userDataDir}`,
        `--lang=${chromeLang}`,
      ],
    });

    await new Promise((r) => setTimeout(r, 2000));

    // Find extension ID
    const targets = await browser.targets();
    let extensionId = null;
    for (const target of targets) {
      const url = target.url();
      if (url.includes("chrome-extension://")) {
        const match = url.match(/chrome-extension:\/\/([^/]+)/);
        if (match) {
          extensionId = match[1];
          break;
        }
      }
    }

    if (!extensionId) {
      console.log("Extension ID not found, skipping...");
      await browser.close();
      return;
    }

    // Open popup and change settings
    const popupPage = await browser.newPage();
    await popupPage.setViewport({ width: 400, height: 600 });
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`, {
      waitUntil: "networkidle2",
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Change locale using select dropdown
    await popupPage.evaluate((locale) => {
      const selects = document.querySelectorAll("select");
      for (const select of selects) {
        const options = Array.from(select.querySelectorAll("option"));
        const matchingOption = options.find((opt) => opt.value === locale);
        if (matchingOption) {
          select.value = locale;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          console.log("Changed locale to:", locale);
          break;
        }
      }
    }, setting.locale);

    await new Promise((r) => setTimeout(r, 800));

    // Click the correct radio button for display mode
    await popupPage.evaluate((mode) => {
      const labels = document.querySelectorAll("label");
      labels.forEach((label) => {
        const radio = label.querySelector('input[type="radio"]');
        if (radio) {
          const text = label.textContent.toLowerCase();
          if (
            mode === "relative" &&
            text.includes("relative") &&
            !text.includes("within")
          ) {
            radio.click();
          }
          if (
            mode === "absolute" &&
            text.includes("absolute") &&
            !text.includes("format") &&
            !text.includes("within")
          ) {
            radio.click();
          }
          if (mode === "auto" && text.includes("auto")) {
            radio.click();
          }
        }
      });
    }, setting.displayMode);

    await new Promise((r) => setTimeout(r, 800));

    // Handle today indicator checkbox (only visible in absolute/auto mode)
    if (setting.displayMode !== "relative") {
      await popupPage.evaluate((shouldCheck) => {
        const labels = document.querySelectorAll("label");
        labels.forEach((label) => {
          const checkbox = label.querySelector('input[type="checkbox"]');
          if (checkbox && label.textContent.toLowerCase().includes("today")) {
            if (checkbox.checked !== shouldCheck) {
              checkbox.click();
            }
          }
        });
      }, setting.showTodayIndicator);
      await new Promise((r) => setTimeout(r, 500));
    }

    // Take popup screenshot
    if (setting.withPopup) {
      await popupPage.screenshot({
        path: `screenshots/popup-${setting.name}.png`,
        type: "png",
      });
      console.log(`Saved: screenshots/popup-${setting.name}.png`);
    }

    // Open GitHub Actions page in new tab
    const actionsPage = await browser.newPage();
    await actionsPage.setViewport({ width: 1280, height: 800 });
    await actionsPage.goto(GITHUB_ACTIONS_URL, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Wait for extension to apply
    await new Promise((r) => setTimeout(r, 4000));

    // Take screenshot
    await actionsPage.screenshot({
      path: `screenshots/actions-${setting.name}.png`,
      type: "png",
    });
    console.log(`Saved: screenshots/actions-${setting.name}.png`);

    await browser.close();

    // Cleanup temp profile
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } finally {
    // 원본 ko/messages.json 복구
    fs.writeFileSync(systemMessagesPath, originalKoMessages);
    if (setting.locale !== "ko") {
      console.log(`  Restored ko/messages.json`);
    }
  }
}

(async () => {
  for (const setting of settings) {
    await captureWithSetting(setting);
  }
  console.log("\nAll done!");
})();
