const LOCAL_STORAGE_KEY = 'styles';
const LOCAL_STYLES_URL = '/styles.css';
const GITHUB_STYLES_URL_PREFIX = 'https://raw.githubusercontent.com/';
const GITHUB_STYLES_URL_SUFFIX = `/editable-style/master/styles.css`;
const GITHUB_IO_HOSTNAME_SUFFIX = 'github.io';

const style = document.querySelector('style');
const main = document.querySelector('main');

ReadableStream.prototype[Symbol.asyncIterator] = async function* () {
  const reader = this.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        return;
      }

      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

const debounce = (callback, timeout) => {
  let timer;

  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => callback(...args), timeout);
  };
};

const isStyleElementVisible = () => {
  const { clientWidth, clientHeight } = style;
  return (clientWidth + clientHeight) > 0;
};

const loadLocalStyles = () => {
  style.innerText = window.localStorage.getItem(LOCAL_STORAGE_KEY);
};

const saveLocalStyles = (styles, force = false) => {
  if (isStyleElementVisible() || force) {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, styles);
  }
};

const autoSave = debounce(() => saveLocalStyles(style.innerText));

style.addEventListener('input', () => {
  autoSave();

  if (!isStyleElementVisible()) {
    const undoButton = document.createElement('button');
    undoButton.innerText = 'Undo';
    undoButton.style.width = '8rem';
    undoButton.style.margin = '1rem';
    undoButton.style.padding = '0.5rem';

    undoButton.onclick = () => {
      loadLocalStyles();
      document.body.removeChild(undoButton);
    };

    document.body.appendChild(undoButton);
  }
}, 500);

const getDefaultStylesURL = () => {
  const { hostname } = window.location;

  if (hostname.endsWith(GITHUB_IO_HOSTNAME_SUFFIX)) {
    const [username] = hostname.split('.');
    return `${GITHUB_STYLES_URL_PREFIX}${username}${GITHUB_STYLES_URL_SUFFIX}`;
  }
  return LOCAL_STYLES_URL;
};

const init = async () => {
  const localStyles = window.localStorage.getItem(LOCAL_STORAGE_KEY);

  if (!localStyles) {
    await fetch(getDefaultStylesURL())
      .then(response => response.body)
      .then(async body => {
        let result = '';

        for await (const chunk of body) {
          chunk.forEach(charCode => result += String.fromCharCode(charCode));
        }

        saveLocalStyles(result, true);
      });
  }

  loadLocalStyles();
};

init();
