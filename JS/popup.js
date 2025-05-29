const toggleOption = document.getElementById("popup-settings-button");
const websiteDisplay = document.getElementById("popup-block-website");
const faviconDisplay = document.getElementById("popup-block-img");
const popupBlockButton = document.getElementById("popup-block-block-button");
let currentURLInPopUp;

toggleOption.onclick = function (e) {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
};

function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "").toLowerCase();
  } catch (error) {
    console.error("Invalid URL:", url, error);
    return null;
  }
}

function getCurrentTabUrl(callback) {
  const queryInfo = {
    active: true,
    currentWindow: true,
  };

  chrome.tabs.query(queryInfo, function (tabs) {
    if (chrome.runtime.lastError) {
      console.error("Tab query error:", chrome.runtime.lastError);
      callback(null);
      return;
    }

    const tab = tabs[0];
    const url = tab?.url;
    callback(url);
  });
}

function checkIfAlreadyBlocked(domain, callback) {
  chrome.storage.sync.get("gogginsBlocked", function (data) {
    if (chrome.runtime.lastError) {
      console.error("Storage error:", chrome.runtime.lastError);
      callback(false);
      return;
    }

    try {
      const blockedSites = JSON.parse(data.gogginsBlocked || "[]");
      const isBlocked = blockedSites.some(
        (site) => site.toLowerCase().replace(/^www\./, "") === domain
      );
      callback(isBlocked);
    } catch (error) {
      console.error("Error parsing blocked sites:", error);
      callback(false);
    }
  });
}

function parseURL(url) {
  if (!url) {
    showUnavailable("Unable to access current tab");
    return;
  }

  const domain = extractDomain(url);

  if (!domain) {
    showUnavailable("Not available here");
    return;
  }

  if (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("moz-extension://")
  ) {
    showUnavailable("Cannot block browser pages");
    return;
  }

  currentURLInPopUp = domain;
  websiteDisplay.textContent = currentURLInPopUp;
  faviconDisplay.src = `https://www.google.com/s2/favicons?domain=${currentURLInPopUp}`;

  checkIfAlreadyBlocked(domain, function (isBlocked) {
    if (isBlocked) {
      showAlreadyBlocked();
    } else {
      enableBlockButton();
    }
  });
}

function showUnavailable(message) {
  websiteDisplay.textContent = message;
  faviconDisplay.src = "https://www.google.com/s2/favicons?domain=google.com";
  popupBlockButton.textContent = "Unavailable";
  popupBlockButton.style.backgroundColor = "lightgrey";
  popupBlockButton.disabled = true;
  popupBlockButton.style.cursor = "not-allowed";
}

function showAlreadyBlocked() {
  popupBlockButton.textContent = "Already Blocked";
  popupBlockButton.style.backgroundColor = "#ff6b6b";
  popupBlockButton.disabled = true;
  popupBlockButton.style.cursor = "not-allowed";
}

function enableBlockButton() {
  popupBlockButton.textContent = "Block";
  popupBlockButton.style.backgroundColor = "";
  popupBlockButton.disabled = false;
  popupBlockButton.style.cursor = "pointer";
  popupBlockButton.onclick = () => addToBlockList(currentURLInPopUp);
}

function addToBlockList(domain) {
  if (!domain) return;

  popupBlockButton.disabled = true;
  popupBlockButton.textContent = "Blocking...";

  chrome.storage.sync.get("gogginsBlocked", function (data) {
    if (chrome.runtime.lastError) {
      console.error("Storage error:", chrome.runtime.lastError);

      enableBlockButton();
      return;
    }

    try {
      const oldBlockedList = JSON.parse(data.gogginsBlocked || "[]");

      const normalizedDomain = domain.toLowerCase().replace(/^www\./, "");
      const isDuplicate = oldBlockedList.some(
        (site) => site.toLowerCase().replace(/^www\./, "") === normalizedDomain
      );

      if (isDuplicate) {
        showAlreadyBlocked();
        return;
      }

      const newBlockedList = [...oldBlockedList, normalizedDomain];

      chrome.storage.sync.set(
        { gogginsBlocked: JSON.stringify(newBlockedList) },
        function () {
          if (chrome.runtime.lastError) {
            console.error("Storage set error:", chrome.runtime.lastError);
            enableBlockButton();
            return;
          }

          chrome.tabs.reload();
        }
      );
    } catch (error) {
      console.error("Error processing block list:", error);
      enableBlockButton();
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  getCurrentTabUrl(function (url) {
    parseURL(url);
  });
});
