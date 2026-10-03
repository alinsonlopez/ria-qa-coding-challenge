import { By, Key, error as seleniumError, type WebElement } from 'selenium-webdriver';
import BasePage from './BasePage.ts';
import { config } from '../support/config.ts';
import type { Quote } from '../types/Quote.ts';

const locators = {
  root: By.css('[aria-label="Transfer quote calculator"]'),
  amountFrom: By.id('amount-from'),
  amountTo: By.id('amount-to'),
  destination: By.css('button[aria-label="Select Destination"]'),
  destinationFlag: By.css('button[aria-label="Select Destination"] img'),
  destinationOptions: By.css('[role="dialog"][data-state="open"] button[role="option"]'),
  sourceCurrency: By.css('#quote-details > div:has(#amount-from) span'),
  activeRate: By.css('#rate-title + div > span:last-child'),
  rateBase: By.css('#rate-title + div > span:first-child'),
  startTransfer: By.css('a[href="https://secure.riamoneytransfer.com/"]'),
  invalidAmountMessage: By.xpath('.//*[normalize-space()="Please enter a valid amount"]'),
} as const;

export default class CalculatorPage extends BasePage {
  async open(): Promise<this> {
    await this.driver.get(config.baseUrl);
    await this.ready(locators.root, 'Ria calculator did not appear.');
    await this.dismissCookies();
    return this;
  }

  private async destinationOption(label: string): Promise<WebElement> {
    return this.waitFor(async () => {
      for (const option of await this.visibleElements(locators.destinationOptions)) {
        if ((await option.getText()).trim().split('\n')[0] === label) return option;
      }
      return false;
    }, `Destination option "${label}" is not available.`);
  }

  async selectCountry(countryName: string): Promise<void> {
    const destination = await this.visible(locators.destination, 'Destination selector is not visible.');
    if ((await destination.getAttribute('aria-expanded')) !== 'true') await destination.click();
    await (await this.destinationOption(countryName)).click();
  }

  async selectReceiveCurrency(currencyCode: string): Promise<void> {
    const destination = await this.visible(locators.destination, 'Destination selector is not visible.');
    if ((await destination.getAttribute('aria-expanded')) !== 'true') {
      throw new Error('Currency selection is not open. Select a country with multiple currencies first.');
    }
    await (await this.destinationOption(currencyCode)).click();
    await this.waitFor(async () => {
      const destination = await this.driver.findElement(locators.destination);
      return (await destination.getText()).trim() === currencyCode &&
        (await destination.getAttribute('aria-expanded')) === 'false';
    }, `Currency "${currencyCode}" was not selected.`);
  }

  async destinationCountryCode(): Promise<string> {
    const flag = await this.visible(locators.destinationFlag, 'Destination country flag is not visible.');
    return (await flag.getAttribute('alt'))?.split(' ')[0] ?? '';
  }

  async enterAmount(amount: string): Promise<void> {
    const input = await this.visible(locators.amountFrom, 'Send amount is not visible.');
    // Use real keyboard input instead of assigning the value through JavaScript.
    await input.click();
    await input.sendKeys(Key.chord(process.platform === 'darwin' ? Key.COMMAND : Key.CONTROL, 'a'));
    await input.sendKeys(Key.BACK_SPACE);
    await input.sendKeys(amount, Key.TAB);
  }

  private async readQuote(): Promise<Quote> {
    const [sendAmount, receiveAmount, sourceCurrency, receiveCurrency, rateText, rateBase] = await Promise.all([
      this.driver.findElement(locators.amountFrom).getAttribute('value'),
      this.driver.findElement(locators.amountTo).getAttribute('value'),
      this.driver.findElement(locators.sourceCurrency).getText(),
      this.driver.findElement(locators.destination).getText(),
      this.driver.findElement(locators.activeRate).getText(),
      this.driver.findElement(locators.rateBase).getText(),
    ]);
    return {
      sendAmount: sendAmount?.trim() ?? '', receiveAmount: receiveAmount?.trim() ?? '',
      sourceCurrency: sourceCurrency.trim(), receiveCurrency: receiveCurrency.trim(),
      rateText: rateText.trim(), rateBase: rateBase.trim(),
    };
  }

  async waitForQuote(condition: (quote: Quote) => boolean): Promise<Quote> {
    let lastQuote: Quote | undefined;
    return this.waitFor(async () => {
      await this.assertAccessible();
      const quote = await this.readQuote();
      lastQuote = quote;
      if (!quote.sendAmount || !quote.receiveAmount || !quote.rateText) return false;
      return condition(quote) ? quote : false;
    }, 'The calculator quote did not finish updating.').catch(error => {
      if (error instanceof seleniumError.TimeoutError && lastQuote) {
        error.message += ` Last quote: ${JSON.stringify(lastQuote)}`;
      }
      throw error;
    });
  }

  async validationState(): Promise<{ message: string; value: string }> {
    let message = '';
    try {
      const root = await this.visible(locators.root, 'Calculator is not visible.');
      message = await (await this.visible(locators.invalidAmountMessage, 'Invalid amount message did not appear.', root)).getText();
    } catch (error) {
      if (!(error instanceof seleniumError.TimeoutError)) throw error;
    }
    const input = await this.driver.findElement(locators.amountFrom);
    return { message: message.trim(), value: (await input.getAttribute('value')) ?? '' };
  }

  async startTransfer(): Promise<string> {
    const root = await this.visible(locators.root, 'Calculator is not visible.');
    await (await this.visible(locators.startTransfer, 'Start your transfer is not visible.', root)).click();
    await this.waitFor(async () => {
      return new URL(await this.driver.getCurrentUrl()).origin === config.secureOrigin;
    }, 'The calculator did not navigate to the secure Ria site.');
    return this.driver.getCurrentUrl();
  }
}
