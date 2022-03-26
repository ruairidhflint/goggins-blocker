const optionsURL = chrome.runtime.getURL('/HTML/options.html');
const optionsLinkDOM = document.getElementById('options-link');

// On redirect to Blocked page, add link to options page dynamically (not possible with pure HTML)
document.addEventListener('DOMContentLoaded', () => {
  optionsLinkDOM.href = optionsURL;
  optionsLinkDOM.textContent = 'Goggins Blocker.';
});
