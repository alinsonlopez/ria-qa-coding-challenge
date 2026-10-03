import { By } from 'selenium-webdriver';
import BasePage, { AccessBlockedError } from './BasePage.ts';
import { config } from '../support/config.ts';

const locators = {
  countryInput: By.css('[analytics-name="register-country-input"]'),
} as const;

export default class CountrySelectionPage extends BasePage {
  async open(url: string) {
    await this.driver.get(url);
    const page = await this.waitUntilReady();
    await this.dismissCookies();
    return page;
  }

  async waitUntilReady(): Promise<{ url: string; countryControlVisible: boolean }> {
    return this.waitFor(async () => {
      await this.assertAccessible();
      const url = new URL(await this.driver.getCurrentUrl());
      if (url.origin !== config.secureOrigin || !/^\/registration(?:\/|$)/.test(url.pathname)) return false;
      const text = await this.bodyText();
      if (/based on your current location you cannot register/i.test(text)) {
        throw new AccessBlockedError(`Registration is restricted by location: ${text}`);
      }
      // The URL alone does not prove that country selection is available.
      const countryVisible = (await this.visibleElements(locators.countryInput)).length > 0;
      return countryVisible ? { url: url.href, countryControlVisible: true } : false;
    }, 'Register did not show a visible country selection form.');
  }
}
