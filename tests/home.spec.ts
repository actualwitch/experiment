import { test, expect } from '@playwright/test';

test('screenshot', async ({ page, browser, browserName }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('/?fixture=sample');
  await expect(page).toHaveTitle(/Experiment/);
  const path = `screenshots/home-${browserName}-${browser.version()}.png`;
  await page.screenshot({ path });
});