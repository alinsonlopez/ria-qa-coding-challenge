import assert from 'node:assert/strict';
import { waitForConversion } from '../support/conversion.ts';
import { compareConversion, parseMoney } from '../support/money.ts';
import type { TestContext } from '../support/hooks.ts';

describe('Ria Calculator', function () {
  it('[CALC-01] converts 25000 CLP to Haiti HTG using the displayed exchange rate', async function (this: TestContext) {
    const countryToSelect = 'Haiti';
    const expectedCountryCode = 'HT';
    const sendCurrency = 'CLP';
    const receiveCurrency = 'HTG';
    const amountToEnter = '25000';
    const { calculator } = this;

    await calculator.selectCountry(countryToSelect);
    await calculator.selectReceiveCurrency(receiveCurrency);
    assert.equal(await calculator.destinationCountryCode(), expectedCountryCode);

    await calculator.enterAmount(amountToEnter);
    const quote = await waitForConversion(calculator, amountToEnter);
    const comparison = compareConversion(quote);

    this.details.push({ quote, comparison });
    assert.ok(parseMoney(quote.sendAmount).eq(amountToEnter));
    assert.equal(quote.sourceCurrency, sendCurrency);
    assert.equal(quote.receiveCurrency, receiveCurrency);
    assert.equal(quote.rateBase.replace(/\s+/g, ' '), `1 ${sendCurrency} =`);
    assert.ok(comparison.matches,
      `Expected ${comparison.expected} ${receiveCurrency} ± ${comparison.tolerance}; received ${comparison.actual}.`);
  });

  it('[CALC-02] shows "Please enter a valid amount" when letters are entered', async function (this: TestContext) {
    const invalidAmount = 'abc';
    const expectedErrorMessage = 'Please enter a valid amount';
    const { calculator } = this;

    await calculator.enterAmount(invalidAmount);
    const state = await calculator.validationState();

    this.details.push({ entered: invalidAmount, expected: expectedErrorMessage, actual: state });
    assert.equal(state.message, expectedErrorMessage,
      `Required error is missing. Retained value: "${state.value}".`);
  });

  it('[CALC-03] allows selecting a country in the destination dropdown', async function (this: TestContext) {
    const countryToSelect = 'Bolivia';
    const expectedCountryCode = 'BO';
    const { calculator } = this;

    await calculator.selectCountry(countryToSelect);
    const selectedCountryCode = await calculator.destinationCountryCode();

    this.details.push({ countryToSelect, selectedCountryCode });
    assert.equal(selectedCountryCode, expectedCountryCode);
  });

  it('[CALC-04] recalculates the converted amount when the send amount is updated', async function (this: TestContext) {
    const countryToSelect = 'Haiti';
    const sendCurrency = 'CLP';
    const receiveCurrency = 'HTG';
    const amountToEnter = '25000';
    const updatedAmountToEnter = '50000';
    const { calculator } = this;

    await calculator.selectCountry(countryToSelect);
    await calculator.selectReceiveCurrency(receiveCurrency);

    await calculator.enterAmount(amountToEnter);
    const initialQuote = await waitForConversion(calculator, amountToEnter);

    await calculator.enterAmount(updatedAmountToEnter);
    const updatedQuote = await waitForConversion(calculator, updatedAmountToEnter, initialQuote.receiveAmount);
    const comparison = compareConversion(updatedQuote);

    this.details.push({ initialQuote, updatedQuote, comparison });
    assert.ok(parseMoney(updatedQuote.sendAmount).eq(updatedAmountToEnter));
    assert.ok(!parseMoney(updatedQuote.receiveAmount).eq(parseMoney(initialQuote.receiveAmount)));
    assert.equal(updatedQuote.sourceCurrency, sendCurrency);
    assert.equal(updatedQuote.receiveCurrency, receiveCurrency);
    assert.equal(updatedQuote.rateBase.replace(/\s+/g, ' '), `1 ${sendCurrency} =`);
    assert.ok(comparison.matches,
      `Expected ${comparison.expected} ${receiveCurrency} ± ${comparison.tolerance}; received ${comparison.actual}.`);
  });
});
