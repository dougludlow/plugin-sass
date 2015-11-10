import 'fetch';
import './modernizr';
import fs from 'fs';
import url from 'url';

let urlBase;

const importSass = new Promise((resolve, reject) => {
  if (Modernizr.webworkers) {
    System.import('sass.js/dist/sass', __moduleName).then(Sass => {
      resolve(new Sass());
    }).catch(err => reject(err));
  } else {
    System.import('sass.js/dist/sass.sync', __moduleName).then(Sass => {
      resolve(Sass);
    });
  }
});

const loadFile = loadUrl => {
  return fetch(loadUrl)
    .then(response => {
      if (response.status === 404) {
        throw new Error('Not found');
      }
      return response.text();
    });
};

// intercept file loading requests (@import directive) from libsass
importSass.then(sass => {
  sass.importer((request, done) => {
    const { current } = request;

    const importUrl = url.resolve(urlBase, `${current}.scss`);
    const partialUrl = importUrl.replace(/\/([^/]*)$/, '/_$1');

    let content;
    loadFile(partialUrl)
      .then(data => content = data)
      .catch(() => loadFile(importUrl))
      .then(data => content = data)
      .then(() => done({ content }));
  });
});


const compile = scss => {
  return new Promise((resolve, reject) => {
    importSass.then(sass => {
      sass.compile(scss, result => {
        if (result.status === 0) {
          const style = document.createElement('style');
          style.textContent = result.text;
          style.setAttribute('type', 'text/css');
          document.getElementsByTagName('head')[0].appendChild(style);
          resolve('');
        } else {
          reject(result.formatted);
        }
      });
    });
  });
};

export default load => {
  urlBase = load.address;
  if (urlBase.startsWith('file://')) {
    return new Promise(resolve => {
      const slicedUrl = urlBase.slice('file://'.length);
      // at Cordova runtime only readFileSync() is available
      const data = fs.readFileSync(slicedUrl);
      resolve(data);
    }).then(compile);
  }
  // fetch initial scss file
  return fetch(urlBase)
    .then(response => response.text())
    .then(compile);
};
