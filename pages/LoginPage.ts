import { By } from 'selenium-webdriver';
import BasePage from './BasePage.ts';

// These controls have no name attribute; their generated Vue IDs are unstable.
const locators = {
  register: By.css('a[analytics-name="login-register"]'),
  phoneOrEmail: By.css('input[analytics-name="login-email-input"]'),
  password: By.css('input[analytics-name="login-password"]'),
} as const;

export default class LoginPage extends BasePage {
  async waitUntilReady(): Promise<this> {
    await this.ready(locators.register, 'Register did not appear on the secure site.');
    await this.dismissCookies();
    return this;
  }

  async fields() {
    const register = await this.visible(locators.register, 'Register is not visible.');
    const phoneOrEmail = await this.visible(locators.phoneOrEmail, 'Phone or email is not visible.');
    const password = await this.visible(locators.password, 'Password is not visible.');
    return {
      registerText: (await register.getText()).trim(),
      phoneOrEmailVisible: await phoneOrEmail.isDisplayed(),
      passwordVisible: await password.isDisplayed(),
      passwordType: await password.getAttribute('type'),
    };
  }

  async clickRegister(): Promise<void> {
    await (await this.visible(locators.register, 'Register is not visible.')).click();
  }
}
