chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ['content.js']
  }, () => {
    chrome.tabs.sendMessage(tab.id, {type: 'open_panel'});
  });
}); 