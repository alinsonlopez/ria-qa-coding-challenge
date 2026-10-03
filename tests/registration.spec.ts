import assert from 'node:assert/strict';
import LoginPage from '../pages/LoginPage.ts';
import CountrySelectionPage from '../pages/CountrySelectionPage.ts';
import { config } from '../support/config.ts';
import type { TestContext } from '../support/hooks.ts';

describe('Get Started / Start your transfer — registration', function () {
  it('[REG-01] opens the secure site with Register, phone or email, and password fields', async function (this: TestContext) {
    const { calculator } = this;
    const destinationUrl = await calculator.startTransfer();
    assert.equal(new URL(destinationUrl).origin, config.secureOrigin);

    const login = await new LoginPage(this.driver).waitUntilReady();
    const fields = await login.fields();
    this.details.push({ destinationUrl, fields });
    assert.equal(fields.registerText, 'Register');
    assert.ok(fields.phoneOrEmailVisible);
    assert.ok(fields.passwordVisible);
    assert.equal(fields.passwordType, 'password');
  });

  it('[REG-02] redirects to country selection when Register is clicked', async function (this: TestContext) {
    const { calculator } = this;
    await calculator.startTransfer();
    const login = await new LoginPage(this.driver).waitUntilReady();

    await login.clickRegister();
    const countrySelection = await new CountrySelectionPage(this.driver).waitUntilReady();
    this.details.push({ countrySelection });
    assert.equal(new URL(countrySelection.url).origin, config.secureOrigin);
    assert.match(new URL(countrySelection.url).pathname, /^\/registration(?:\/|$)/);
    assert.ok(countrySelection.countryControlVisible);
  });

});
