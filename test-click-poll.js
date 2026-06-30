const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://127.0.0.1:3001/build', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Which class', { timeout: 15000 });
  await page.waitForTimeout(5000);

  // Get initial class
  const before = await page.$eval('button.rounded-2xl', el => el.className);
  console.log('CLASS BEFORE:', before);

  // Click
  await page.locator('button').first().click();

  // Poll for 5 seconds
  let changed = false;
  for (let i = 0; i < 50; i++) {
    await page.waitForTimeout(100);
    const cls = await page.$eval('button.rounded-2xl', el => el.className);
    if (cls !== before) {
      console.log(`CLASS CHANGED after ${(i+1)*100}ms:`, cls);
      changed = true;
      break;
    }
  }

  if (!changed) console.log('CLASS DID NOT CHANGE after 5000ms');

  // Also check with page.waitForFunction
  console.log('Trying waitForFunction...');
  await page.locator('button').nth(1).click(); // try 2nd button
  try {
    await page.waitForFunction(() => {
      const btns = document.querySelectorAll('button.rounded-2xl');
      return Array.from(btns).some(b => b.className.includes('border-forest'));
    }, { timeout: 5000 });
    console.log('FOUND border-forest in button class!');
  } catch {
    console.log('TIMEOUT: border-forest never appeared');
  }

  await browser.close();
})();
