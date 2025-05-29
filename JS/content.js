const blockedURL = chrome.runtime.getURL("/HTML/blocked.html");

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
  return domain.toLowerCase().replace(/^www\./, "");
}

function checkIfBlocked() {
  const currentDomain = extractDomain(window.location.href);

  if (!currentDomain) {
    return;
  }

  chrome.storage.sync.get("gogginsBlocked", function (data) {
    if (chrome.runtime.lastError) {
      console.error("Storage error:", chrome.runtime.lastError);
      return;
    }

    try {
      const blockedSites = JSON.parse(data.gogginsBlocked || "[]");

      for (const blockedSite of blockedSites) {
        const normalizedBlocked = normalizeDomain(blockedSite);

        if (
          currentDomain === normalizedBlocked ||
          currentDomain.endsWith("." + normalizedBlocked)
        ) {
          window.location.assign(blockedURL);
          return;
        }
      }
    } catch (error) {
      console.error("Error parsing blocked sites:", error);
    }
  });
}

checkIfBlocked();
