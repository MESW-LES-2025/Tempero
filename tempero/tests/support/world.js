import { setWorldConstructor, Before, After } from '@cucumber/cucumber';
import { chromium } from 'playwright';

class CustomWorld {
  async openBrowser() {
    this.browser = await chromium.launch({ 
      headless: process.env.CI ? true : false, 
      slowMo: process.env.CI ? 0 : 500 
    });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
  }

  async closeBrowser() {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }
}

setWorldConstructor(CustomWorld);

Before(async function () {
  await this.openBrowser();
});

After(async function () {
  await this.closeBrowser();
});