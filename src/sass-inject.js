import 'fetch';
import url from 'url';
import sass from 'sass.js';
import fs from 'fs';

let urlBase;

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
sass.importer((request, done) => {
  const { current } = request;

  const importUrl = url.resolve(urlBase, `${current}.scss`);
  const partialUrl = importUrl.replace(/\/([^/]*)$/, '/_$1');

  let content;
  loadFile(partialUrl)
    .then(data => content = data)
    .catch(() => loadFile(importUrl))
    .then(data => content = data)
    .then(() => done({ content }))
});

const compile = scss => {
  return new Promise((resolve, reject) => {
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
};

const scssFetch = load => {
  urlBase = load.address;
  if (urlBase.indexOf('file://') > -1) {
    return new Promise((resolve, reject) => {
      const slicedUrl = urlBase.slice('file://'.length);
      fs.readFile(slicedUrl, 'utf8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    }).then(compile);
  }
  // fetch initial scss file
  return fetch(urlBase)
    .then(response => response.text())
    .then(compile);
};

export default scssFetch;
