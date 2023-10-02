const LOCAL_STORAGE_KEY = 'styles';
const LOCAL_STYLES_URL = '/styles.css';
const GITHUB_STYLES_URL_PREFIX = 'https://raw.githubusercontent.com/';
const GITHUB_STYLES_URL_SUFFIX = `/editable-style/master/styles.css`;
const GITHUB_IO_HOSTNAME_SUFFIX = 'github.io';

const style = document.querySelector('style');

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


const saveLocalStyles = styles => {
  window.localStorage.setItem(LOCAL_STORAGE_KEY, styles);
};

const loadLocalStyles = () => {
  style.innerText = window.localStorage.getItem(LOCAL_STORAGE_KEY);
};

style.addEventListener('input', debounce(() => saveLocalStyles(style.innerText), 500));

const getDefaultStylesURL = () => {
  const { hostname } = window.location;

  if (hostname.endsWith(GITHUB_IO_HOSTNAME)) {
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

        saveLocalStyles(result);
      });
  }

  loadLocalStyles();
};

init();
