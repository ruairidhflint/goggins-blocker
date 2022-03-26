// On installation, set up a piece of storage within the User's Chrome browser to
// store the list of blocked websites
chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.set({ gogginsBlocked: '[]' }, function () {});
});
