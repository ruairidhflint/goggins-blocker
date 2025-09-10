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
  if (!domain) return "";

  // Convert to lowercase and remove www. prefix for comparison
  let normalized = domain.toLowerCase().trim();

  // Remove www. prefix if present
  if (normalized.startsWith("www.")) {
    normalized = normalized.substring(4);
  }

  return normalized;
}

function checkIfBlocked() {
  const currentDomain = extractDomain(window.location.href);

  if (!currentDomain) {
    return;
  }

  chrome.storage.local.get("gogginsBlocked", function (data) {
    if (chrome.runtime.lastError) {
      console.error("Storage error:", chrome.runtime.lastError);
      return;
    }

    try {
      const blockedSites = JSON.parse(data.gogginsBlocked || "[]");

      for (const blockedSite of blockedSites) {
        const normalizedBlocked = normalizeDomain(blockedSite);
        const normalizedCurrent = normalizeDomain(currentDomain);

        if (normalizedCurrent === normalizedBlocked) {
          console.log(
            "Blocking site:",
            currentDomain,
            "matches blocked site:",
            blockedSite
          );
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
