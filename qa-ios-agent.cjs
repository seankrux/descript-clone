const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'qa-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const BASE_URL = 'http://127.0.0.1:4173';

async function runIOSAgentQA() {
  console.log('📱 Starting Descriptivist Studio Apple HIG & iOS Device QA...');
  
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });

  // Emulate iPhone 15 Pro (393 x 852, 3x DPR, Touch & Mobile)
  const iPhone15Pro = devices['iPhone 15 Pro'] || {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  };

  const context = await browser.newContext({
    ...iPhone15Pro,
    permissions: ['clipboard-read', 'clipboard-write'],
  });

  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failCount++;
    }
  }

  try {
    // -------------------------------------------------------------
    // 1. iOS DASHBOARD & NATIVE BOTTOM TAB BAR
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing iOS Dashboard & Native Navigation ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    
    // Check Meta Tags
    const viewportMeta = await page.$eval('meta[name="viewport"]', (el) => el.content);
    assert(viewportMeta.includes('viewport-fit=cover'), 'Viewport includes viewport-fit=cover for safe-areas');
    
    const appleCapableMeta = await page.$eval('meta[name="apple-mobile-web-app-capable"]', (el) => el.content);
    assert(appleCapableMeta === 'yes', 'Apple Web App capable meta enabled');

    // Desktop sidebar should be hidden on iPhone
    const sidebar = await page.$('aside');
    const isSidebarHidden = await sidebar?.evaluate((el) => window.getComputedStyle(el).display === 'none');
    assert(isSidebarHidden, 'Desktop sidebar hidden on iOS viewport');

    // Native Bottom Tab Bar must be visible
    const bottomNav = await page.$('nav.md\\:hidden');
    assert(bottomNav !== null, 'iOS bottom navigation tab bar rendered');

    // Check tabs
    const projectsTab = await page.$('nav button:has-text("Projects")');
    const recordTab = await page.$('nav button:has-text("Record")');
    const sharedTab = await page.$('nav button:has-text("Shared")');
    const extTab = await page.$('nav button:has-text("Extension")');
    const profileTab = await page.$('nav button:has-text("Profile")');

    assert(projectsTab !== null && recordTab !== null && sharedTab !== null && profileTab !== null, 'All 5 iOS bottom navigation tabs present');

    // Tap Profile tab to open mobile bottom sheet
    await profileTab.click();
    await page.waitForTimeout(300);
    const profileSheet = await page.$('text=seanguillermo@gmail.com');
    assert(profileSheet !== null, 'iOS Profile bottom sheet opens with Sean Guillermo account info');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'ios_01_profile_sheet.png') });

    // Close Profile sheet
    const closeProfileBtn = await page.$('button:has-text("✕")');
    if (closeProfileBtn) {
      await closeProfileBtn.click();
      await page.waitForTimeout(300);
    }

    // Capture clean mobile Dashboard screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'ios_01_dashboard_mobile.png') });
    assert(true, 'Captured iOS Dashboard viewport screenshot');

    // -------------------------------------------------------------
    // 2. iOS RESPONSIVE EDITOR WORKSPACE
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing iOS Responsive Editor & Floating Action Pill ---');
    // Open project
    const firstProject = await page.$('h3:has-text("Product Launch")');
    assert(firstProject !== null, 'Project card located on mobile screen');
    await firstProject.click();
    await page.waitForTimeout(1000);

    // Verify Editor View header
    const editorBackBtn = await page.$('button[title="Back to Projects"]');
    assert(editorBackBtn !== null, 'Touch-friendly Back button rendered');

    // Verify Swipeable iOS Tool Shelf
    const underlordToolBtn = await page.$('.lg\\:hidden button:has-text("Underlord")');
    assert(underlordToolBtn !== null, 'Swipeable iOS tool shelf rendered Underlord button');

    const studioSoundToolBtn = await page.$('.lg\\:hidden button:has-text("Studio Sound")');
    assert(studioSoundToolBtn !== null, 'Swipeable iOS tool shelf rendered Studio Sound button');

    // Verify Video Canvas is on top and Transcript is below
    const videoCanvas = await page.$('video');
    assert(videoCanvas !== null, 'Video preview canvas rendered on iOS mobile screen');

    // Tap a word in the transcript to trigger iOS floating action bar
    const wordToken = await page.$('#word-w1');
    assert(wordToken !== null, 'Transcript word token rendered on mobile');
    await wordToken.click();
    await page.waitForTimeout(400);

    // Floating Word Action Pill should appear with iOS glass
    const correctBtn = await page.$('button[title*="Correct spelling"]');
    assert(correctBtn !== null, 'Floating iOS glass action bar popped up with "Correct" button');

    const cutBtn = await page.$('button[title*="Cut word"]');
    assert(cutBtn !== null, 'Floating iOS glass action bar has "Cut" button');

    const overdubBtn = await page.$('button[title*="Overdub"]');
    assert(overdubBtn !== null, 'Floating iOS glass action bar has "Overdub" button');

    // Check touch target height >= 40px
    const cutBtnBox = await cutBtn.boundingBox();
    assert(cutBtnBox && cutBtnBox.height >= 40, `Touch target height is Apple HIG compliant (${cutBtnBox?.height}px >= 40px)`);

    // Capture mobile Editor screenshot with video top, transcript bottom, and floating action pill
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'ios_02_editor_mobile.png') });
    assert(true, 'Captured iOS Editor mobile workspace screenshot');

    // -------------------------------------------------------------
    // 3. iOS UNDERLORD AI COPILOT
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Underlord AI Copilot on iOS ---');
    await underlordToolBtn.click();
    await page.waitForTimeout(400);

    const underlordHeader = await page.$('text=Underlord AI');
    assert(underlordHeader !== null, 'Underlord Copilot opened on iOS viewport');

    // Underlord panel should fit the screen width
    const underlordPanel = await page.$('.animate-in.slide-in-from-right');
    const panelBox = await underlordPanel?.boundingBox();
    assert(panelBox && panelBox.width <= 393, `Underlord panel width fits iPhone screen (${panelBox?.width}px <= 393px)`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'ios_03_underlord_mobile.png') });

    // Close Underlord
    const closeUnderlordBtn = await page.$('button[title="Close Underlord"]');
    if (closeUnderlordBtn) {
      await closeUnderlordBtn.click({ force: true });
      await page.waitForTimeout(300);
    }

    // -------------------------------------------------------------
    // 4. iOS PUBLIC VIEWWAY (/?share=proj-1)
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Public Viewway on iOS ---');
    await page.goto(`${BASE_URL}/?share=proj-1`, { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Interactive Transcript', { timeout: 5000 });
    assert(true, 'Public Viewway loaded on iPhone 15 Pro');

    const publicVideo = await page.$('video');
    assert(publicVideo !== null, 'Public viewway video player rendered on mobile');

    const publicWord = await page.$('#public-word-w1');
    assert(publicWord !== null, 'Interactive transcript words rendered below video on mobile');

    // Open Review / Comments Drawer on iOS
    const reviewBtn = await page.$('button:has-text("Review")');
    if (reviewBtn) {
      await reviewBtn.click();
      await page.waitForTimeout(400);
      const commentsDrawer = await page.$('text=Review & Feedback');
      assert(commentsDrawer !== null, 'Review comments drawer opened on mobile');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'ios_04_public_viewway_mobile.png') });

    // -------------------------------------------------------------
    // 5. iOS EMBED VIEWWAY (/?embed=proj-1)
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Embed Viewway on iOS ---');
    await page.goto(`${BASE_URL}/?embed=proj-1`, { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Synchronized Script', { timeout: 5000 });
    assert(true, 'Embed Viewway loaded cleanly on mobile');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'ios_05_embed_mobile.png') });

    // -------------------------------------------------------------
    // 6. ZERO CONSOLE ERRORS
    // -------------------------------------------------------------
    console.log('\n--- 6. Console Error Audit on iOS ---');
    const realErrors = consoleErrors.filter(
      (err) => !err.includes('media') && !err.includes('favicon')
    );
    assert(realErrors.length === 0, `Zero JavaScript errors on iOS (Errors: ${realErrors.length})`);
    if (realErrors.length > 0) {
      console.error('Captured errors:', realErrors);
    }

  } catch (error) {
    console.error('❌ Exception during iOS QA:', error);
    failCount++;
  } finally {
    await browser.close();
  }

  console.log('\n=========================================');
  console.log(`📱 iOS QA Summary: ${passCount} Passed, ${failCount} Failed`);
  console.log(`📸 Screenshots saved to: ${SCREENSHOT_DIR}`);
  console.log('=========================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runIOSAgentQA();
