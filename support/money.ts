import { Decimal } from 'decimal.js';
import type { Quote } from '../types/Quote.ts';

export function parseMoney(value: string): Decimal {
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(value.trim())) {
    throw new Error(`Unexpected English money format: "${value}"`);
  }
  return new Decimal(value.replaceAll(',', '').trim());
}

export function compareConversion(quote: Quote) {
  const match = quote.rateText.match(/^([\d,.]+) ([A-Z]{3})$/);
  const rateText = match?.[1];
  if (!rateText || match?.[2] !== quote.receiveCurrency) {
    throw new Error(`Unexpected ${quote.receiveCurrency} rate: "${quote.rateText}"`);
  }
  const decimals = rateText.split('.')[1]?.length ?? 0;
  const amount = parseMoney(quote.sendAmount);
  const expected = amount.mul(parseMoney(rateText)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  // Allow one displayed rate unit and one cent for rounding or truncation.
  const tolerance = amount.mul(new Decimal(10).pow(-decimals)).plus('0.01');
  const difference = parseMoney(quote.receiveAmount).minus(expected).abs();
  return {
    expected: expected.toFixed(2), actual: quote.receiveAmount,
    tolerance: tolerance.toString(), difference: difference.toString(), matches: difference.lte(tolerance),
  };
}
