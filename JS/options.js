class ItemList {
  constructor(list) {
    this.blockedList = list;
    this.app = this.getElement('#root-options');
    this.list = this.createElement('ul', 'list');
    this.form = this.getElement('#options-form');
    this.input = this.getElement('#option-input');

    this.onSubmit = this.onSubmit.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
    this.form.onsubmit = this.onSubmit;

    this.app.append(this.list);

    this.displayList(this.blockedList);
  }

  // Small function to create HTML element
  createElement(tag, className) {
    const element = document.createElement(tag);
    if (className) element.classList.add(className);
    return element;
  }

  // Small function to retrieve item from DOM
  getElement(selector) {
    const element = document.querySelector(selector);
    return element;
  }

  // Loop through current block list and crrate an LI element with favicon etc for each and attach to the DOM
  displayList(blockedList) {
    while (this.list.firstChild) {
      this.list.removeChild(this.list.firstChild);
    }

    if (blockedList.length === 0) {
      const p = this.createElement('p', 'empty-blocked-list');
      p.textContent = 'Nothing here yet!';
      this.list.append(p);
    } else {
      blockedList.forEach((item) => {
        const li = this.createElement('li', 'blocked-list-item');
        li.id = item;
        const span = this.createElement('span', 'blocker-list-text');
        span.textContent = item;
        const image = this.createElement('img', 'blocker-list-img');
        const deleteButton = this.createElement('button', 'blocker-list-button');
        image.src = `https://www.google.com/s2/favicons?domain=${item}`;
        deleteButton.textContent = '-';
        deleteButton.onclick = () => this.deleteItem(item);
        li.append(image, span, deleteButton);
        this.list.append(li);
      });
    }
  }

  // Loop through exisitig storage list and remove item matching url
  deleteItem(id) {
    const updatedBlockedList = this.blockedList.filter((item) => {
      return item !== id;
    });
    chrome.storage.sync.set({ gogginsBlocked: JSON.stringify(updatedBlockedList) }, function () {});
    this.blockedList = updatedBlockedList;
    this.displayList(this.blockedList);
  }

  // Add new item to blocked list and chrome storage
  addNewItem(newItem) {
    this.blockedList = this.blockedList.concat(newItem);

    chrome.storage.sync.set({ gogginsBlocked: JSON.stringify(this.blockedList) }, function () {});

    this.displayList(this.blockedList);
    this.input.style.border = '1px solid rgb(230, 230, 230)';
    this.input.placeholder = 'Add Website to Blocklist eg. instagram.com';
    this.input.value = '';
  }

  // On submit, check validity of URL and pre-existence
  onSubmit(e) {
    e.preventDefault();
    if (this.checkURLRepetition(this.input.value)) {
      this.input.value = '';
      this.input.placeholder = 'URL already blocked';
      this.input.style.border = '1px solid red';
      this.input.blur();
    } else {
      if (this.validateURL(this.input.value)) {
        this.addNewItem(this.input.value);
      } else {
        this.input.value = '';
        this.input.placeholder = 'Invaild URL';
        this.input.style.border = '1px solid red';
        this.input.blur();
      }
    }
  }

  // Regex to check input is valid URL
  validateURL(url) {
    const urlRegex =
      /(([\w]+:)?\/\/)?(([\d\w]|%[a-fA-f\d]{2,2})+(:([\d\w]|%[a-fA-f\d]{2,2})+)?@)?([\d\w][-\d\w]{0,253}[\d\w]\.)+[\w]{2,63}(:[\d]+)?(\/([-+_~.\d\w]|%[a-fA-f\d]{2,2})*)*(\?(&?([-+_~.\d\w]|%[a-fA-f\d]{2,2})=?)*)?(#([-+_~.\d\w]|%[a-fA-f\d]{2,2})*)?/;

    if (urlRegex.test(url)) {
      return true;
    } else {
      return false;
    }
  }

  // Check if submitted URL already exists
  checkURLRepetition(url) {
    let repeated = false;
    for (let i = 0; i < this.blockedList.length; i++) {
      if (this.blockedList[i].includes(url)) {
        repeated = true;
      }
    }
    return repeated;
  }
}

// Get latest iteration from chrome storage and pass it to the consturctor of the list, attaching to the DOM.
chrome.storage.sync.get('gogginsBlocked', function (data) {
  const app = new ItemList(JSON.parse(data.gogginsBlocked));
});
