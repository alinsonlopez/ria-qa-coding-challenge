import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Context, RootHookObject } from 'mocha';
import type { WebDriver } from 'selenium-webdriver';
import addContext from 'mochawesome/addContext.js';
import { config } from './config.ts';
import { createDriver } from './driver.ts';
import CalculatorPage from '../pages/CalculatorPage.ts';

declare module 'mocha' {
  interface Context {
    driver: WebDriver;
    calculator: CalculatorPage;
    details: unknown[];
  }
}

export type TestContext = Context;

const runDir = path.join(config.artifactsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}-${process.pid}`);

export const mochaHooks: RootHookObject = {
  async beforeAll() {
    await mkdir(runDir, { recursive: true });
    console.log(`\nEvidence: ${runDir}`);
  },
  async beforeEach(this: Context) {
    this.details = [];
    this.driver = await createDriver();
    this.calculator = await new CalculatorPage(this.driver).open();
  },
  async afterEach(this: Context) {
    this.timeout(60000);
    const test = this.currentTest;
    const driver = this.driver;
    try {
      if (!test || !driver) return;
      if (this.details.length) addContext(this, { title: 'Test details', value: this.details });
      const name = test.title.replace(/[^a-zA-Z0-9]+/g, '-').slice(0,100);
      const directory = path.join(runDir, name);
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, 'result.json'), JSON.stringify({
        title: test.fullTitle(), status: test.state, url: await driver.getCurrentUrl(),
        details: this.details, error: test.err ? { name: test.err.name, message: test.err.message } : undefined,
      }, null, 2));
      if (test.state === 'failed') {
        const screenshot = await driver.takeScreenshot();
        await writeFile(path.join(directory, 'screenshot.png'), screenshot, 'base64');
        addContext(this, { title: 'Failure screenshot', value: `data:image/png;base64,${screenshot}` });
      }
    } catch (error) {
      // Evidence failures must not hide the original test result.
      console.error('Could not save evidence:', error);
    } finally {
      // Clear the previous session before the next setup can fail.
      Reflect.deleteProperty(this, 'driver');
      if (driver) await driver.quit();
    }
  },
};
