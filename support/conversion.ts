import type CalculatorPage from '../pages/CalculatorPage.ts';
import type { Quote } from '../types/Quote.ts';
import { compareConversion, parseMoney } from './money.ts';

export async function waitForConversion(calculator: CalculatorPage, amount: string, previousReceive?: string): Promise<Quote> {
  return calculator.waitForQuote(quote =>
    quote.rateText.endsWith(` ${quote.receiveCurrency}`) &&
    parseMoney(quote.sendAmount).eq(amount) && parseMoney(quote.receiveAmount).gt(0) &&
    (previousReceive === undefined || !parseMoney(quote.receiveAmount).eq(parseMoney(previousReceive))) &&
    compareConversion(quote).matches);
}
