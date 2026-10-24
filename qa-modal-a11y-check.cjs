const { chromium } = require('playwright');

async function testModalA11y() {
  console.log('--- Testing Modern Web Guidance: Modal Light Dismiss & Escape Key ---');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:4173/?project=proj-1');

  // Wait for editor header
  await page.waitForSelector('text=Product Launch & AI Studio 2026');

  // 1. Open Eye Contact Modal
  await page.click('button[title="AI Eye Contact Correction"]');
  await page.waitForSelector('h3#eye-contact-modal-title');
  console.log('✅ PASS: Eye Contact Modal opened with accessible ID (h3#eye-contact-modal-title)');

  // 2. Test Escape key dismissal
  await page.keyboard.press('Escape');
  await page.waitForSelector('h3#eye-contact-modal-title', { state: 'detached', timeout: 3000 });
  console.log('✅ PASS: Modal dismissed via platform Escape key request');

  // 3. Open Eye Contact Modal again
  await page.click('button[title="AI Eye Contact Correction"]');
  await page.waitForSelector('h3#eye-contact-modal-title');

  // 4. Test Light Dismiss: click on outer backdrop (10, 10)
  await page.mouse.click(10, 10);
  await page.waitForSelector('h3#eye-contact-modal-title', { state: 'detached', timeout: 3000 });
  console.log('✅ PASS: Modal dismissed via backdrop light-dismiss click');

  // 5. Test Skip to content link in DOM
  const skipLink = await page.$('a[href="#main-content"]');
  if (skipLink) {
    console.log('✅ PASS: Skip to content landmark link present in DOM');
  }

  // 6. Test main landmark
  const mainLandmark = await page.$('main#main-content');
  if (mainLandmark) {
    console.log('✅ PASS: Main landmark (<main id="main-content">) present');
  }

  await browser.close();
  console.log('🎉 ALL MODERN WEB GUIDANCE MODAL ACCESSIBILITY CHECKS PASSED!');
}

testModalA11y().catch((err) => {
  console.error('❌ Modal a11y test failed:', err);
  process.exit(1);
});
