const { chromium } = require('playwright');

const base = process.env.JUFANTICS_BASE_URL || 'http://127.0.0.1:8765';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.JUFANTICS_CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const result = {};

  await page.goto(`${base}/mundo-cuentos/index.html#biblioteca`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.openOwnedStory === 'function');
  await page.evaluate(() => window.openOwnedStory('cueva-de-cristal'));
  result.dialogOpen = await page.locator('#launchAccess').evaluate(dialog => dialog.open);
  result.loginLink = await page.locator('#launchAccess a[href="cuenta.html"]').textContent();
  result.recoveryLink = await page.locator('#launchAccess a[href="cuenta.html?accion=recuperar"]').textContent();
  result.emailHiddenByDefault = !(await page.locator('.launch-email-option').evaluate(details => details.open));

  await page.locator('#launchAccess a[href="cuenta.html"]').click();
  await page.waitForLoadState('domcontentloaded');
  await page.locator('#remoteLoginForm').waitFor({ state: 'visible' });
  result.loginFormVisible = await page.locator('#remoteLoginForm').isVisible();
  result.createAccountVisible = await page.locator('#showRegister').isVisible();
  result.recoveryButtonVisible = await page.locator('#showRecovery').isVisible();

  await page.goto(`${base}/mundo-cuentos/cuenta.html?accion=recuperar`, { waitUntil: 'domcontentloaded' });
  await page.locator('#remoteRecoveryForm').waitFor({ state: 'visible' });
  result.directRecoveryVisible = await page.locator('#remoteRecoveryForm').isVisible();

  console.log(JSON.stringify(result, null, 2));
  if (Object.values(result).some(value => value === false || value == null || value === '')) process.exitCode = 1;
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
