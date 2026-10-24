const { chromium } = require('playwright');

const BASE_URL = process.env.TEST_URL || 'http://127.0.0.1:4173';

async function testModalA11y() {
  console.log('--- Testing Modern Web Guidance & WCAG 2.1: Modal Light Dismiss, Escape Key & Switch Roles ---');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE_URL}/?project=proj-1`, { waitUntil: 'networkidle' });

  // Wait for editor header
  await page.waitForSelector('text=Product Launch & AI Studio 2026');

  // 0. Check viewport meta allows pinch-to-zoom
  const viewportMeta = await page.$eval('meta[name="viewport"]', (el) => el.getAttribute('content') || '');
  if (viewportMeta.includes('user-scalable=no') || viewportMeta.includes('maximum-scale=1')) {
    throw new Error(`Viewport meta disables user zoom: ${viewportMeta}`);
  }
  console.log(`✅ PASS: Viewport meta permits user pinch-to-zoom (${viewportMeta})`);

  // Helper to verify modal/drawer dialog semantics, Escape key, and backdrop light dismiss
  async function verifyDialog(name, triggerSelector, titleSelector, testBackdrop = true, checkSwitch = false) {
    await page.click(triggerSelector);
    await page.waitForSelector(titleSelector, { timeout: 3000 });

    const dialog = await page.$('[role="dialog"][aria-modal="true"]');
    if (!dialog) {
      throw new Error(`${name} missing role="dialog" and aria-modal="true"`);
    }

    if (checkSwitch) {
      const switchEl = await page.$('[role="dialog"] [role="switch"]');
      if (!switchEl) {
        throw new Error(`${name} missing role="switch" on custom toggle`);
      }
      const ariaChecked = await switchEl.getAttribute('aria-checked');
      if (ariaChecked !== 'true' && ariaChecked !== 'false') {
        throw new Error(`${name} switch missing valid aria-checked attribute`);
      }
    }

    // Test Escape key dismissal
    await page.keyboard.press('Escape');
    await page.waitForSelector(titleSelector, { state: 'detached', timeout: 3000 });
    console.log(`✅ PASS: ${name} opened with role="dialog"[aria-modal="true"] and dismissed via Escape key`);

    if (testBackdrop) {
      await page.click(triggerSelector);
      await page.waitForSelector(titleSelector, { timeout: 3000 });
      await page.mouse.click(10, 10);
      await page.waitForSelector(titleSelector, { state: 'detached', timeout: 3000 });
      console.log(`✅ PASS: ${name} dismissed via outside backdrop click`);
    }
  }

  // 1. Eye Contact Modal
  await verifyDialog('Eye Contact Modal', 'button[title="AI Eye Contact Correction"]', '#eye-contact-modal-title', true, true);

  // 2. Studio Sound Suite
  await verifyDialog('Studio Sound Suite', 'button[title="Studio Sound Remaster"]', '#studio-sound-title', true, true);

  // 3. Dynamic Captions Studio
  await verifyDialog('Dynamic Captions Studio', 'button[title="Dynamic Captions"]', '#dynamic-captions-title', true, true);

  // 4. Canvas Effects & Transitions Modal
  await verifyDialog('Canvas Effects & Transitions Modal', 'button[title*="Canvas Effects"]', '#canvas-transitions-title', true, true);

  // 5. Multicam Director Modal
  await verifyDialog('Multicam Director Modal', 'button[title="Multicam Director"]', '#multicam-director-title', true, true);

  // 6. Voice Cloning & Overdub Modal
  await verifyDialog('Voice Cloning Modal', 'button[title="Voice Clone & Overdub"]', '#voice-cloning-title', true, false);

  // 7. Screen & Cam Recorder Modal
  await verifyDialog('Screen Recorder Modal', 'button[title="Screen & Cam Recorder"]', '#screen-recorder-title', true, false);

  // 8. Enterprise Export Modal
  await verifyDialog('Enterprise Export Modal', 'header button:has-text("Export")', '#export-modal-title', true, false);

  // 9. Share & Publish Modal
  await verifyDialog('Share & Publish Modal', 'header button:has-text("Share")', '#share-modal-title', true, false);

  // 10. Underlord AI Drawer
  await verifyDialog('Underlord AI Drawer', 'header button:has-text("Underlord")', '#underlord-panel-title', true, false);

  // 11. Comments & Review Drawer
  await verifyDialog('Comments & Review Drawer', 'header button:has(svg.lucide-message-square)', '#comments-panel-title', true, false);

  // 12. Teleprompter Fullscreen View (Escape dismissal)
  await verifyDialog('Studio Teleprompter', 'button[title="Teleprompter Readout"]', '#teleprompter-title', false, false);

  // 13. Skip to content link & main landmark
  const skipLink = await page.$('a[href="#main-content"]');
  if (!skipLink) throw new Error('Skip to content link missing');
  console.log('✅ PASS: Skip to content landmark link present in DOM');

  const mainLandmark = await page.$('main#main-content');
  if (!mainLandmark) throw new Error('Main landmark missing');
  console.log('✅ PASS: Main landmark (<main id="main-content">) present');

  await browser.close();
  console.log('🎉 ALL MODERN WEB GUIDANCE & WCAG 2.1 MODAL ACCESSIBILITY CHECKS PASSED!');
}

testModalA11y().catch((err) => {
  console.error('❌ Modal a11y test failed:', err);
  process.exit(1);
});
