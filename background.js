chrome.runtime.onInstalled.addListener(function (details) {
  console.log("Goggins Blocker installed/updated:", details.reason);

  chrome.storage.sync.set({ gogginsBlocked: "[]" }, function () {
    if (chrome.runtime.lastError) {
      console.error("Failed to initialize storage:", chrome.runtime.lastError);
      return;
    }
    console.log("Storage initialized successfully");
  });

  if (details.reason === "install") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "/ICONS/icon48.png",
      title: "Goggins Blocker Installed",
      message:
        "Ready to help you stay focused! Click the extension icon to start blocking distracting sites.",
    });
  }
});

chrome.storage.onChanged.addListener(function (changes, areaName) {
  if (areaName === "sync" && changes.gogginsBlocked) {
    console.log("Blocked sites updated:", changes.gogginsBlocked.newValue);
  }
});
