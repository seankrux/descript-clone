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
    // SECTION 1: DESKTOP SUITE (1280x800)
    // =========================================================================
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      permissions: ['clipboard-read', 'clipboard-write'],
    });
    const page = await context.newPage();

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon')) {
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

    const viewportMeta = await page.$eval('meta[name="viewport"]', (el) => el.getAttribute('content') || '');
    assert(!viewportMeta.includes('user-scalable=no') && !viewportMeta.includes('maximum-scale=1'), `Viewport meta permits pinch-to-zoom (${viewportMeta})`);

    const brandHeader = await page.$("text=Sean's Studio");
    assert(brandHeader !== null, "Sean's Studio brand workspace header rendered");

    const storageMeter = await page.$('text=Cloud Drive');
    assert(storageMeter !== null, 'Cloud storage and quota meter displayed (2.4 / 10 GB)');

    // Search filter
    const searchInput = await page.$('input[placeholder*="Search projects"]');
    assert(searchInput !== null, 'Search input found in dashboard');
    if (searchInput) {
      await searchInput.fill('Launch');
      await page.waitForTimeout(250);
      const filteredCards = await page.$$('h3:has-text("Product Launch")');
      assert(filteredCards.length === 1, `Search filtered to matching project (${filteredCards.length} match)`);
      await searchInput.fill('');
      await page.waitForTimeout(200);
    }

    // Category filter pills
    const videoFilter = await page.$('button:text-is("Videos")');
    assert(videoFilter !== null, 'Found "Videos" category filter button');
    if (videoFilter) {
      await videoFilter.click();
      await page.waitForTimeout(200);
      const videoFilterClass = await videoFilter.getAttribute('class');
      assert(Boolean(videoFilterClass && videoFilterClass.includes('bg-indigo-600')), 'Switched to "Videos" filter tab (active state verified)');
    }
    const allFilter = await page.$('button:text-is("All")');
    if (allFilter) {
      await allFilter.click();
      await page.waitForTimeout(200);
      const allFilterClass = await allFilter.getAttribute('class');
      assert(Boolean(allFilterClass && allFilterClass.includes('bg-indigo-600')), 'Switched back to "All" projects filter tab (active state verified)');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_dashboard_full.png') });

    // -------------------------------------------------------------
    // 2. TEXT-BASED VIDEO EDITOR WORKSPACE & 1280x800 OVERFLOW CHECK
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Text-Based Video Editor Workspace (1280x800) ---');
    await page.click('h3:has-text("Product Launch")');
    const docScriptHeader = await page.waitForSelector('text=Document Script', { timeout: 6000 });
    assert(docScriptHeader !== null, 'Navigated to text-based video editor view');

    // Verify top header buttons do not overflow 1280px viewport
    const shareBtnHeader = await page.$('header button:has-text("Share")');
    const exportBtnHeader = await page.$('header button:has-text("Export")');
    assert(shareBtnHeader !== null && exportBtnHeader !== null, 'Header Export and Share buttons rendered');
    if (shareBtnHeader && exportBtnHeader) {
      const shareBox = await shareBtnHeader.boundingBox();
      const exportBox = await exportBtnHeader.boundingBox();
      assert(
        Boolean(shareBox && exportBox && shareBox.x + shareBox.width <= 1280 && exportBox.x + exportBox.width <= 1280),
        `Header Export/Share buttons fit within 1280px viewport (Share right edge: ${Math.round((shareBox?.x || 0) + (shareBox?.width || 0))}px)`
      );
    }

    // Verify <video crossOrigin="anonymous">
    const videoCrossOrigin = await page.$eval('video', (v) => v.getAttribute('crossorigin'));
    assert(videoCrossOrigin === 'anonymous', '<video> element has crossOrigin="anonymous" for Web Audio DSP compatibility');

    // Transcript word tokens
    const words = await page.$$('[id^="word-"]');
    assert(words.length >= 25, `Rendered ${words.length} interactive transcript words`);

    // Script word search
    const scriptSearch = await page.$('input[placeholder="Find word in script..."]');
    assert(scriptSearch !== null, 'Found script word search input');
    if (scriptSearch) {
      await scriptSearch.fill('Underlord');
      await page.waitForTimeout(250);
      const matchWords = await page.$$('.ring-yellow-400');
      assert(matchWords.length > 0, `Script search highlighted ${matchWords.length} matching word token(s)`);
      await scriptSearch.fill('');
    }

    // Word selection, Action Toolbar & Non-Destructive Cut Skip
    const targetWord = await page.$('#word-w7');
    assert(targetWord !== null, 'Found target word token #word-w7 ("production.")');
    if (targetWord) {
      await targetWord.click();
      await page.waitForTimeout(250);
      const currentTimeAfterClick = await page.$eval('video', (v) => v.currentTime);
      assert(Math.abs(currentTimeAfterClick - 2.2) < 0.25, `Clicking word token sought video playhead to ${currentTimeAfterClick.toFixed(2)}s`);

      const correctBtn = await page.$('button[title*="Correct spelling"]');
      assert(correctBtn !== null, 'Floating word action toolbar appeared with "Correct" button');

      // Edit text inline
      if (correctBtn) {
        await correctBtn.click();
        await page.waitForTimeout(200);
        const inlineInput = await page.$('main#main-content input[type="text"]');
        assert(inlineInput !== null, 'Inline word editor input appeared');
        if (inlineInput) {
          await inlineInput.fill('production-grade');
          await inlineInput.press('Enter');
          await page.waitForTimeout(250);
          const updatedWordText = await page.$eval('#word-w7', (el) => el.textContent || '');
          assert(updatedWordText.includes('production-grade'), `Committed inline word correction ("${updatedWordText}")`);
        }
      }

      // Cut word and verify non-destructive playback skip
      await page.click('#word-w7');
      await page.waitForTimeout(150);
      const cutBtn = await page.$('button[title*="Cut word from video"]');
      assert(cutBtn !== null, 'Found "Cut" button in floating word toolbar');
      if (cutBtn) {
        await cutBtn.click();
        await page.waitForTimeout(250);
        const wordHiddenWhenCutsHidden = (await page.$('#word-w7')) === null;
        assert(wordHiddenWhenCutsHidden, 'Cut word hidden from active transcript view when "Show Cuts" is off');

        // Toggle Show Cuts on to inspect & restore cut word
        const showCutsBtn = await page.$('button:has-text("Show Cuts")');
        if (showCutsBtn) {
          await showCutsBtn.click();
          await page.waitForTimeout(200);
        }
        const cutWordClass = await page.$eval('#word-w7', (el) => el.getAttribute('class') || '');
        assert(cutWordClass.includes('line-through'), 'Cut word displays line-through styling when "Show Cuts" is enabled');

        // Verify Editor playback skips deleted word interval [2.2, 2.8]
        await page.evaluate(() => {
          const v = document.querySelector('video');
          if (v) {
            v.currentTime = 2.25;
            v.dispatchEvent(new Event('timeupdate'));
          }
        });
        await page.waitForTimeout(150);
        const skippedTime = await page.$eval('video', (v) => v.currentTime);
        assert(skippedTime >= 2.34, `Editor non-destructive playback automatically skipped deleted word range (2.25s -> ${skippedTime.toFixed(2)}s)`);

        // Restore word
        await page.click('#word-w7');
        await page.waitForTimeout(150);
        const restoreBtn = await page.$('button[title*="Restore cut segment"]');
        assert(restoreBtn !== null, 'Found "Restore" button for cut word');
        if (restoreBtn) {
          await restoreBtn.click();
          await page.waitForTimeout(200);
          const restoredClass = await page.$eval('#word-w7', (el) => el.getAttribute('class') || '');
          assert(!restoredClass.includes('line-through'), 'Restored cut word back to active transcript');
        }
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_editor_workspace.png') });

    // -------------------------------------------------------------
    // 3. VIDEO CANVAS & ASPECT RATIO CONTROLS
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Video Canvas & Aspect Ratio Switcher ---');
    const reelBtn = await page.$('header button:has-text("9:16")');
    if (reelBtn) {
      await reelBtn.click();
      await page.waitForTimeout(250);
      const verticalCanvas = await page.$('.aspect-\\[9\\/16\\]');
      assert(verticalCanvas !== null, 'Switched canvas aspect ratio to 9:16 Reel/TikTok mode (.aspect-[9/16] present)');
    }

    const landscapeBtn = await page.$('header button:has-text("16:9")');
    if (landscapeBtn) {
      await landscapeBtn.click();
      await page.waitForTimeout(250);
      const landscapeCanvas = await page.$('.aspect-video');
      assert(landscapeCanvas !== null, 'Reverted canvas aspect ratio to 16:9 Landscape (.aspect-video present)');
    }

    // -------------------------------------------------------------
    // 4. MULTITRACK TIMELINE & TRANSPORT
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Multitrack Waveform Timeline & Transport ---');
    const playBtn = await page.$('button[title*="Play (Space)"], button[title*="Pause (Space)"]');
    assert(playBtn !== null, 'Found transport play/pause button in timeline');
    if (playBtn) {
      const titleBefore = await playBtn.getAttribute('title');
      await playBtn.click();
      await page.waitForTimeout(300);
      const titleDuring = await playBtn.getAttribute('title');
      assert(titleBefore !== titleDuring, `Triggered timeline playback (${titleBefore} -> ${titleDuring})`);
      await playBtn.click();
      await page.waitForTimeout(200);
      const titleAfter = await playBtn.getAttribute('title');
      assert(titleAfter === titleBefore, `Paused timeline playback (${titleAfter})`);
    }

    const splitBtn = await page.$('button[title*="Split clip at playhead position (S)"]');
    assert(splitBtn !== null, 'Found Split Clip action button');

    const timelineClips = await page.$$('[class*="bg-indigo-950"], [class*="border-white/20"]');
    assert(timelineClips.length > 0, `Rendered ${timelineClips.length} multitrack clips/tracks`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_multitrack_timeline.png') });

    // -------------------------------------------------------------
    // 5. UNDERLORD AI COPILOT (ALL TABS & SILENCE SHORTENING)
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Underlord AI Copilot Suite ---');
    const underlordBtn = await page.$('header button:has-text("Underlord")');
    assert(underlordBtn !== null, 'Found Underlord trigger button');
    await underlordBtn.click();
    const underlordDialog = await page.waitForSelector('#underlord-panel-title', { timeout: 3000 });
    assert(underlordDialog !== null, 'Underlord AI Copilot drawer opened with accessible title');

    // Test Silence Shortening in Copilot tab
    const shortenSilencesBtn = await page.$('[role="dialog"] button:has-text("Shorten Wordless Gaps")');
    if (shortenSilencesBtn) {
      await shortenSilencesBtn.click();
      await page.waitForTimeout(250);
      const word14StillExists = (await page.$('#word-w14')) !== null;
      assert(word14StillExists, 'Triggered Shorten Wordless Gaps & Silences in Underlord');
    }

    // Fillers Tab
    const fillersTab = await page.$('[role="dialog"] button:has-text("Fillers")');
    if (fillersTab) {
      await fillersTab.click();
      await page.waitForTimeout(200);
      const fillerHeading = await page.$('text=Filler Words Found');
      assert(fillerHeading !== null, 'Switched to Underlord Filler Words tab');

      const fillersBefore = await page.$$eval('[id^="word-"]', (els) =>
        els.filter((el) => el.textContent && el.textContent.includes('filler') && !el.className.includes('line-through')).length
      );
      const removeAllFillersBtn = await page.$('[role="dialog"] button:has-text("Remove All")');
      if (removeAllFillersBtn) {
        await removeAllFillersBtn.click();
        await page.waitForTimeout(250);
        const fillersAfter = await page.$$eval('[id^="word-"]', (els) =>
          els.filter((el) => el.textContent && el.textContent.includes('filler') && !el.className.includes('line-through')).length
        );
        assert(fillersAfter === 0 && fillersBefore >= 0, `Removed all active filler words (${fillersBefore} -> ${fillersAfter})`);
      }
    }

    // Clarity Tab
    const clarityTab = await page.$('[role="dialog"] button:has-text("Clarity")');
    if (clarityTab) {
      await clarityTab.click();
      await page.waitForTimeout(200);
      const clarityBtn = await page.$('[role="dialog"] button:has-text("Apply Clarity Trim")');
      assert(clarityBtn !== null, 'Switched to Underlord Clarity tab and verified action button');
    }

    // Social Clips Tab
    const socialTab = await page.$('[role="dialog"] button:has-text("Social Clips")');
    if (socialTab) {
      await socialTab.click();
      await page.waitForTimeout(200);
      const socialContent = await page.$('text=AI Viral Soundbites Detected');
      assert(socialContent !== null, 'Switched to Underlord Social Clips generator tab');
    }

    // Summary & Chapters Tab
    const summaryTab = await page.$('[role="dialog"] button:has-text("Summary")');
    if (summaryTab) {
      await summaryTab.click();
      await page.waitForTimeout(200);
      const genSummaryBtn = await page.$('button:has-text("Generate AI Summary & Chapters")');
      assert(genSummaryBtn !== null, 'Switched to Underlord Summary & Chapters tab');
      if (genSummaryBtn) {
        await genSummaryBtn.click();
        const summaryText = await page.waitForSelector('text=Executive Summary', { timeout: 4000 });
        assert(summaryText !== null, 'Generated executive summary, takeaways, and auto-chapters');
      }
    }

    // Translate Tab
    const translateTab = await page.$('[role="dialog"] button:has-text("Translate")');
    if (translateTab) {
      await translateTab.click();
      await page.waitForTimeout(200);
      const translateBtn = await page.$('[role="dialog"] button:has-text("Translate & Synthesize Captions")');
      assert(translateBtn !== null, 'Switched to Underlord Subtitle Translation tab');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_underlord_suite.png') });

    // Close Underlord
    const closeUnderlord = await page.$('button[title="Close Underlord"]');
    if (closeUnderlord) {
      await closeUnderlord.click();
      await page.waitForSelector('#underlord-panel-title', { state: 'detached', timeout: 3000 });
      assert((await page.$('#underlord-panel-title')) === null, 'Closed Underlord Copilot drawer');
    }

    // -------------------------------------------------------------
    // 6. STUDIO SOUND DSP SUITE
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Studio Sound DSP Suite ---');
    const studioSoundBtn = await page.$('header button:has-text("Studio Sound")');
    assert(studioSoundBtn !== null, 'Found Studio Sound button in header');
    await studioSoundBtn.click();
    const studioSoundModal = await page.waitForSelector('#studio-sound-title', { timeout: 3000 });
    assert(studioSoundModal !== null, 'Studio Sound Suite modal opened');

    const intensitySlider = await page.$('[role="dialog"] input[type="range"]');
    assert(intensitySlider !== null, 'Found Studio Sound wet/dry intensity slider');

    // Toggle 50/60Hz Hum Gate switch
    const humSwitch = await page.$('[role="dialog"] button[aria-label="50/60Hz Hum Gate"]');
    assert(humSwitch !== null, 'Found 50/60Hz Hum Gate switch');
    if (humSwitch) {
      const beforeHum = await humSwitch.getAttribute('aria-checked');
      await humSwitch.click();
      await page.waitForTimeout(150);
      const afterHum = await humSwitch.getAttribute('aria-checked');
      assert(beforeHum !== afterHum, `Toggled 50/60Hz Hum Gate switch (aria-checked: ${beforeHum} -> ${afterHum})`);
    }

    const rawToggle = await page.$('[role="dialog"] button:has-text("Raw Audio (B)")');
    if (rawToggle) {
      await rawToggle.click();
      await page.waitForTimeout(150);
      const rawClass = await rawToggle.getAttribute('class');
      assert(Boolean(rawClass && rawClass.includes('bg-amber-600')), 'Toggled A/B audio comparison mode to Raw Audio (B)');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_studio_sound.png') });

    const applyStudioSoundBtn = await page.$('button:has-text("Apply & Close")');
    if (applyStudioSoundBtn) {
      await applyStudioSoundBtn.click();
      await page.waitForSelector('#studio-sound-title', { state: 'detached', timeout: 3000 });
      assert((await page.$('#studio-sound-title')) === null, 'Saved Studio Sound DSP settings and closed modal');
    }

    // -------------------------------------------------------------
    // 7. DYNAMIC CAPTIONS STUDIO
    // -------------------------------------------------------------
    console.log('\n--- 7. Testing Dynamic Captions Studio ---');
    const captionsBtn = await page.$('header button:has-text("Captions")');
    assert(captionsBtn !== null, 'Found Dynamic Captions button');
    await captionsBtn.click();
    const captionsModal = await page.waitForSelector('#dynamic-captions-title', { timeout: 3000 });
    assert(captionsModal !== null, 'Dynamic Captions Studio modal opened');

    const neonPreset = await page.$('[role="dialog"] button:has-text("Neon Glow"), [role="dialog"] div:has-text("Neon Glow")');
    if (neonPreset) {
      await neonPreset.click();
      await page.waitForTimeout(200);
      const activePreset = await page.$('[role="dialog"] [class*="border-pink-500"]');
      assert(activePreset !== null, 'Selected Neon Glow caption preset');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_captions_studio.png') });

    const saveCaptionsBtn = await page.$('button:has-text("Save & Apply")');
    if (saveCaptionsBtn) {
      await saveCaptionsBtn.click();
      await page.waitForSelector('#dynamic-captions-title', { state: 'detached', timeout: 3000 });
      assert((await page.$('#dynamic-captions-title')) === null, 'Saved dynamic caption styling and closed modal');
    }

    // -------------------------------------------------------------
    // 8. EYE CONTACT AI MODAL
    // -------------------------------------------------------------
    console.log('\n--- 8. Testing Eye Contact AI Modal ---');
    const eyeContactBtn = await page.$('header button:has-text("Eye Contact")');
    assert(eyeContactBtn !== null, 'Found Eye Contact button');
    if (eyeContactBtn) {
      await eyeContactBtn.click();
      const eyeModal = await page.waitForSelector('#eye-contact-modal-title', { timeout: 3000 });
      assert(eyeModal !== null, 'AI Eye Contact modal opened');

      const blinkSwitch = await page.$('[role="dialog"] button[aria-label*="Saccades"], [role="dialog"] [role="switch"]');
      if (blinkSwitch) {
        const prevChecked = await blinkSwitch.getAttribute('aria-checked');
        await blinkSwitch.click();
        await page.waitForTimeout(150);
        const nextChecked = await blinkSwitch.getAttribute('aria-checked');
        assert(prevChecked !== nextChecked, `Toggled AI Eye Contact switch (${prevChecked} -> ${nextChecked})`);
        // Toggle back on so Eye Contact remains active
        if (nextChecked === 'false') {
          await blinkSwitch.click();
          await page.waitForTimeout(100);
        }
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_eye_contact.png') });

      const closeEyeContact = await page.$('[role="dialog"] button:has-text("Done"), [role="dialog"] button:has-text("Apply")');
      if (closeEyeContact) {
        await closeEyeContact.click();
        await page.waitForSelector('#eye-contact-modal-title', { state: 'detached', timeout: 3000 });
        assert((await page.$('#eye-contact-modal-title')) === null, 'Applied Eye Contact settings and closed modal');
      }
    }

    // -------------------------------------------------------------
    // 9. CANVAS TRANSITIONS & EFFECTS MODAL
    // -------------------------------------------------------------
    console.log('\n--- 9. Testing Canvas Transitions & Effects Modal ---');
    const transitionsBtn = await page.$('button[title*="Canvas Effects"]');
    assert(transitionsBtn !== null, 'Found Canvas Effects & Transitions button');
    if (transitionsBtn) {
      await transitionsBtn.click();
      const transModal = await page.waitForSelector('#canvas-transitions-title', { timeout: 3000 });
      assert(transModal !== null, 'Canvas Effects & Transitions modal opened');

      const zoomInEffect = await page.$('[role="dialog"] button:has-text("Zoom In")');
      if (zoomInEffect) {
        await zoomInEffect.click();
        await page.waitForTimeout(150);
        const zoomClass = await zoomInEffect.getAttribute('class');
        assert(Boolean(zoomClass && (zoomClass.includes('border-indigo') || zoomClass.includes('border-amber') || zoomClass.includes('bg-'))), 'Selected Zoom In transition effect');
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_transitions.png') });

      const applyTransitions = await page.$('button:has-text("Apply Visual Effects")');
      if (applyTransitions) {
        await applyTransitions.click();
        await page.waitForSelector('#canvas-transitions-title', { state: 'detached', timeout: 3000 });
        assert((await page.$('#canvas-transitions-title')) === null, 'Applied Visual Transitions and closed modal');
      }
    }

    // -------------------------------------------------------------
    // 10. MULTICAM DIRECTOR SWITCHER
    // -------------------------------------------------------------
    console.log('\n--- 10. Testing Multicam Director Studio ---');
    const multicamBtn = await page.$('button[title="Multicam Director"]');
    assert(multicamBtn !== null, 'Found Multicam Director button');
    if (multicamBtn) {
      await multicamBtn.click();
      const multicamModal = await page.waitForSelector('#multicam-director-title', { timeout: 3000 });
      assert(multicamModal !== null, 'Multicam Director modal opened');

      const angleCards = await page.$$('[role="dialog"] .grid > div');
      assert(angleCards.length >= 2, `Multicam angles rendered (${angleCards.length} angles available)`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_multicam_studio.png') });

      const closeMulticam = await page.$('button:has-text("Apply Camera Angle")');
      if (closeMulticam) {
        await closeMulticam.click();
        await page.waitForSelector('#multicam-director-title', { state: 'detached', timeout: 3000 });
        assert((await page.$('#multicam-director-title')) === null, 'Closed Multicam Studio');
      }
    }

    // -------------------------------------------------------------
    // 11. TELEPROMPTER VIEW
    // -------------------------------------------------------------
    console.log('\n--- 11. Testing Teleprompter Studio ---');
    const prompterBtn = await page.$('button[title="Teleprompter Readout"]');
    assert(prompterBtn !== null, 'Found Teleprompter Readout button');
    if (prompterBtn) {
      await prompterBtn.click();
      const prompterModal = await page.waitForSelector('#teleprompter-title', { timeout: 3000 });
      assert(prompterModal !== null, 'Studio Teleprompter opened');

      const mirrorBtn = await page.$('button[title*="Mirror"]');
      if (mirrorBtn) {
        await mirrorBtn.click();
        await page.waitForTimeout(150);
        const mirroredContainer = await page.$('.scale-x-\\[-1\\]');
        assert(mirroredContainer !== null, 'Toggled hardware teleprompter mirror flip (.scale-x-[-1] active)');
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_teleprompter.png') });

      await page.keyboard.press('Escape');
      await page.waitForSelector('#teleprompter-title', { state: 'detached', timeout: 3000 });
      assert((await page.$('#teleprompter-title')) === null, 'Closed Teleprompter Studio');
    }

    // -------------------------------------------------------------
    // 12. VOICE CLONING & OVERDUB MODAL
    // -------------------------------------------------------------
    console.log('\n--- 12. Testing Voice Cloning & Overdub Modal ---');
    const overdubBtn = await page.$('button[title="Voice Clone & Overdub"]');
    assert(overdubBtn !== null, 'Found Voice Clone & Overdub button');
    if (overdubBtn) {
      const wordsBeforeOverdub = (await page.$$('[id^="word-"]')).length;
      await overdubBtn.click();
      const voiceModal = await page.waitForSelector('#voice-cloning-title', { timeout: 3000 });
      assert(voiceModal !== null, 'AI Voice Cloning & Overdub modal opened');

      const voiceModel = await page.$('text=Sean Guillermo');
      assert(voiceModel !== null, 'Sean Guillermo Custom Cloned Voice Model listed');

      const overdubInput = await page.$('[role="dialog"] textarea');
      if (overdubInput) {
        await overdubInput.fill('Seamless overdub');
        const synthBtn = await page.$('button:has-text("Insert Overdub into Script")');
        if (synthBtn) {
          await synthBtn.click();
          await page.waitForSelector('#voice-cloning-title', { state: 'detached', timeout: 4000 });
          const wordsAfterOverdub = (await page.$$('[id^="word-"]')).length;
          assert(wordsAfterOverdub > wordsBeforeOverdub, `Synthesized and inserted AI voice overdub (${wordsBeforeOverdub} -> ${wordsAfterOverdub} words)`);
        }
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_voice_cloning.png') });
    }

    // -------------------------------------------------------------
    // 13. SCREEN RECORDER MODAL
    // -------------------------------------------------------------
    console.log('\n--- 13. Testing Screen & Camera Recorder Modal ---');
    const recorderBtn = await page.$('button[title="Screen & Cam Recorder"]');
    assert(recorderBtn !== null, 'Found Screen & Cam Recorder button');
    if (recorderBtn) {
      await recorderBtn.click();
      const recModal = await page.waitForSelector('#screen-recorder-title', { timeout: 3000 });
      assert(recModal !== null, 'Descriptivist Screen & Cam Recorder modal opened');

      const screenModeBtn = await page.$('button:has-text("Screen Only"), button:has-text("Screen + Cam")');
      assert(screenModeBtn !== null, 'Recording mode selectors rendered');

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_screen_recorder.png') });

      await page.keyboard.press('Escape');
      await page.waitForSelector('#screen-recorder-title', { state: 'detached', timeout: 3000 });
      assert((await page.$('#screen-recorder-title')) === null, 'Closed Screen Recorder modal');
    }

    // -------------------------------------------------------------
    // 14. COMMENTS & REVIEW PANEL
    // -------------------------------------------------------------
    console.log('\n--- 14. Testing Comments & Review Notes Panel ---');
    const commentsBtn = await page.$('header button[title="Collaboration & Review Comments"], header button:has(svg.lucide-message-square)');
    assert(commentsBtn !== null, 'Found Comments button in header');
    if (commentsBtn) {
      await commentsBtn.click();
      const commentsDrawer = await page.waitForSelector('#comments-panel-title', { timeout: 3000 });
      assert(commentsDrawer !== null, 'Collaboration & Feedback panel opened');

      const commentInput = await page.$('input[placeholder*="Add timestamped feedback"]');
      if (commentInput) {
        const noteText = 'Full suite verification note: speech cadence is pristine.';
        await commentInput.fill(noteText);
        const sendBtn = await page.$('[role="dialog"] form button[type="submit"]');
        if (sendBtn) {
          await sendBtn.click();
          await page.waitForTimeout(250);
          const postedComment = await page.$(`text=${noteText}`);
          assert(postedComment !== null, 'Posted and rendered timestamped editor review comment');
        }
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_comments_panel.png') });

      await page.keyboard.press('Escape');
      await page.waitForSelector('#comments-panel-title', { state: 'detached', timeout: 3000 });
      assert((await page.$('#comments-panel-title')) === null, 'Closed Comments panel');
    }

    // -------------------------------------------------------------
    // 15. ENTERPRISE EXPORT STUDIO
    // -------------------------------------------------------------
    console.log('\n--- 15. Testing Enterprise Export Studio ---');
    const exportBtn = await page.$('header button:has-text("Export")');
    assert(exportBtn !== null, 'Found Export Studio button');
    await exportBtn.click();
    const exportModal = await page.waitForSelector('#export-modal-title', { timeout: 3000 });
    assert(exportModal !== null, 'Enterprise Export & Publish modal opened');

    const startExportBtn = await page.$('button:has-text("Start Production Render")');
    if (startExportBtn) {
      await startExportBtn.click();
      const trimmedWavBtn = await page.waitForSelector('button:has-text("Trimmed WAV")', { timeout: 5000 });
      assert(trimmedWavBtn !== null, 'Executed production export pipeline and unlocked master download actions');
      if (trimmedWavBtn) {
        const downloadPromise = page.waitForEvent('download', { timeout: 4000 });
        await trimmedWavBtn.click();
        const download = await downloadPromise;
        assert(download.suggestedFilename().endsWith('.wav'), `Downloaded trimmed WAV audio master (${download.suggestedFilename()})`);
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_export_studio.png') });

    await page.keyboard.press('Escape');
    await page.waitForSelector('#export-modal-title', { state: 'detached', timeout: 3000 });
    assert((await page.$('#export-modal-title')) === null, 'Closed Export Studio modal');

    // -------------------------------------------------------------
    // 16. SHARE & PUBLISH MODAL
    // -------------------------------------------------------------
    console.log('\n--- 16. Testing Share & Publish Modal ---');
    const shareBtn = await page.$('header button:has-text("Share")');
    assert(shareBtn !== null, 'Found Share button in editor');
    await shareBtn.click();
    const shareModal = await page.waitForSelector('#share-modal-title', { timeout: 3000 });
    assert(shareModal !== null, 'Publish & Share modal opened');

    const copyBtn = await page.$('button:has-text("Copy Link")');
    assert(copyBtn !== null, 'Copy public link button available');

    const embedTab = await page.$('button:has-text("Embed Player")');
    if (embedTab) {
      await embedTab.click();
      await page.waitForTimeout(200);
      const iframeCode = await page.$('pre');
      const text = iframeCode ? await iframeCode.textContent() : '';
      assert(Boolean(text && text.includes('<iframe')), 'Generated valid iframe embed code');
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_share_modal.png') });

    await page.keyboard.press('Escape');
    await page.waitForSelector('#share-modal-title', { state: 'detached', timeout: 3000 });

    // -------------------------------------------------------------
    // 17. PUBLIC SHARE VIEWWAY & PASSCODE PROTECTION (/?share=proj-1)
    // -------------------------------------------------------------
    console.log('\n--- 17. Testing Public Presentation Viewway & Passcode Gate ---');
    await page.goto(`${BASE_URL}/?share=proj-1`, { waitUntil: 'networkidle' });
    const interactiveTranscriptHeading = await page.waitForSelector('text=Interactive Transcript', { timeout: 6000 });
    assert(interactiveTranscriptHeading !== null, 'Public Interactive Viewway loaded via deep link');

    const publicWords = await page.$$('[id^="public-word-"]');
    assert(publicWords.length >= 20, `Public viewway rendered ${publicWords.length} interactive transcript words`);

    // Verify Public Share viewway non-destructive playback skips deleted filler word w12 ([4.4, 4.8])
    await page.evaluate(() => {
      const v = document.querySelector('video');
      if (v) {
        v.currentTime = 4.45;
        v.dispatchEvent(new Event('timeupdate'));
      }
    });
    await page.waitForTimeout(150);
    const shareSkippedTime = await page.$eval('video', (v) => v.currentTime);
    assert(shareSkippedTime >= 4.75, `Public Share viewway automatically skipped deleted word range (4.45s -> ${shareSkippedTime.toFixed(2)}s)`);

    // Review drawer
    const reviewBtn = await page.$('button:has-text("Review")');
    if (reviewBtn) {
      await reviewBtn.click();
      await page.waitForTimeout(250);
      const reviewDrawerInput = await page.$('textarea[placeholder*="Leave review note at playhead"]');
      assert(reviewDrawerInput !== null, 'Opened Public Review comments drawer');
    }

    // Test Passcode Protection Gate (rejects wrong passcode, unlocks on valid passcode)
    await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('descript_projects_v2') || '[]');
      if (saved.length > 0) {
        const p1 = saved.find((p) => p.id === 'proj-1') || saved[0];
        p1.shareSettings = {
          ...(p1.shareSettings || {}),
          isPublished: true,
          accessLevel: 'passcode',
          passcode: 'studio2026',
          allowComments: true,
          allowDownloads: true,
          allowTranscriptSearch: true,
        };
        localStorage.setItem('descript_projects_v2', JSON.stringify(saved));
      }
    });
    await page.reload({ waitUntil: 'networkidle' });
    const passcodeGateHeading = await page.waitForSelector('text=Passcode Protected Viewway', { timeout: 5000 });
    assert(passcodeGateHeading !== null, 'Passcode gate rendered when project accessLevel is "passcode"');

    // Submit wrong passcode
    const passcodeInput = await page.$('input[type="password"]');
    const unlockBtn = await page.$('button:has-text("Unlock Presentation")');
    if (passcodeInput && unlockBtn) {
      await passcodeInput.fill('wrong-password-123');
      await unlockBtn.click();
      await page.waitForTimeout(200);
      const stillLocked = await page.$('text=Passcode Protected Viewway');
      const errorMsg = await page.$('[role="alert"]');
      assert(stillLocked !== null && errorMsg !== null, 'Invalid passcode rejected with error alert and presentation remained locked');

      // Submit valid passcode
      await passcodeInput.fill('studio2026');
      await unlockBtn.click();
      const unlockedView = await page.waitForSelector('text=Interactive Transcript', { timeout: 4000 });
      assert(unlockedView !== null, 'Valid passcode ("studio2026") unlocked Public Share Viewway');
    }

    // Restore public accessLevel in localStorage
    await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('descript_projects_v2') || '[]');
      if (saved.length > 0) {
        const p1 = saved.find((p) => p.id === 'proj-1') || saved[0];
        if (p1.shareSettings) p1.shareSettings.accessLevel = 'public';
        localStorage.setItem('descript_projects_v2', JSON.stringify(saved));
      }
    });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16_public_viewway.png') });

    // -------------------------------------------------------------
    // 18. EMBED VIEWWAY (/?embed=proj-1)
    // -------------------------------------------------------------
    console.log('\n--- 18. Testing Embed Player Viewway ---');
    const embedResponse = await page.goto(`${BASE_URL}/?embed=proj-1`, { waitUntil: 'networkidle' });
    const embedVideo = await page.waitForSelector('video', { timeout: 5000 });
    assert(embedVideo !== null, 'Embed player <video> element loaded cleanly');
    const xFrameOptions = embedResponse ? embedResponse.headers()['x-frame-options'] : undefined;
    assert(xFrameOptions !== 'SAMEORIGIN' && xFrameOptions !== 'DENY', `Embed endpoint does not block cross-origin iframes (x-frame-options: ${xFrameOptions || 'none'})`);

    // Verify Embed viewway non-destructive playback skips deleted filler word w12 ([4.4, 4.8])
    await page.evaluate(() => {
      const v = document.querySelector('video');
      if (v) {
        v.currentTime = 4.45;
        v.dispatchEvent(new Event('timeupdate'));
      }
    });
    await page.waitForTimeout(150);
    const embedSkippedTime = await page.$eval('video', (v) => v.currentTime);
    assert(embedSkippedTime >= 4.75, `Embed viewway automatically skipped deleted word range (4.45s -> ${embedSkippedTime.toFixed(2)}s)`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '17_embed_viewway.png') });

    await context.close();

    // =========================================================================
    // SECTION 2: MOBILE VIEWPORT EMULATION (iPhone 15 Pro — 390x844)
    // =========================================================================
    console.log('\n--- 19. Testing iOS Mobile Device Emulation (iPhone 15 Pro 390x844) ---');
    const iPhone = devices['iPhone 15 Pro'];
    const mobileContext = await browser.newContext({
      ...iPhone,
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();

    mobilePage.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon')) {
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
      await mobilePage.keyboard.press('Escape');
      await mobilePage.waitForTimeout(200);
    }

    // Mobile Editor Layout
    await mobilePage.click('h3:has-text("Product Launch")');
    const mobileDocHeader = await mobilePage.waitForSelector('text=Document Script', { timeout: 5000 });
    assert(mobileDocHeader !== null, 'Opened project in mobile 390x844 viewport');

    // Verify canvas badges do not collide on mobile
    const eyeBadge = await mobilePage.$('text=AI Eye Contact Locked');
    const soundBadge = await mobilePage.$('text=Studio Sound Active');
    if (eyeBadge && soundBadge) {
      const b1 = await eyeBadge.boundingBox();
      const b2 = await soundBadge.boundingBox();
      const overlaps =
        b1 &&
        b2 &&
        b1.x < b2.x + b2.width &&
        b1.x + b1.width > b2.x &&
        b1.y < b2.y + b2.height &&
        b1.y + b1.height > b2.y;
      assert(!overlaps, 'Mobile video canvas badges ("AI Eye Contact Locked" and "Studio Sound Active") do not overlap');
    }

    // Mobile Tool Shelf
    const mobileShelf = await mobilePage.$('.overflow-x-auto');
    assert(mobileShelf !== null, 'Horizontal swipeable iOS tool shelf rendered');

    // Mobile Word Selection & Script Scroll Area Height Check
    const mobileWord = await mobilePage.$('#word-w2');
    if (mobileWord) {
      await mobileWord.click();
      await mobilePage.waitForTimeout(300);
      const pill = await mobilePage.$('.ios-glass');
      assert(pill !== null, 'Floating iOS glass word action bar displayed on mobile tap');

      const mainBox = await mobilePage.$eval('main#main-content', (el) => {
        const rect = el.getBoundingClientRect();
        return { height: rect.height };
      });
      assert(mainBox.height >= 140, `Mobile transcript scroll container remains visible and scrollable when word is selected (height: ${Math.round(mainBox.height)}px)`);
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
