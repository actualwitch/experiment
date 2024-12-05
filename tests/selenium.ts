import { Builder, Browser } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox";


const awaitableTimeout = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const options = new firefox.Options().addArguments('--headless');

const driver = new Builder().forBrowser(Browser.FIREFOX).build();
try {
  await driver.get("localhost:5173/?fixture=sample");
  await awaitableTimeout(1000);
  const base64encodedScreenshot = await driver.takeScreenshot();
  const decoded = Buffer.from(base64encodedScreenshot, "base64");
  // @ts-ignore its fine
  Bun.write("screenshot.png", decoded);
} finally {
  await driver.quit();
}
