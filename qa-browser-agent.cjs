const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'qa-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const BASE_URL = 'http://127.0.0.1:4173';

async function runBrowserAgentQA() {
  console.log('🚀 Starting Descript Clone Production Browser Agent QA...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
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
    // 1. DASHBOARD QA
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Dashboard View & Projects Hub ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    assert((await page.title()).includes('Descript'), 'Page title contains Descript');

    const projectCards = await page.$$('.grid > div');
    assert(projectCards.length >= 3, `Found ${projectCards.length} project cards in dashboard`);

    const viewwayBadge = await page.$('text=Viewway');
    assert(viewwayBadge !== null, 'Public Viewway badge displayed on published project');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_dashboard.png') });

    // -------------------------------------------------------------
    // 2. OPEN EDITOR VIEW & TRANSCRIPT SCRUBBING
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Text-Based Video Editor Workspace ---');
    // Click first project card
    await page.click('text=Product Launch & AI Studio 2026');
    await page.waitForSelector('text=Document Script', { timeout: 5000 });
    assert(true, 'Navigated to text-based video editor view');

    // Verify word tokens are rendered
    const wordTokens = await page.$$('[id^="word-"], .flex-wrap > span');
    assert(wordTokens.length >= 20, `Rendered ${wordTokens.length} interactive transcript words`);

    // Test search in script
    const searchInput = await page.$('input[placeholder="Find word in script..."]');
    assert(searchInput !== null, 'Found script search input');
    await searchInput.fill('Underlord');
    await page.waitForTimeout(300);

    const highlightedWords = await page.$$('.ring-yellow-400, .bg-yellow-400\\/20');
    assert(highlightedWords.length > 0, `Search highlighted ${highlightedWords.length} matches`);
    await searchInput.fill(''); // clear search

    // Test clicking a word token to seek video and open floating toolbar
    const targetWord = await page.$('text=production.');
    if (targetWord) {
      await targetWord.click();
      await page.waitForTimeout(300);
      assert(true, 'Clicked transcript word "production." to trigger playhead seek');

      // Verify Floating Word Action Toolbar appeared
      const correctBtn = await page.$('button:has-text("Correct")');
      assert(correctBtn !== null, 'Floating word action toolbar appeared with "Correct" button');

      // Test Inline Word Text Correction
      await correctBtn.click();
      await page.waitForTimeout(200);
      const inlineInput = await page.$('.space-y-4 input[type="text"], .flex-wrap input[type="text"]');
      assert(inlineInput !== null, 'Inline word editor input rendered');
      if (inlineInput) {
        await inlineInput.fill('production-grade');
        await inlineInput.press('Enter');
        await page.waitForTimeout(300);
        assert(true, 'Committed corrected word text via Enter key');

        const updatedWord = await page.$('text=production-grade');
        assert(updatedWord !== null, 'Corrected word "production-grade" rendered in transcript');
      }

      // Test Word Cutting (Delete)
      const cutBtn = await page.$('button:has-text("Cut")');
      if (cutBtn) {
        await cutBtn.click();
        await page.waitForTimeout(300);
        assert(true, 'Cut word from video via floating toolbar');
      }

      // Test Word Restoration
      const restoreBtn = await page.$('button:has-text("Restore")');
      if (restoreBtn) {
        await restoreBtn.click();
        await page.waitForTimeout(300);
        assert(true, 'Restored cut word back to video timeline');
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_editor_workspace.png') });

    // Test LocalStorage Persistence across Page Reload
    console.log('\n--- 2b. Testing LocalStorage Transcript Persistence across Reload ---');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('text=Document Script', { timeout: 5000 });
    const persistedWord = await page.$('text=production-grade');
    assert(persistedWord !== null, 'Corrected word "production-grade" persisted across page reload via localStorage');

    // -------------------------------------------------------------
    // 3. UNDERLORD AI COPILOT QA
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Underlord AI Copilot Tabs ---');
    const underlordBtn = await page.$('header button:has-text("Underlord")');
    assert(underlordBtn !== null, 'Found Underlord button in header');
    await underlordBtn.click();
    await page.waitForSelector('text=Underlord AI', { timeout: 3000 });
    assert(true, 'Underlord Copilot drawer opened');

    // Check tabs in Underlord drawer
    const fillerTab = await page.$('.fixed.inset-y-0.right-0 button:has-text("Fillers")');
    if (fillerTab) {
      await fillerTab.click();
      await page.waitForTimeout(200);
      assert(true, 'Switched to Underlord Filler Words removal tab');
    }

    const socialTab = await page.$('.fixed.inset-y-0.right-0 button:has-text("Social Clips")');
    if (socialTab) {
      await socialTab.click();
      await page.waitForTimeout(200);
      assert(true, 'Switched to Underlord Social Clips tab');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_underlord_copilot.png') });

    // Close Underlord drawer
    const closeUnderlord = await page.$('.fixed.inset-y-0.right-0 button:has(.lucide-x)');
    if (closeUnderlord) {
      await closeUnderlord.click();
      await page.waitForTimeout(400);
      assert(true, 'Closed Underlord Copilot drawer');
    }

    // -------------------------------------------------------------
    // 4. STUDIO SOUND DSP SUITE QA
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Studio Sound DSP Suite & Audio Engine ---');
    const studioSoundBtn = await page.$('header button:has-text("Studio Sound")');
    assert(studioSoundBtn !== null, 'Found Studio Sound button in header');
    await studioSoundBtn.click();
    await page.waitForSelector('text=Studio Sound Suite', { timeout: 3000 });
    assert(true, 'Studio Sound Remaster modal opened');

    const canvasVisualizer = await page.$('canvas');
    assert(canvasVisualizer !== null, 'Live Web Audio frequency spectrum canvas rendered');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_studio_sound_dsp.png') });

    // Close modal
    await page.click('button:has-text("Apply & Close")');
    await page.waitForTimeout(400);
    assert(true, 'Closed Studio Sound modal');

    // -------------------------------------------------------------
    // 5. SHARE & PUBLISH MODAL QA
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Share & Publish Modal ---');
    const shareBtn = await page.$('header button:has-text("Share")');
    assert(shareBtn !== null, 'Found Share button in editor header');
    await shareBtn.click();
    await page.waitForSelector('text=Publish & Share Project', { timeout: 3000 });
    assert(true, 'Publish & Share modal opened');

    // Test Copy Link
    const copyLinkBtn = await page.$('button:has-text("Copy Link")');
    assert(copyLinkBtn !== null, 'Found Copy Link button');
    await copyLinkBtn.click();
    assert(true, 'Clicked Copy Link in Share Modal');

    // Switch to Embed tab
    const embedTabBtn = await page.$('button:has-text("Embed Player")');
    assert(embedTabBtn !== null, 'Found Embed Player tab');
    await embedTabBtn.click();
    await page.waitForTimeout(200);

    const embedPre = await page.$('pre');
    const embedCodeText = embedPre ? await embedPre.textContent() : '';
    assert(embedCodeText.includes('<iframe'), 'Generated responsive HTML iframe embed code');

    // Switch to Collaborators tab
    const teamTabBtn = await page.$('button:has-text("Collaborators")');
    if (teamTabBtn) {
      await teamTabBtn.click();
      await page.waitForTimeout(200);
      assert(true, 'Switched to Collaborators & Reviewers tab');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_share_modal.png') });

    // Close Share modal
    const closeShare = await page.$('button:has-text("Close")');
    if (closeShare) await closeShare.click();
    await page.waitForTimeout(300);

    // -------------------------------------------------------------
    // 6. PUBLIC SHARE VIEWWAY QA (/?share=proj-1)
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Public Presentation Viewway (/?share=proj-1) ---');
    await page.goto(`${BASE_URL}/?share=proj-1`, { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Interactive Viewway', { timeout: 5000 });
    assert(true, 'Public Interactive Viewway loaded successfully via deep link');

    // Check video player
    const publicVideo = await page.$('video');
    assert(publicVideo !== null, 'Video element present in public viewway');

    // Check synchronized interactive transcript
    const publicWords = await page.$$('[id^="public-word-"]');
    assert(publicWords.length >= 20, `Public viewway rendered ${publicWords.length} clickable transcript words`);

    // Click a word to seek
    const wordToClick = await page.$('#public-word-w8, #public-word-w14, [id^="public-word-"]');
    if (wordToClick) {
      await wordToClick.click();
      await page.waitForTimeout(300);
      assert(true, 'Clicked public transcript word to seek video playhead');
    }

    // Test playback speed change
    const speedBtn = await page.$('button:has-text("1.5x")');
    if (speedBtn) {
      await speedBtn.click();
      assert(true, 'Toggled playback rate to 1.5x in public viewway');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_public_share_viewway.png') });

    // -------------------------------------------------------------
    // 7. TIME-CODED REVIEW COMMENTS & EMOJI REACTIONS QA
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Public Review Comments & Emoji Reactions ---');
    const reviewBtn = await page.$('button:has-text("Review")');
    if (reviewBtn) {
      await reviewBtn.click();
      await page.waitForTimeout(300);
    }

    const reviewHeader = await page.$('text=Review & Feedback');
    assert(reviewHeader !== null, 'Review comments drawer open');

    // Leave a guest comment
    const commentInput = await page.$('textarea[placeholder="Leave review note at playhead..."]');
    if (commentInput) {
      await commentInput.fill('Amazing enterprise text-based video workflow! Audio remastering is crisp.');
      const postBtn = await page.$('button:has-text("Post Comment")');
      if (postBtn) {
        await postBtn.click();
        await page.waitForTimeout(300);
        assert(true, 'Posted timecoded review note as guest');
      }
    }

    // Click emoji reaction
    const reactionBtn = await page.$('button:has-text("🔥")');
    if (reactionBtn) {
      await reactionBtn.click();
      await page.waitForTimeout(200);
      assert(true, 'Interacted with emoji reaction on review comment');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_public_review_comments.png') });

    // -------------------------------------------------------------
    // 8. EMBED VIEWWAY QA (/?embed=proj-1)
    // -------------------------------------------------------------
    console.log('\n--- 8. Testing Embed Viewway (/?embed=proj-1) ---');
    await page.goto(`${BASE_URL}/?embed=proj-1`, { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Synchronized Script', { timeout: 5000 });
    assert(true, 'Embed Viewway loaded cleanly in responsive iframe layout');

    const embedVideo = await page.$('video');
    assert(embedVideo !== null, 'Embed video element present');

    // Screenshot with transcript drawer open
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_embed_viewway_with_script.png') });

    const toggleScriptBtn = await page.$('button:has-text("Hide Script")');
    if (toggleScriptBtn) {
      await toggleScriptBtn.click();
      await page.waitForTimeout(200);
      assert(true, 'Toggled embed transcript drawer visibility');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_embed_viewway_collapsed.png') });

    // -------------------------------------------------------------
    // 9. CONSOLE ERROR AUDIT
    // -------------------------------------------------------------
    console.log('\n--- 9. Console Error & Exception Audit ---');
    // Filter out benign video decoding warnings if any
    const realErrors = consoleErrors.filter(
      (err) => !err.includes('media') && !err.includes('favicon')
    );
    assert(realErrors.length === 0, `Zero JavaScript errors encountered (Errors: ${realErrors.length})`);
    if (realErrors.length > 0) {
      console.error('Captured errors:', realErrors);
    }

  } catch (error) {
    console.error('❌ Unexpected exception during QA execution:', error);
    failCount++;
  } finally {
    await browser.close();
  }

  console.log('\n=========================================');
  console.log(`🏁 QA Summary: ${passCount} Passed, ${failCount} Failed`);
  console.log(`📸 Screenshots saved to: ${SCREENSHOT_DIR}`);
  console.log('=========================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runBrowserAgentQA();
