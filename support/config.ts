import path from 'node:path';

const headless = process.env.HEADLESS ?? 'false';
if (!['true', 'false'].includes(headless)) throw new Error('HEADLESS must be true or false.');

export const config = Object.freeze({
  baseUrl: 'https://www.riamoneytransfer.com/en-cl/',
  secureOrigin: 'https://secure.riamoneytransfer.com',
  headless: headless === 'true',
  waitTimeoutMs: 30000,
  pageLoadTimeoutMs: 60000,
  artifactsDir: path.resolve('artifacts'),
});
