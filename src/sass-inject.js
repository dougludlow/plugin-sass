import 'fetch';
import url from 'url';
import sass from 'sass.js';
import fs from 'fs';

let urlBase;

// intercept file loading requests (@import directive) from libsass
sass.importer((request, done) => {
  const importUrl = url.resolve(urlBase, request.current + '.scss');
  fetch(importUrl)
    .then(response => response.text())
    .then(content => done({ content }));
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
            let url = urlBase.slice('file://'.length);
            fs.readFile(url, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(data);
                }
            });
        }).then(compile);
    }
    else {
        // fetch initial scss file
        return fetch(urlBase)
        .then(response => response.text())
        .then(compile);
    }
};

export default scssFetch;
