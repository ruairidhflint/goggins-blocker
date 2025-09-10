chrome.runtime.onInstalled.addListener(async function (details) {
  console.log("Goggins Blocker installed/updated:", details.reason);

  try {
    // Only initialize if storage doesn't already exist
    const existingData = await chrome.storage.local.get("gogginsBlocked");
    if (!existingData.gogginsBlocked) {
      await chrome.storage.local.set({ gogginsBlocked: "[]" });
      console.log("Extension initialized successfully");
    } else {
      console.log("Extension storage already exists");
    }
  } catch (error) {
    console.error("Failed to initialize storage:", error);
  }

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
  if (areaName === "local" && changes.gogginsBlocked) {
    console.log("Blocked sites updated:", changes.gogginsBlocked.newValue);
  }
});
