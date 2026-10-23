// Descript Companion Background Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Descript Companion] Extension installed successfully.');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'PING') {
    sendResponse({ status: 'PONG', version: '1.0.0' });
    return true;
  }

  if (message.action === 'OPEN_DESCRIPT_STUDIO') {
    chrome.tabs.create({ url: message.url || 'http://localhost:5173' });
    sendResponse({ success: true });
    return true;
  }

  return true;
});
