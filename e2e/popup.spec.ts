import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const LOCALES = [
  { code: "en", label: "English" },
  { code: "ko", label: "한국어" },
  { code: "ja", label: "日本語" },
  { code: "zh-cn", label: "简体中文" },
  { code: "zh-tw", label: "繁體中文" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "ru", label: "Русский" },
] as const;

const PRESET_FORMATS = [
  "YYYY-MM-DD HH:mm:ss",
  "YYYY/MM/DD HH:mm",
  "MM/DD/YYYY h:mm A",
  "DD/MM/YYYY HH:mm",
  "MMM DD, YYYY h:mm A",
  "MMMM DD, YYYY HH:mm",
] as const;

const THRESHOLD_VALUES = [
  { ms: 3600000, label: "1" }, // 1 hour
  { ms: 21600000, label: "6" }, // 6 hours
  { ms: 43200000, label: "12" }, // 12 hours
  { ms: 86400000, label: "24" }, // 24 hours
  { ms: 604800000, label: "7" }, // 7 days
  { ms: 2592000000, label: "30" }, // 30 days
] as const;

// Helper function to open popup page
async function openPopup(
  context: { newPage: () => Promise<Page> },
  extensionId: string,
): Promise<Page> {
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  return popup;
}

test.describe("Popup UI Tests", () => {
  test.describe("Initial State", () => {
    test("should load popup with both sections visible", async ({
      context,
      extensionId,
    }) => {
      const popup = await openPopup(context, extensionId);

      // TimeFormat section (first h2)
      const timeFormatSection = popup.locator("h2").first();
      await expect(timeFormatSection).toBeVisible();

      // Workflow section (second h2)
      const workflowSection = popup.locator("h2").last();
      await expect(workflowSection).toBeVisible();
    });

    test("should have correct default values", async ({
      context,
      extensionId,
    }) => {
      const popup = await openPopup(context, extensionId);

      // Default display mode is auto (third radio button)
      const autoRadio = popup
        .locator('input[type="radio"][name="displayMode"]')
        .nth(2);
      await expect(autoRadio).toBeChecked();

      // Auto expand should be checked by default
      const autoExpandCheckbox = popup.locator('input[type="checkbox"]').last();
      await expect(autoExpandCheckbox).toBeChecked();
    });
  });

  test.describe("Locale Selection", () => {
    for (const locale of LOCALES) {
      test(`should select ${locale.label} (${locale.code})`, async ({
        context,
        extensionId,
      }) => {
        const popup = await openPopup(context, extensionId);

        const localeSelect = popup.locator("select").first();
        await localeSelect.selectOption(locale.code);
        await expect(localeSelect).toHaveValue(locale.code);
      });
    }
  });

  test.describe("Display Mode Switching", () => {
    test("should switch to Relative mode and hide format/threshold sections", async ({
      context,
      extensionId,
    }) => {
      const popup = await openPopup(context, extensionId);

      const relativeRadio = popup
        .locator('input[type="radio"][name="displayMode"]')
        .first();
      await relativeRadio.click();
      await expect(relativeRadio).toBeChecked();

      // Format and threshold sections should be hidden
      const formatSelect = popup.locator("select").nth(1);
      await expect(formatSelect).not.toBeVisible();
    });

    test("should switch to Absolute mode and show format section", async ({
      context,
      extensionId,
    }) => {
      const popup = await openPopup(context, extensionId);

      const absoluteRadio = popup
        .locator('input[type="radio"][name="displayMode"]')
        .nth(1);
      await absoluteRadio.click();
      await expect(absoluteRadio).toBeChecked();

      // Format section should be visible (second select after locale)
      const selects = popup.locator("select");
      await expect(selects).toHaveCount(2); // locale + format (no threshold)
    });

    test("should switch to Auto mode and show threshold+format sections", async ({
      context,
      extensionId,
    }) => {
      const popup = await openPopup(context, extensionId);

      // First switch to relative to reset
      const relativeRadio = popup
        .locator('input[type="radio"][name="displayMode"]')
        .first();
      await relativeRadio.click();

      const autoRadio = popup
        .locator('input[type="radio"][name="displayMode"]')
        .nth(2);
      await autoRadio.click();
      await expect(autoRadio).toBeChecked();

      // Both threshold and format sections should be visible
      const selects = popup.locator("select");
      await expect(selects).toHaveCount(3); // locale + threshold + format
    });
  });

  test.describe("Absolute Format Selection", () => {
    for (const format of PRESET_FORMATS) {
      test(`should select format: ${format}`, async ({
        context,
        extensionId,
      }) => {
        const popup = await openPopup(context, extensionId);

        // Switch to absolute mode
        const absoluteRadio = popup
          .locator('input[type="radio"][name="displayMode"]')
          .nth(1);
        await absoluteRadio.click();

        // Select format
        const formatSelect = popup.locator("select").nth(1);
        await formatSelect.selectOption(format);
        await expect(formatSelect).toHaveValue(format);
      });
    }

    test("should select Custom format and show input field", async ({
      context,
      extensionId,
    }) => {
      const popup = await openPopup(context, extensionId);

      // Switch to absolute mode
      const absoluteRadio = popup
        .locator('input[type="radio"][name="displayMode"]')
        .nth(1);
      await absoluteRadio.click();

      // Select custom
      const formatSelect = popup.locator("select").nth(1);
      await formatSelect.selectOption("custom");

      // Custom input should appear
      const customInput = popup.locator('input[type="text"]');
      await expect(customInput).toBeVisible();

      // Enter custom format
      await customInput.fill("YYYY年MM月DD日 HH:mm");
      await expect(customInput).toHaveValue("YYYY年MM月DD日 HH:mm");
    });
  });

  test.describe("Auto Threshold Selection", () => {
    for (const threshold of THRESHOLD_VALUES) {
      test(`should select threshold: ${threshold.label} (${threshold.ms}ms)`, async ({
        context,
        extensionId,
      }) => {
        const popup = await openPopup(context, extensionId);

        // Auto mode should be default, threshold select should be visible
        const thresholdSelect = popup.locator("select").nth(1);
        await thresholdSelect.selectOption(String(threshold.ms));
        await expect(thresholdSelect).toHaveValue(String(threshold.ms));
      });
    }
  });

  test.describe("Checkbox Controls", () => {
    test("should toggle Today indicator ON", async ({
      context,
      extensionId,
    }) => {
      const popup = await openPopup(context, extensionId);

      // Today indicator checkbox (first checkbox in TimeFormat section)
      const todayCheckbox = popup.locator('input[type="checkbox"]').first();
      await todayCheckbox.check();
      await expect(todayCheckbox).toBeChecked();
    });

    test("should toggle Today indicator OFF", async ({
      context,
      extensionId,
    }) => {
      const popup = await openPopup(context, extensionId);

      const todayCheckbox = popup.locator('input[type="checkbox"]').first();
      await todayCheckbox.check();
      await todayCheckbox.uncheck();
      await expect(todayCheckbox).not.toBeChecked();
    });

    test("should toggle Auto expand ON", async ({ context, extensionId }) => {
      const popup = await openPopup(context, extensionId);

      // Auto expand checkbox (in Workflow section)
      const autoExpandCheckbox = popup.locator('input[type="checkbox"]').last();
      // It should be checked by default, uncheck then check
      await autoExpandCheckbox.uncheck();
      await autoExpandCheckbox.check();
      await expect(autoExpandCheckbox).toBeChecked();
    });

    test("should toggle Auto expand OFF", async ({ context, extensionId }) => {
      const popup = await openPopup(context, extensionId);

      const autoExpandCheckbox = popup.locator('input[type="checkbox"]').last();
      await autoExpandCheckbox.uncheck();
      await expect(autoExpandCheckbox).not.toBeChecked();
    });
  });

  test.describe("Settings Persistence", () => {
    test("should persist settings after popup reopen", async ({
      context,
      extensionId,
    }) => {
      const popup = await openPopup(context, extensionId);

      // Change multiple settings
      const localeSelect = popup.locator("select").first();
      await localeSelect.selectOption("ko");

      const absoluteRadio = popup
        .locator('input[type="radio"][name="displayMode"]')
        .nth(1);
      await absoluteRadio.click();

      const formatSelect = popup.locator("select").nth(1);
      await formatSelect.selectOption("YYYY/MM/DD HH:mm");

      const todayCheckbox = popup.locator('input[type="checkbox"]').first();
      await todayCheckbox.check();

      const autoExpandCheckbox = popup.locator('input[type="checkbox"]').last();
      await autoExpandCheckbox.uncheck();

      // Verify the checkbox is unchecked before closing (ensures storage is updated)
      await expect(autoExpandCheckbox).not.toBeChecked();

      // Close and reopen popup
      await popup.close();
      const popup2 = await openPopup(context, extensionId);

      // Verify all settings persisted
      await expect(popup2.locator("select").first()).toHaveValue("ko");
      await expect(
        popup2.locator('input[type="radio"][name="displayMode"]').nth(1),
      ).toBeChecked();
      await expect(popup2.locator("select").nth(1)).toHaveValue(
        "YYYY/MM/DD HH:mm",
      );
      await expect(
        popup2.locator('input[type="checkbox"]').first(),
      ).toBeChecked();
      await expect(
        popup2.locator('input[type="checkbox"]').last(),
      ).not.toBeChecked();
    });
  });

  test.describe("Conditional UI Display", () => {
    test("Relative mode should hide format section", async ({
      context,
      extensionId,
    }) => {
      const popup = await openPopup(context, extensionId);

      const relativeRadio = popup
        .locator('input[type="radio"][name="displayMode"]')
        .first();
      await relativeRadio.click();

      // Only locale select should be visible
      const selects = popup.locator("select");
      await expect(selects).toHaveCount(1);
    });

    test("Absolute mode should hide threshold section", async ({
      context,
      extensionId,
    }) => {
      const popup = await openPopup(context, extensionId);

      const absoluteRadio = popup
        .locator('input[type="radio"][name="displayMode"]')
        .nth(1);
      await absoluteRadio.click();

      // locale + format (no threshold)
      const selects = popup.locator("select");
      await expect(selects).toHaveCount(2);
    });

    test("Auto mode should show both threshold and format sections", async ({
      context,
      extensionId,
    }) => {
      const popup = await openPopup(context, extensionId);

      const autoRadio = popup
        .locator('input[type="radio"][name="displayMode"]')
        .nth(2);
      await autoRadio.click();

      // locale + threshold + format
      const selects = popup.locator("select");
      await expect(selects).toHaveCount(3);
    });
  });
});
