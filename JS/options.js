class ItemList {
  constructor(list) {
    this.blockedList = list || [];
    this.app = this.getElement("#root-options");
    this.list = this.createElement("ul", "list");
    this.form = this.getElement("#options-form");
    this.input = this.getElement("#option-input");

    this.onSubmit = this.onSubmit.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
    this.exportData = this.exportData.bind(this);
    this.importData = this.importData.bind(this);

    this.form.onsubmit = this.onSubmit;
    this.app.append(this.list);
    this.setupExportImport();
    this.displayList(this.blockedList);
  }

  createElement(tag, className) {
    const element = document.createElement(tag);
    if (className) element.classList.add(className);
    return element;
  }

  getElement(selector) {
    return document.querySelector(selector);
  }

  normalizeDomain(domain) {
    if (!domain) return "";

    // Convert to lowercase and remove www. prefix for comparison
    let normalized = domain.toLowerCase().trim();

    // Remove www. prefix if present
    if (normalized.startsWith("www.")) {
      normalized = normalized.substring(4);
    }

    return normalized;
  }

  validateURL(url) {
    if (!url || typeof url !== "string") return false;

    const trimmedUrl = url.trim();
    if (!trimmedUrl) return false;

    // More comprehensive domain validation
    const domainRegex =
      /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

    // Check length constraints
    if (trimmedUrl.length > 253) return false;

    // Check for valid domain format
    if (!domainRegex.test(trimmedUrl)) return false;

    // Additional checks for common issues
    if (
      trimmedUrl.includes("..") ||
      trimmedUrl.startsWith(".") ||
      trimmedUrl.endsWith(".")
    )
      return false;

    return true;
  }

  extractDomain(input) {
    try {
      if (input.startsWith("http://") || input.startsWith("https://")) {
        const url = new URL(input);
        return url.hostname.replace(/^www\./, "");
      }

      return input.replace(/^www\./, "");
    } catch (error) {
      return input.replace(/^www\./, "");
    }
  }

  setupExportImport() {
    const controlsContainer = this.createElement("div", "controls-container");

    const exportBtn = this.createElement("button", "export-btn");
    exportBtn.textContent = "Export Blocked Sites";
    exportBtn.type = "button";
    exportBtn.onclick = this.exportData;

    const importBtn = this.createElement("button", "import-btn");
    importBtn.textContent = "Import Blocked Sites";
    importBtn.type = "button";

    const fileInput = this.createElement("input", "import-input");
    fileInput.type = "file";
    fileInput.accept = ".json";
    fileInput.style.display = "none";
    fileInput.onchange = this.importData;

    importBtn.onclick = () => fileInput.click();

    const clearBtn = this.createElement("button", "clear-btn");
    clearBtn.textContent = "Clear All";
    clearBtn.type = "button";
    clearBtn.onclick = () => this.clearAll();

    controlsContainer.append(exportBtn, importBtn, fileInput, clearBtn);
    this.app.insertBefore(controlsContainer, this.app.firstChild);
  }

  displayList(blockedList) {
    while (this.list.firstChild) {
      this.list.removeChild(this.list.firstChild);
    }

    if (blockedList.length === 0) {
      const p = this.createElement("p", "empty-blocked-list");
      p.textContent = "Nothing here yet! Add some sites to block.";
      this.list.append(p);
    } else {
      blockedList.forEach((item) => {
        const li = this.createElement("li", "blocked-list-item");
        li.id = item;

        const image = this.createElement("img", "blocker-list-img");
        image.src = `https://www.google.com/s2/favicons?domain=${item}`;
        image.onerror = () => {
          image.src = "https://www.google.com/s2/favicons?domain=google.com";
        };

        const span = this.createElement("span", "blocker-list-text");
        span.textContent = item;

        const deleteButton = this.createElement(
          "button",
          "blocker-list-button"
        );
        deleteButton.textContent = "×";
        deleteButton.title = `Remove ${item}`;
        deleteButton.onclick = () => this.deleteItem(item);

        li.append(image, span, deleteButton);
        this.list.append(li);
      });
    }
  }

  deleteItem(id) {
    const updatedBlockedList = this.blockedList.filter((item) => item !== id);
    this.updateStorage(updatedBlockedList, () => {
      this.blockedList = updatedBlockedList;
      this.displayList(this.blockedList);
      this.showMessage(`Removed ${id} from blocked list`, "success");
    });
  }

  addNewItem(newItem) {
    try {
      // Normalize the domain before adding
      const normalizedItem = this.normalizeDomain(this.extractDomain(newItem));

      // Check if already exists (case-insensitive)
      const exists = this.blockedList.some(
        (item) => this.normalizeDomain(item) === normalizedItem
      );

      if (exists) {
        this.showMessage("Domain already blocked", "error");
        return;
      }

      const updatedList = [...this.blockedList, normalizedItem];

      this.updateStorage(updatedList, () => {
        this.blockedList = updatedList;
        this.displayList(this.blockedList);
        this.resetInput();
        this.showMessage(`Added ${normalizedItem} to blocked list`, "success");
        console.log("Successfully added to block list:", normalizedItem);
      });
    } catch (error) {
      console.error("Error adding new item:", error);
      this.showMessage("Error adding domain", "error");
    }
  }

  updateStorage(list, callback) {
    chrome.storage.local.set({ gogginsBlocked: JSON.stringify(list) }, () => {
      if (chrome.runtime.lastError) {
        console.error("Storage error:", chrome.runtime.lastError);
        this.showMessage("Failed to save changes", "error");
        return;
      }
      if (callback) callback();
    });
  }

  resetInput() {
    this.input.value = "";
    this.input.placeholder = "Add Website to Blocklist eg. instagram.com";
    this.input.style.border = "1px solid rgb(230, 230, 230)";
  }

  showMessage(message, type = "info") {
    if (type === "error") {
      this.input.placeholder = message;
      this.input.style.border = "1px solid #ff6b6b";
    } else {
      const messageEl = this.createElement("div", `message-${type}`);
      messageEl.textContent = message;
      messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === "success" ? "#4CAF50" : "#2196F3"};
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        z-index: 1000;
        font-size: 14px;
      `;
      document.body.appendChild(messageEl);
      setTimeout(() => messageEl.remove(), 3000);
    }
  }

  checkURLRepetition(url) {
    const normalizedUrl = this.normalizeDomain(this.extractDomain(url));
    return this.blockedList.some(
      (item) => this.normalizeDomain(item) === normalizedUrl
    );
  }

  onSubmit(e) {
    e.preventDefault();
    const inputValue = this.input.value.trim();

    if (!inputValue) {
      this.showMessage("Please enter a website", "error");
      return;
    }

    if (!this.validateURL(inputValue)) {
      this.showMessage("Invalid URL format", "error");
      return;
    }

    if (this.checkURLRepetition(inputValue)) {
      this.showMessage("URL already blocked", "error");
      return;
    }

    this.addNewItem(inputValue);
  }

  exportData() {
    chrome.storage.local.get([], () => {
      const exportData = {
        exportDate: new Date().toISOString(),
        version: "1.0",
        blockedSites: this.blockedList,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const a = this.createElement("a");
      a.href = url;
      a.download = `goggins-blocker-export-${
        new Date().toISOString().split("T")[0]
      }.json`;
      a.click();

      URL.revokeObjectURL(url);
      this.showMessage("Data exported successfully", "success");
    });
  }

  importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (!data.blockedSites || !Array.isArray(data.blockedSites)) {
          throw new Error("Invalid file format");
        }

        const validSites = data.blockedSites
          .filter((site) => typeof site === "string" && this.validateURL(site))
          .map((site) => this.normalizeDomain(this.extractDomain(site)));

        const mergedList = [...new Set([...this.blockedList, ...validSites])];

        this.updateStorage(mergedList, () => {
          this.blockedList = mergedList;
          this.displayList(this.blockedList);
          this.showMessage(`Imported ${validSites.length} sites`, "success");
        });
      } catch (error) {
        console.error("Import error:", error);
        this.showMessage("Failed to import file", "error");
      }
    };

    reader.readAsText(file);

    event.target.value = "";
  }

  clearAll() {
    if (confirm("Are you sure you want to remove all blocked sites?")) {
      this.updateStorage([], () => {
        this.blockedList = [];
        this.displayList(this.blockedList);
        this.showMessage("All blocked sites cleared", "success");
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get("gogginsBlocked", function (data) {
    if (chrome.runtime.lastError) {
      console.error("Storage error:", chrome.runtime.lastError);
      new ItemList([]);
      return;
    }

    try {
      const blockedSites = JSON.parse(data.gogginsBlocked || "[]");
      new ItemList(blockedSites);
    } catch (error) {
      console.error("Error parsing blocked sites:", error);
      new ItemList([]);
    }
  });
});
