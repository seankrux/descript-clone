// Descript Companion Content Script
// Injected into web pages to provide the floating recorder toolbar and camera bubble

(function () {
  let recorderStream = null;
  let webcamStream = null;
  let mediaRecorder = null;
  let recordedChunks = [];
  let timerInterval = null;
  let elapsedSeconds = 0;
  let isPaused = false;
  let currentConfig = null;

  let toolbarEl = null;
  let camBubbleEl = null;
  let modalEl = null;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'START_DESCRIPT_RECORDING') {
      currentConfig = request.payload;
      initiateRecording(request.payload);
      sendResponse({ status: 'STARTED' });
    }
  });

  async function initiateRecording(config) {
    try {
      recordedChunks = [];
      elapsedSeconds = 0;
      isPaused = false;

      // 1. Get Screen / Tab stream
      if (config.mode === 'cam') {
        recorderStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: config.mic,
        });
      } else {
        recorderStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: config.sysAudio,
        });

        if (config.mic) {
          try {
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStream.getAudioTracks().forEach((track) => recorderStream.addTrack(track));
          } catch (e) {
            console.warn('[Descript] Mic access denied:', e);
          }
        }
      }

      // 2. If camera bubble requested and mode has screen
      if (config.camBubble && config.mode !== 'cam') {
        try {
          webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          createWebcamBubble(webcamStream);
        } catch (e) {
          console.warn('[Descript] Camera bubble access denied:', e);
        }
      }

      // 3. Setup MediaRecorder
      mediaRecorder = new MediaRecorder(recorderStream, { mimeType: 'video/webm' });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        cleanupLiveElements();
        showCompletedModal();
      };

      mediaRecorder.start(500);

      // 4. Create floating toolbar
      createFloatingToolbar();

      // 5. Start timer
      timerInterval = setInterval(() => {
        if (!isPaused) {
          elapsedSeconds++;
          updateTimerDisplay();
        }
      }, 1000);
    } catch (err) {
      console.error('[Descript] Recording initialization failed:', err);
      alert('Could not start screen recording. Please grant permissions and try again.');
    }
  }

  function createFloatingToolbar() {
    if (toolbarEl) toolbarEl.remove();

    toolbarEl = document.createElement('div');
    toolbarEl.id = 'descript-floating-toolbar';
    toolbarEl.innerHTML = `
      <div class="descript-rec-indicator">
        <span class="descript-rec-dot"></span>
        <span id="descript-timer-text">00:00</span>
      </div>
      <div class="descript-btn-divider"></div>
      <button id="descript-pause-btn" class="descript-tool-btn" title="Pause / Resume">⏸</button>
      <button id="descript-finish-btn" class="descript-finish-btn" title="Finish & Edit in Descriptivist">■ Finish</button>
      <button id="descript-cancel-btn" class="descript-tool-btn descript-danger" title="Discard">✕</button>
    `;

    document.body.appendChild(toolbarEl);

    document.getElementById('descript-pause-btn').addEventListener('click', togglePause);
    document.getElementById('descript-finish-btn').addEventListener('click', finishRecording);
    document.getElementById('descript-cancel-btn').addEventListener('click', cancelRecording);

    makeDraggable(toolbarEl);
  }

  function createWebcamBubble(stream) {
    if (camBubbleEl) camBubbleEl.remove();

    camBubbleEl = document.createElement('div');
    camBubbleEl.id = 'descript-cam-bubble';
    camBubbleEl.innerHTML = `
      <video id="descript-cam-video" autoplay playsinline muted></video>
      <div class="descript-bubble-overlay">
        <span class="descript-bubble-pill">Descriptivist Cam</span>
      </div>
    `;

    document.body.appendChild(camBubbleEl);

    const videoEl = camBubbleEl.querySelector('#descript-cam-video');
    videoEl.srcObject = stream;

    makeDraggable(camBubbleEl);
  }

  function togglePause() {
    if (!mediaRecorder) return;
    const btn = document.getElementById('descript-pause-btn');

    if (isPaused) {
      mediaRecorder.resume();
      isPaused = false;
      btn.innerText = '⏸';
      btn.title = 'Pause Recording';
    } else {
      mediaRecorder.pause();
      isPaused = true;
      btn.innerText = '▶';
      btn.title = 'Resume Recording';
    }
  }

  function finishRecording() {
    clearInterval(timerInterval);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (recorderStream) {
      recorderStream.getTracks().forEach((track) => track.stop());
    }
    if (webcamStream) {
      webcamStream.getTracks().forEach((track) => track.stop());
    }
  }

  function cancelRecording() {
    clearInterval(timerInterval);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (recorderStream) {
      recorderStream.getTracks().forEach((track) => track.stop());
    }
    if (webcamStream) {
      webcamStream.getTracks().forEach((track) => track.stop());
    }
    cleanupLiveElements();
  }

  function cleanupLiveElements() {
    if (toolbarEl) toolbarEl.remove();
    if (camBubbleEl) camBubbleEl.remove();
  }

  function updateTimerDisplay() {
    const timerText = document.getElementById('descript-timer-text');
    if (!timerText) return;
    const m = Math.floor(elapsedSeconds / 60);
    const s = elapsedSeconds % 60;
    timerText.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function showCompletedModal() {
    if (modalEl) modalEl.remove();

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const videoUrl = URL.createObjectURL(blob);
    const studioUrl = (currentConfig && currentConfig.studioUrl) || 'http://localhost:5173';

    modalEl = document.createElement('div');
    modalEl.id = 'descript-completed-modal-backdrop';
    modalEl.innerHTML = `
      <div id="descript-completed-modal">
        <div class="descript-modal-header">
          <div class="descript-modal-title">
            <span class="descript-logo-pill">D</span>
            <span>Recording Ready</span>
          </div>
          <button id="descript-close-modal">✕</button>
        </div>
        <div class="descript-modal-body">
          <video src="${videoUrl}" controls autoplay class="descript-modal-video"></video>
          <div class="descript-modal-info">
            Duration: ${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s • Auto-Transcribe Ready
          </div>
          <div class="descript-modal-actions">
            <a href="${videoUrl}" download="descriptivist-capture.webm" class="descript-btn-secondary">Download WebM</a>
            <button id="descript-open-studio-btn" class="descript-btn-primary">Open in Descriptivist Studio ↗</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    document.getElementById('descript-close-modal').addEventListener('click', () => {
      try {
        URL.revokeObjectURL(videoUrl);
      } catch {}
      modalEl.remove();
    });

    document.getElementById('descript-open-studio-btn').addEventListener('click', () => {
      const title = `Extension Recording ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      
      // 1. Broadcast to open Descript tabs and pass raw Blob (avoiding cross-origin blob: URL)
      try {
        if ('BroadcastChannel' in window) {
          const channel = new BroadcastChannel('descript_companion_sync');
          channel.postMessage({
            type: 'RECORDING_COMPLETED',
            payload: {
              title,
              videoUrl: '',
              videoBlob: blob,
              mimeType: 'video/webm',
              duration: elapsedSeconds || 15,
              timestamp: Date.now(),
              mode: currentConfig ? currentConfig.mode : 'screen-cam',
            },
          });
          setTimeout(() => {
            try { channel.close(); } catch {}
          }, 500);
        }
      } catch (e) {
        console.warn('Broadcast sync error:', e);
      }

      // 2. Open Descript Web Studio with query parameters for direct auto-import
      const targetUrl = new URL(studioUrl);
      targetUrl.searchParams.set('import_recording', 'true');
      targetUrl.searchParams.set('title', title);
      targetUrl.searchParams.set('duration', (elapsedSeconds || 15).toString());

      const openedWin = window.open(targetUrl.toString(), '_blank');
      
      // 3. PostMessage raw Blob once opened so Studio creates its own origin ObjectURL
      if (openedWin) {
        setTimeout(() => {
          try {
            openedWin.postMessage(
              {
                type: 'DESCRIPT_EXTENSION_RECORDING',
                payload: {
                  title,
                  videoUrl: '',
                  videoBlob: blob,
                  mimeType: 'video/webm',
                  duration: elapsedSeconds || 15,
                  timestamp: Date.now(),
                  mode: currentConfig ? currentConfig.mode : 'screen-cam',
                },
              },
              targetUrl.origin
            );
          } catch (postErr) {
            console.warn('postMessage to studio tab failed:', postErr);
          }
        }, 1200);
      }

      modalEl.remove();
    });
  }

  function makeDraggable(el) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    el.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      if (['BUTTON', 'INPUT', 'A'].includes(e.target.tagName)) return;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      el.style.top = (el.offsetTop - pos2) + 'px';
      el.style.left = (el.offsetLeft - pos1) + 'px';
      el.style.bottom = 'auto';
      el.style.right = 'auto';
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }
})();
