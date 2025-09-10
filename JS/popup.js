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

function normalizeDomain(domain) {
  if (!domain) return "";

  // Convert to lowercase and remove www. prefix for comparison
  let normalized = domain.toLowerCase().trim();

  // Remove www. prefix if present
  if (normalized.startsWith("www.")) {
    normalized = normalized.substring(4);
  }

  return normalized;
}

function isValidDomain(domain) {
  if (!domain || typeof domain !== "string") return false;

  const trimmedDomain = domain.trim();
  if (!trimmedDomain) return false;

  // More comprehensive domain validation
  const domainRegex =
    /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

  // Check length constraints
  if (trimmedDomain.length > 253) return false;

  // Check for valid domain format
  if (!domainRegex.test(trimmedDomain)) return false;

  // Additional checks for common issues
  if (
    trimmedDomain.includes("..") ||
    trimmedDomain.startsWith(".") ||
    trimmedDomain.endsWith(".")
  )
    return false;

  return true;
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
  chrome.storage.local.get("gogginsBlocked", function (data) {
    if (chrome.runtime.lastError) {
      console.error("Storage error:", chrome.runtime.lastError);
      callback(false);
      return;
    }

    try {
      const blockedSites = JSON.parse(data.gogginsBlocked || "[]");
      const normalizedDomain = normalizeDomain(domain);
      const isBlocked = blockedSites.some(
        (site) => normalizeDomain(site) === normalizedDomain
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
    setErrorState("Not available here");
    return;
  }

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // Check if we're on a blocked page (extension URL)
    if (
      url.startsWith("chrome-extension://") ||
      url.startsWith("moz-extension://")
    ) {
      setBlockedPageState();
      return;
    }

    // Validate domain format
    if (isValidDomain(domain)) {
      setSuccessState(domain);
    } else {
      setErrorState("Invalid domain");
    }
  } catch (error) {
    setErrorState("Not available here");
  }
}

function setBlockedPageState() {
  websiteDisplay.textContent = "You're on a blocked page";
  faviconDisplay.src = "https://www.google.com/s2/favicons?domain=google.com";

  popupBlockButton.disabled = false;
  popupBlockButton.style.backgroundColor = "rgba(52, 152, 219, 0.8)";
  popupBlockButton.style.cursor = "pointer";
  popupBlockButton.textContent = "Manage Blocklist";
  popupBlockButton.onclick = () => chrome.runtime.openOptionsPage();
}

function setSuccessState(domain) {
  currentURLInPopUp = domain;
  websiteDisplay.textContent = domain;
  faviconDisplay.src = `https://www.google.com/s2/favicons?domain=${domain}`;

  checkIfAlreadyBlocked(domain, function (isBlocked) {
    if (isBlocked) {
      showAlreadyBlocked();
    } else {
      enableBlockButton();
    }
  });
}

function setErrorState(message) {
  websiteDisplay.textContent = message;
  faviconDisplay.src = "https://www.google.com/s2/favicons?domain=google.com";

  popupBlockButton.disabled = true;
  popupBlockButton.style.backgroundColor = "lightgrey";
  popupBlockButton.style.cursor = "not-allowed";
  popupBlockButton.textContent = "Block This Site";
  popupBlockButton.onclick = null;
}

function showAlreadyBlocked() {
  popupBlockButton.textContent = "Already Blocked";
  popupBlockButton.style.backgroundColor = "#ff6b6b";
  popupBlockButton.disabled = true;
  popupBlockButton.style.cursor = "not-allowed";
}

function enableBlockButton() {
  popupBlockButton.textContent = "Block This Site";
  popupBlockButton.style.backgroundColor = "rgba(255, 69, 96, 0.8)";
  popupBlockButton.disabled = false;
  popupBlockButton.style.cursor = "pointer";
  popupBlockButton.onclick = () => addToBlockList(currentURLInPopUp);
}

function addToBlockList(domain) {
  if (!domain) return;

  popupBlockButton.disabled = true;
  popupBlockButton.textContent = "Blocking...";

  chrome.storage.local.get("gogginsBlocked", function (data) {
    if (chrome.runtime.lastError) {
      console.error("Storage error:", chrome.runtime.lastError);
      enableBlockButton();
      return;
    }

    try {
      const oldBlockedList = JSON.parse(data.gogginsBlocked || "[]");

      const normalizedDomain = normalizeDomain(domain);
      const isDuplicate = oldBlockedList.some(
        (site) => normalizeDomain(site) === normalizedDomain
      );

      if (isDuplicate) {
        showAlreadyBlocked();
        return;
      }

      const newBlockedList = [...oldBlockedList, normalizedDomain];

      chrome.storage.local.set(
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
