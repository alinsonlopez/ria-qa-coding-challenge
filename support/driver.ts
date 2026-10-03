import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { Builder, type WebDriver } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { config } from './config.ts';

export async function createDriver(): Promise<WebDriver> {
  // Selenium Manager downloads a compatible driver into the project cache.
  process.env.SE_CACHE_PATH ??= path.resolve('.cache/selenium');
  await mkdir(process.env.SE_CACHE_PATH, { recursive: true });
  const options = new chrome.Options();
  options.addArguments('--window-size=1440,1000', '--lang=en-US');
  options.setUserPreferences({ 'intl.accept_languages': 'en-US,en' });
  if (config.headless) options.addArguments('--headless=new');

  const builder = new Builder().forBrowser('chrome').setChromeOptions(options);
  const driver = await builder.build();
  try {
    await driver.manage().setTimeouts({ implicit: 0, pageLoad: config.pageLoadTimeoutMs });
    return driver;
  } catch (error) {
    await driver.quit().catch(() => {});
    throw error;
  }
}
