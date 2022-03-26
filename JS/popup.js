let toggleOption = document.getElementById('popup-settings-button');
let websiteDisplay = document.getElementById('popup-block-website');
let faviconDisplay = document.getElementById('popup-block-img');
let popupBlockButton = document.getElementById('popup-block-block-button');
let currentURLInPopUp;

// Event listener to open options page
toggleOption.onclick = function (e) {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
};

// Function to use chrome's tab query to get the URL
function getCurrentTabUrl(callback) {
  var queryInfo = {
    active: true,
    currentWindow: true,
  };

  chrome.tabs.query(queryInfo, function (tabs) {
    var tab = tabs[0];
    var url = tab.url;
    callback(url);
  });
}

// Remove excess url data to preserve just the host
function parseURL(statusText) {
  const urlRegex = /^https?\:\/\/([^\/:?#]+)(?:[\/:?#]|$)/i;
  let matches = statusText.match(urlRegex);
  let parsedDomain = matches && matches[1];

  // If URL exists, populate the Popup with the URL and add the ability to add the block
  // functionality to button
  if (parsedDomain) {
    currentURLInPopUp = parsedDomain;
    websiteDisplay.textContent = currentURLInPopUp;
    faviconDisplay.src = `https://www.google.com/s2/favicons?domain=${currentURLInPopUp}`;
    popupBlockButton.onclick = () => addToBlockList(currentURLInPopUp);
  }
  // Otherwise, display a error message and make button unavailable
  else {
    websiteDisplay.textContent = 'Not available here';
    faviconDisplay.src = 'https://www.google.com/s2/favicons?domain=google.com';
    popupBlockButton.style.backgroundColor = 'lightgrey';
    popupBlockButton.disabled = true;
    popupBlockButton.style.cursor = 'not-allowed';
  }
}

// Take current URL from currentURLInPopUp var and add to chrome storage + reload
function addToBlockList(url) {
  chrome.storage.sync.get('gogginsBlocked', function (data) {
    const oldBlockedList = JSON.parse(data.gogginsBlocked);
    const newBlockedList = oldBlockedList.concat(url);
    chrome.storage.sync.set({ gogginsBlocked: JSON.stringify(newBlockedList) }, function () {});
    chrome.tabs.reload();
  });
}

// On load, run functions above to get current URL
document.addEventListener('DOMContentLoaded', function () {
  getCurrentTabUrl(function (url) {
    parseURL(url);
  });
});
