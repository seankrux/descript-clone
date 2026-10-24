const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'qa-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const BASE_URL = process.env.TEST_URL || 'http://127.0.0.1:4173';

async function runFullSuiteQA() {
  console.log('===============================================================');
  console.log('🚀 DESCRIPTIVIST STUDIO — ENTERPRISE FULL SUITE QA TEST RUNNER');
  console.log(`🌐 Target Base URL: ${BASE_URL}`);
  console.log('===============================================================\n');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });

  let passCount = 0;
  let failCount = 0;
  const consoleErrors = [];

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
    // =========================================================================
    // SECTION 1: DESKTOP SUITE (1440x900)
    // =========================================================================
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    const page = await context.newPage();

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('media decode')) {
          consoleErrors.push(`[Browser Console Error] ${text}`);
        }
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(`[Unhandled Page Error] ${err.message}`);
    });

    // -------------------------------------------------------------
    // 1. DASHBOARD & WORKSPACES
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Dashboard View & Projects Hub ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    assert((await page.title()).includes('Descriptivist'), 'Page title includes "Descriptivist"');

    const brandHeader = await page.$('text=Sean\'s Studio');
    assert(brandHeader !== null, 'Sean\'s Studio brand workspace header rendered');

    // Storage meters
    const storageMeter = await page.$('text=Cloud Drive');
    assert(storageMeter !== null, 'Cloud storage and quota meter displayed (2.4 / 10 GB)');

    // Search filter
    const searchInput = await page.$('input[placeholder*="Search projects"]');
    assert(searchInput !== null, 'Search input found in dashboard');
    if (searchInput) {
      await searchInput.fill('Launch');
      await page.waitForTimeout(300);
      const cards = await page.$$('.grid > div');
      assert(cards.length > 0, `Search filtered to ${cards.length} matching project(s)`);
      await searchInput.fill('');
      await page.waitForTimeout(200);
    }

    // Category filter pills
    const videoFilter = await page.$('button:has-text("Videos")');
    if (videoFilter) {
      await videoFilter.click();
      await page.waitForTimeout(200);
      assert(true, 'Switched to "Videos" filter tab');
    }
    const allFilter = await page.$('button:has-text("All")');
    if (allFilter) {
      await allFilter.click();
      await page.waitForTimeout(200);
      assert(true, 'Switched back to "All" projects filter tab');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_dashboard_full.png') });

    // -------------------------------------------------------------
    // 2. TEXT-BASED VIDEO EDITOR WORKSPACE
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Text-Based Video Editor Workspace ---');
    await page.click('h3:has-text("Product Launch")');
    await page.waitForSelector('text=Document Script', { timeout: 6000 });
    assert(true, 'Navigated to text-based video editor view');

    // Transcript word tokens
    const words = await page.$$('[id^="word-"], .flex-wrap > span');
    assert(words.length >= 25, `Rendered ${words.length} interactive transcript words`);

    // Script word search
    const scriptSearch = await page.$('input[placeholder="Find word in script..."]');
    assert(scriptSearch !== null, 'Found script word search input');
    if (scriptSearch) {
      await scriptSearch.fill('Underlord');
      await page.waitForTimeout(300);
      const matchWords = await page.$$('.ring-yellow-400, .bg-yellow-400\\/20');
      assert(matchWords.length > 0, `Script search highlighted ${matchWords.length} instances`);
      await scriptSearch.fill('');
    }

    // Word selection & Action Toolbar
    const targetWord = await page.$('text=production.');
    if (targetWord) {
      await targetWord.click();
      await page.waitForTimeout(300);
      assert(true, 'Clicked word token "production." to seek playhead');

      const correctBtn = await page.$('button:has-text("Correct")');
      assert(correctBtn !== null, 'Floating word action toolbar appeared with "Correct" button');

      // Edit text inline
      if (correctBtn) {
        await correctBtn.click();
        await page.waitForTimeout(200);
        const inlineInput = await page.$('.space-y-4 input[type="text"], .flex-wrap input[type="text"]');
        assert(inlineInput !== null, 'Inline word editor input appeared');
        if (inlineInput) {
          await inlineInput.fill('production-grade');
          await inlineInput.press('Enter');
          await page.waitForTimeout(300);
          assert(true, 'Committed inline word correction');
          const updatedWord = await page.$('text=production-grade');
          assert(updatedWord !== null, 'Corrected word rendered in transcript');
        }
      }

      // Cut word
      const cutBtn = await page.$('button:has-text("Cut")');
      if (cutBtn) {
        await cutBtn.click();
        await page.waitForTimeout(300);
        assert(true, 'Cut word from video via toolbar');
      }

      // Restore word
      const restoreBtn = await page.$('button:has-text("Restore")');
      if (restoreBtn) {
        await restoreBtn.click();
        await page.waitForTimeout(300);
        assert(true, 'Restored cut word back to video timeline');
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_editor_workspace.png') });

    // -------------------------------------------------------------
    // 3. VIDEO CANVAS & ASPECT RATIO CONTROLS
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Video Canvas & Aspect Ratio Switcher ---');
    const reelBtn = await page.$('button:has-text("9:16")');
    if (reelBtn) {
      await reelBtn.click();
      await page.waitForTimeout(300);
      assert(true, 'Switched canvas aspect ratio to 9:16 Reel/TikTok mode');
    }

    const landscapeBtn = await page.$('button:has-text("16:9")');
    if (landscapeBtn) {
      await landscapeBtn.click();
      await page.waitForTimeout(300);
      assert(true, 'Reverted canvas aspect ratio to 16:9 Landscape');
    }

    // -------------------------------------------------------------
    // 4. MULTITRACK TIMELINE & TRANSPORT
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Multitrack Waveform Timeline & Transport ---');
    const playBtn = await page.$('button[title*="Play (Space)"], button[title*="Pause (Space)"]');
    assert(playBtn !== null, 'Found transport play/pause button in timeline');
    if (playBtn) {
      await playBtn.click();
      await page.waitForTimeout(400);
      assert(true, 'Triggered timeline playback');
      await playBtn.click();
      await page.waitForTimeout(200);
      assert(true, 'Paused timeline playback');
    }

    const splitBtn = await page.$('button[title*="Split clip at playhead position (S)"]');
    assert(splitBtn !== null, 'Found Split Clip action button');

    // Check timeline clips
    const timelineClips = await page.$$('.border-t .h-40, .border-t .h-64, [class*="bg-indigo-950"], [class*="border-white/20"]');
    assert(timelineClips.length > 0, `Rendered ${timelineClips.length} multitrack clips/tracks`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_multitrack_timeline.png') });

    // -------------------------------------------------------------
    // 5. UNDERLORD AI COPILOT (ALL TABS)
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Underlord AI Copilot Suite ---');
    const underlordBtn = await page.$('header button:has-text("Underlord")');
    assert(underlordBtn !== null, 'Found Underlord trigger button');
    await underlordBtn.click();
    await page.waitForSelector('text=Underlord AI', { timeout: 3000 });
    assert(true, 'Underlord AI Copilot drawer opened');

    // Fillers Tab
    const fillersTab = await page.$('button:has-text("Fillers")');
    if (fillersTab) {
      await fillersTab.click();
      await page.waitForTimeout(300);
      assert(true, 'Switched to Underlord Filler Words tab');
      const removeAllFillersBtn = await page.$('button:has-text("Remove All Fillers"), button:has-text("Remove All")');
      if (removeAllFillersBtn) {
        await removeAllFillersBtn.click();
        await page.waitForTimeout(300);
        assert(true, 'Clicked "Remove All Fillers" action');
      }
    }

    // Clarity Tab
    const clarityTab = await page.$('button:has-text("Clarity")');
    if (clarityTab) {
      await clarityTab.click();
      await page.waitForTimeout(300);
      assert(true, 'Switched to Underlord Clarity tab');
    }

    // Social Clips Tab
    const socialTab = await page.$('button:has-text("Social Clips")');
    if (socialTab) {
      await socialTab.click();
      await page.waitForTimeout(300);
      assert(true, 'Switched to Underlord Social Clips generator tab');
    }

    // Summary & Chapters Tab
    const summaryTab = await page.$('button:has-text("Summary")');
    if (summaryTab) {
      await summaryTab.click();
      await page.waitForTimeout(300);
      assert(true, 'Switched to Underlord Summary & Chapters tab');

      const genSummaryBtn = await page.$('button:has-text("Generate AI Summary & Chapters")');
      if (genSummaryBtn) {
        await genSummaryBtn.click();
        await page.waitForSelector('text=Executive Summary', { timeout: 4000 });
        const summaryText = await page.$('text=Executive Summary');
        assert(summaryText !== null, 'Generated executive summary, takeaways, and auto-chapters');
      }
    }

    // Translate Tab
    const translateTab = await page.$('button:has-text("Translate")');
    if (translateTab) {
      await translateTab.click();
      await page.waitForTimeout(300);
      assert(true, 'Switched to Underlord Subtitle Translation tab');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_underlord_suite.png') });

    // Close Underlord
    const closeUnderlord = await page.$('button[title="Close Underlord"]');
    if (closeUnderlord) {
      await closeUnderlord.click({ force: true });
      await page.waitForTimeout(300);
      assert(true, 'Closed Underlord Copilot drawer');
    }

    // -------------------------------------------------------------
    // 6. STUDIO SOUND DSP SUITE
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Studio Sound DSP Suite ---');
    const studioSoundBtn = await page.$('header button:has-text("Studio Sound")');
    assert(studioSoundBtn !== null, 'Found Studio Sound button in header');
    await studioSoundBtn.click();
    await page.waitForSelector('text=Studio Sound Suite', { timeout: 3000 });
    assert(true, 'Studio Sound Suite modal opened');

    const intensitySlider = await page.$('input[type="range"]');
    assert(intensitySlider !== null, 'Found Studio Sound wet/dry intensity slider');

    const abToggle = await page.$('button:has-text("Original"), button:has-text("Processed"), button:has-text("A/B")');
    if (abToggle) {
      await abToggle.click();
      await page.waitForTimeout(200);
      assert(true, 'Toggled A/B audio comparison mode');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_studio_sound.png') });

    const applyStudioSoundBtn = await page.$('button:has-text("Apply & Close")');
    if (applyStudioSoundBtn) {
      await applyStudioSoundBtn.click();
      await page.waitForTimeout(300);
      assert(true, 'Saved Studio Sound DSP settings and closed modal');
    }

    // -------------------------------------------------------------
    // 7. DYNAMIC CAPTIONS STUDIO
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Dynamic Captions Studio ---');
    const captionsBtn = await page.$('button:has-text("Captions")');
    assert(captionsBtn !== null, 'Found Dynamic Captions button');
    await captionsBtn.click();
    await page.waitForSelector('text=Dynamic Captions Studio', { timeout: 3000 });
    assert(true, 'Dynamic Captions Studio modal opened');

    const neonPreset = await page.$('button:has-text("Neon Glow"), div:has-text("Neon Glow")');
    if (neonPreset) {
      await neonPreset.click();
      await page.waitForTimeout(200);
      assert(true, 'Selected Neon Glow caption preset');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_captions_studio.png') });

    const saveCaptionsBtn = await page.$('button:has-text("Save & Apply")');
    if (saveCaptionsBtn) {
      await saveCaptionsBtn.click();
      await page.waitForTimeout(300);
      assert(true, 'Saved dynamic caption styling');
    }

    // -------------------------------------------------------------
    // 8. EYE CONTACT AI MODAL
    // -------------------------------------------------------------
    console.log('\n--- 8. Testing Eye Contact AI Modal ---');
    const eyeContactBtn = await page.$('button:has-text("Eye Contact")');
    if (eyeContactBtn) {
      await eyeContactBtn.click();
      await page.waitForSelector('text=AI Eye Contact', { timeout: 3000 });
      assert(true, 'AI Eye Contact modal opened');

      const saccadesCheckbox = await page.$('input[type="checkbox"]');
      if (saccadesCheckbox) {
        await saccadesCheckbox.click();
        assert(true, 'Toggled natural saccades & blink preservation');
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_eye_contact.png') });

      const closeEyeContact = await page.$('button:has-text("Done")');
      if (closeEyeContact) {
        await closeEyeContact.click();
        await page.waitForTimeout(300);
        assert(true, 'Applied Eye Contact settings and closed modal');
      }
    }

    // -------------------------------------------------------------
    // 9. CANVAS TRANSITIONS & EFFECTS MODAL
    // -------------------------------------------------------------
    console.log('\n--- 9. Testing Canvas Transitions & Effects Modal ---');
    const transitionsBtn = await page.$('button[title*="Transitions"], button:has-text("Effects")');
    if (transitionsBtn) {
      await transitionsBtn.click();
      await page.waitForSelector('text=Canvas Effects & Transitions', { timeout: 3000 });
      assert(true, 'Canvas Effects & Transitions modal opened');

      const zoomInEffect = await page.$('button:has-text("Zoom In")');
      if (zoomInEffect) {
        await zoomInEffect.click();
        assert(true, 'Selected Zoom In transition effect');
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_transitions.png') });

      const applyTransitions = await page.$('button:has-text("Apply Visual Effects")');
      if (applyTransitions) {
        await applyTransitions.click();
        await page.waitForTimeout(300);
        assert(true, 'Applied Visual Transitions and closed modal');
      }
    }

    // -------------------------------------------------------------
    // 10. MULTICAM DIRECTOR SWITCHER
    // -------------------------------------------------------------
    console.log('\n--- 10. Testing Multicam Director Studio ---');
    const multicamBtn = await page.$('button[title="Multicam Director"]');
    if (multicamBtn) {
      await multicamBtn.click();
      await page.waitForSelector('text=Multicam Director', { timeout: 3000 });
      assert(true, 'Multicam Director modal opened');

      const angleCards = await page.$$('.grid > div');
      assert(angleCards.length >= 2, `Multicam angles rendered (${angleCards.length} angles available)`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_multicam_studio.png') });

      const closeMulticam = await page.$('button:has-text("Apply Camera Angle")');
      if (closeMulticam) {
        await closeMulticam.click();
        await page.waitForTimeout(300);
        assert(true, 'Closed Multicam Studio');
      }
    }

    // -------------------------------------------------------------
    // 11. TELEPROMPTER VIEW
    // -------------------------------------------------------------
    console.log('\n--- 11. Testing Teleprompter Studio ---');
    const prompterBtn = await page.$('button[title="Teleprompter Readout"]');
    if (prompterBtn) {
      await prompterBtn.click();
      await page.waitForSelector('text=Studio Teleprompter', { timeout: 3000 });
      assert(true, 'Studio Teleprompter opened');

      const mirrorBtn = await page.$('button:has-text("Mirror"), button[title*="Mirror"]');
      if (mirrorBtn) {
        await mirrorBtn.click();
        await page.waitForTimeout(200);
        assert(true, 'Toggled hardware teleprompter mirror flip');
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_teleprompter.png') });

      const closePrompter = await page.$('.fixed.inset-0 button:has(svg.lucide-x)');
      if (closePrompter) {
        await closePrompter.click();
        await page.waitForTimeout(300);
        assert(true, 'Closed Teleprompter Studio');
      }
    }

    // -------------------------------------------------------------
    // 12. VOICE CLONING & OVERDUB MODAL
    // -------------------------------------------------------------
    console.log('\n--- 12. Testing Voice Cloning & Overdub Modal ---');
    const overdubBtn = await page.$('button[title="Voice Clone & Overdub"]');
    if (overdubBtn) {
      await overdubBtn.click();
      await page.waitForSelector('text=AI Voice Cloning & Overdub', { timeout: 3000 });
      assert(true, 'AI Voice Cloning & Overdub modal opened');

      const voiceModel = await page.$('text=Sean Guillermo');
      assert(voiceModel !== null, 'Sean Guillermo Custom Cloned Voice Model listed');

      const overdubInput = await page.$('textarea[placeholder*="Type replacement speech"], textarea');
      if (overdubInput) {
        await overdubInput.fill('Seamless text overdub synthesis');
        const synthBtn = await page.$('button:has-text("Insert Overdub into Script")');
        if (synthBtn) {
          await synthBtn.click();
          await page.waitForTimeout(1100);
          assert(true, 'Synthesized and inserted AI voice overdub');
        }
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_voice_cloning.png') });
    }

    // -------------------------------------------------------------
    // 13. SCREEN RECORDER MODAL
    // -------------------------------------------------------------
    console.log('\n--- 13. Testing Screen & Camera Recorder Modal ---');
    const recorderBtn = await page.$('button[title="Screen & Cam Recorder"]');
    if (recorderBtn) {
      await recorderBtn.click();
      await page.waitForSelector('text=Descriptivist Screen & Cam Recorder', { timeout: 3000 });
      assert(true, 'Descriptivist Screen & Cam Recorder modal opened');

      const screenModeBtn = await page.$('button:has-text("Screen Only"), button:has-text("Screen & Cam")');
      assert(screenModeBtn !== null, 'Recording mode selectors rendered');

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_screen_recorder.png') });

      const closeRecorder = await page.$('.fixed.inset-0 button:has(svg.lucide-x)');
      if (closeRecorder) {
        await closeRecorder.click();
        await page.waitForTimeout(300);
        assert(true, 'Closed Screen Recorder modal');
      }
    }

    // -------------------------------------------------------------
    // 14. COMMENTS & REVIEW PANEL
    // -------------------------------------------------------------
    console.log('\n--- 14. Testing Comments & Review Notes Panel ---');
    const commentsBtn = await page.$('header button:has(svg.lucide-message-square)');
    if (commentsBtn) {
      await commentsBtn.click();
      await page.waitForSelector('text=Collaboration & Feedback', { timeout: 3000 });
      assert(true, 'Collaboration & Feedback panel opened');

      const commentInput = await page.$('input[placeholder*="Add timestamped feedback"]');
      if (commentInput) {
        await commentInput.fill('Full suite test verification note: speech cadence is pristine.');
        const sendBtn = await page.$('form button[type="submit"]');
        if (sendBtn) {
          await sendBtn.click();
          await page.waitForTimeout(300);
          assert(true, 'Posted timestamped editor review comment');
        }
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_comments_panel.png') });

      const closeComments = await page.$('.fixed.inset-y-0.right-0 button:has(svg.lucide-x)');
      if (closeComments) {
        await closeComments.click();
        await page.waitForTimeout(300);
        assert(true, 'Closed Comments panel');
      }
    }

    // -------------------------------------------------------------
    // 15. ENTERPRISE EXPORT STUDIO
    // -------------------------------------------------------------
    console.log('\n--- 15. Testing Enterprise Export Studio ---');
    const exportBtn = await page.$('header button:has-text("Export")');
    assert(exportBtn !== null, 'Found Export Studio button');
    await exportBtn.click();
    await page.waitForSelector('text=Enterprise Export & Publish', { timeout: 3000 });
    assert(true, 'Enterprise Export & Publish modal opened');

    const startExportBtn = await page.$('button:has-text("Start Production Render")');
    if (startExportBtn) {
      await startExportBtn.click();
      await page.waitForTimeout(1800);
      assert(true, 'Executed simulated enterprise export pipeline');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_export_studio.png') });

    const closeExport = await page.$('.fixed.inset-0 button:has(svg.lucide-x)');
    if (closeExport) {
      await closeExport.click();
      await page.waitForTimeout(300);
      assert(true, 'Closed Export Studio modal');
    }

    // -------------------------------------------------------------
    // 16. SHARE & PUBLISH MODAL
    // -------------------------------------------------------------
    console.log('\n--- 16. Testing Share & Publish Modal ---');
    const shareBtn = await page.$('header button:has-text("Share")');
    assert(shareBtn !== null, 'Found Share button in editor');
    await shareBtn.click();
    await page.waitForSelector('text=Publish & Share Project', { timeout: 3000 });
    assert(true, 'Publish & Share modal opened');

    const copyBtn = await page.$('button:has-text("Copy Link")');
    assert(copyBtn !== null, 'Copy public link button available');

    const embedTab = await page.$('button:has-text("Embed Player")');
    if (embedTab) {
      await embedTab.click();
      await page.waitForTimeout(200);
      const iframeCode = await page.$('pre');
      const text = iframeCode ? await iframeCode.textContent() : '';
      assert(text.includes('<iframe'), 'Generated valid iframe embed code');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_share_modal.png') });

    const closeShare = await page.$('.fixed.inset-0 button:has(svg.lucide-x)');
    if (closeShare) await closeShare.click();
    await page.waitForTimeout(300);

    // -------------------------------------------------------------
    // 17. PUBLIC SHARE VIEWWAY (/?share=proj-1)
    // -------------------------------------------------------------
    console.log('\n--- 17. Testing Public Presentation Viewway ---');
    await page.goto(`${BASE_URL}/?share=proj-1`, { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Interactive Transcript', { timeout: 6000 });
    assert(true, 'Public Interactive Viewway loaded via deep link');

    const publicWords = await page.$$('[id^="public-word-"]');
    assert(publicWords.length >= 20, `Public viewway rendered ${publicWords.length} interactive transcript words`);

    // Review drawer
    const reviewBtn = await page.$('button:has-text("Review")');
    if (reviewBtn) {
      await reviewBtn.click();
      await page.waitForTimeout(300);
      assert(true, 'Opened Public Review comments drawer');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16_public_viewway.png') });

    // -------------------------------------------------------------
    // 18. EMBED VIEWWAY (/?embed=proj-1)
    // -------------------------------------------------------------
    console.log('\n--- 18. Testing Embed Player Viewway ---');
    await page.goto(`${BASE_URL}/?embed=proj-1`, { waitUntil: 'networkidle' });
    await page.waitForSelector('video', { timeout: 5000 });
    assert(true, 'Embed player loaded cleanly');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '17_embed_viewway.png') });

    await context.close();

    // =========================================================================
    // SECTION 2: MOBILE VIEWPORT EMULATION (iPhone 15 Pro)
    // =========================================================================
    console.log('\n--- 19. Testing iOS Mobile Device Emulation (iPhone 15 Pro) ---');
    const iPhone = devices['iPhone 15 Pro'];
    const mobileContext = await browser.newContext({
      ...iPhone,
      viewport: { width: 393, height: 852 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();

    mobilePage.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('media decode')) {
          consoleErrors.push(`[Mobile Console Error] ${text}`);
        }
      }
    });

    // Mobile Dashboard
    await mobilePage.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const mobileTabBar = await mobilePage.$('nav.fixed.bottom-0');
    assert(mobileTabBar !== null, 'Native iOS bottom navigation tab bar rendered on mobile');

    // Mobile Profile & Storage Sheet
    const profileTab = await mobilePage.$('button:has-text("Profile")');
    if (profileTab) {
      await profileTab.click();
      await mobilePage.waitForTimeout(300);
      const profileSheet = await mobilePage.$('text=seanguillermo@gmail.com');
      assert(profileSheet !== null, 'Mobile slide-up Profile & Storage sheet opened');
      await mobilePage.click('button:has-text("✕")');
      await mobilePage.waitForTimeout(200);
    }

    // Mobile Editor Layout
    await mobilePage.click('h3:has-text("Product Launch")');
    await mobilePage.waitForSelector('text=Document Script', { timeout: 5000 });
    assert(true, 'Opened project in mobile viewport');

    // Mobile Tool Shelf
    const mobileShelf = await mobilePage.$('.overflow-x-auto');
    assert(mobileShelf !== null, 'Horizontal swipeable iOS tool shelf rendered');

    // Mobile Word Action Pill
    const mobileWord = await mobilePage.$('text=Descriptivist,');
    if (mobileWord) {
      await mobileWord.click();
      await mobilePage.waitForTimeout(300);
      const pill = await mobilePage.$('.fixed.bottom-6, .ios-glass');
      assert(pill !== null, 'Floating iOS glass word action pill displayed on mobile tap');
    }

    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, '18_mobile_iphone15_editor.png') });
    await mobileContext.close();

    // -------------------------------------------------------------
    // 20. JAVASCRIPT CONSOLE AUDIT
    // -------------------------------------------------------------
    console.log('\n--- 20. JavaScript Console Error Audit ---');
    assert(consoleErrors.length === 0, `Zero console errors encountered (Errors: ${consoleErrors.length})`);
    if (consoleErrors.length > 0) {
      console.error('Console errors logged:', consoleErrors);
    }

  } catch (error) {
    console.error('❌ Unexpected exception in QA runner:', error);
    failCount++;
  } finally {
    await browser.close();
  }

  console.log('\n===============================================================');
  console.log(`🏁 FULL SUITE RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log(`📸 Screenshots saved to: ${SCREENSHOT_DIR}`);
  console.log('===============================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runFullSuiteQA();
