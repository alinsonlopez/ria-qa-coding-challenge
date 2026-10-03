import { By, error as seleniumError, type WebDriver, type WebElement } from 'selenium-webdriver';
import { config } from '../support/config.ts';

const locators = {
  body: By.css('body'),
  portalReject: By.css('button[analytics-name="consent-manager-reject-cookies"]'),
  publicConsentButtons: By.css('[aria-labelledby="consent-banner-title"] button'),
  cookieOverlays: By.css('[aria-labelledby="consent-banner-title"], .ria-gdpr-consent-manager-dialog'),
} as const;

export class AccessBlockedError extends Error {
  constructor(message: string) { super(message); this.name = 'AccessBlockedError'; }
}

export default class BasePage {
  constructor(protected readonly driver: WebDriver) {}

  protected async waitFor<T>(condition: () => Promise<T | false>, message: string, timeout: number = config.waitTimeoutMs): Promise<T> {
    return this.driver.wait(async () => {
      try { return await condition(); }
      catch (error) {
        if (error instanceof seleniumError.NoSuchElementError || error instanceof seleniumError.StaleElementReferenceError) return false;
        throw error;
      }
    }, timeout, message, 250) as Promise<T>;
  }

  protected async visibleElements(locator: By, scope: WebDriver | WebElement = this.driver): Promise<WebElement[]> {
    const elements = await scope.findElements(locator);
    const visible = await Promise.all(elements.map(element => element.isDisplayed()));
    return elements.filter((_, index) => visible[index]);
  }

  protected async visible(locator: By, message: string, scope: WebDriver | WebElement = this.driver): Promise<WebElement> {
    return this.waitFor(async () => (await this.visibleElements(locator, scope))[0] ?? false, message);
  }

  protected async assertAccessible(): Promise<void> {
    const title = await this.driver.getTitle();
    const text = await this.bodyText();
    if (/just a moment|attention required/i.test(title) ||
        /performing security verification|verify you are human|checking your browser|access denied/i.test(text)) {
      throw new AccessBlockedError('Ria security verification blocked access. Functional behavior could not be evaluated.');
    }
  }

  protected async ready(locator: By, message: string): Promise<WebElement> {
    return this.waitFor(async () => {
      await this.assertAccessible();
      return (await this.visibleElements(locator))[0] ?? false;
    }, message);
  }

  protected async bodyText(): Promise<string> {
    return this.driver.findElement(locators.body).getText();
  }

  protected async dismissCookies(): Promise<void> {
    let button: WebElement;
    try {
      // Consent loads asynchronously; wait briefly for an optional banner.
      button = await this.waitFor(async () => {
        const portalButton = (await this.visibleElements(locators.portalReject))[0];
        if (portalButton) return portalButton;
        for (const candidate of await this.visibleElements(locators.publicConsentButtons)) {
          if ((await candidate.getText()).trim() === 'Reject All') return candidate;
        }
        return false;
      }, 'Optional cookie banner did not appear.', 5000);
    } catch (error) {
      if (!(error instanceof seleniumError.TimeoutError)) throw error;
      return;
    }
    await button.click();
    await this.waitFor(async () => (await this.visibleElements(locators.cookieOverlays)).length === 0,
      'Cookie banner did not close.');
  }
}
