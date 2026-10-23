document.addEventListener('DOMContentLoaded', () => {
  let selectedMode = 'screen-cam';
  const modeButtons = document.querySelectorAll('.mode-btn');
  const micToggle = document.getElementById('mic-toggle');
  const sysAudioToggle = document.getElementById('sys-audio-toggle');
  const camBubbleToggle = document.getElementById('cam-bubble-toggle');
  const startBtn = document.getElementById('start-record-btn');

  // Load saved settings
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['mode', 'mic', 'sysAudio', 'camBubble'], (res) => {
      if (res.mode) {
        selectedMode = res.mode;
        modeButtons.forEach((b) => b.classList.toggle('active', b.dataset.mode === res.mode));
      }
      if (res.mic !== undefined) micToggle.checked = res.mic;
      if (res.sysAudio !== undefined) sysAudioToggle.checked = res.sysAudio;
      if (res.camBubble !== undefined) camBubbleToggle.checked = res.camBubble;
    });
  }

  // Handle mode selection
  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedMode = btn.dataset.mode;
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ mode: selectedMode });
      }
    });
  });

  // Toggles change
  const saveToggles = () => {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({
        mic: micToggle.checked,
        sysAudio: sysAudioToggle.checked,
        camBubble: camBubbleToggle.checked,
      });
    }
  };

  micToggle.addEventListener('change', saveToggles);
  sysAudioToggle.addEventListener('change', saveToggles);
  camBubbleToggle.addEventListener('change', saveToggles);

  // Start recording
  startBtn.addEventListener('click', async () => {
    startBtn.disabled = true;
    startBtn.innerHTML = '<span>Launching Recorder...</span>';

    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.id) {
        alert('Could not find active tab to record.');
        startBtn.disabled = false;
        return;
      }

      // Send recording trigger message to content script
      chrome.tabs.sendMessage(
        activeTab.id,
        {
          action: 'START_DESCRIPT_RECORDING',
          payload: {
            mode: selectedMode,
            mic: micToggle.checked,
            sysAudio: sysAudioToggle.checked,
            camBubble: camBubbleToggle.checked,
          },
        },
        (response) => {
          if (chrome.runtime.lastError) {
            // If content script was not injected on restricted URL (e.g. chrome://)
            alert('Cannot record browser system pages. Please open any web page (or localhost) and click Record!');
            startBtn.disabled = false;
            startBtn.innerHTML = '<div class="rec-dot"></div><span>Start Recording</span>';
            return;
          }
          window.close();
        }
      );
    } catch (err) {
      console.error(err);
      startBtn.disabled = false;
      startBtn.innerHTML = '<div class="rec-dot"></div><span>Start Recording</span>';
    }
  });
});
