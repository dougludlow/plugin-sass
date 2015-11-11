import reqwest from 'reqwest';
import url from 'url';
import './modernizr';

let urlBase;

const importSass = new Promise((resolve, reject) => {
  if (Modernizr.webworkers) {
    System.import('sass.js/dist/sass', __moduleName).then(Sass => {
      resolve(new Sass());
    }).catch(err => reject(err));
  } else {
    System.import('sass.js/dist/sass.sync', __moduleName).then(Sass => {
      resolve(Sass);
    }).catch(err => reject(err));
  }
});


// intercept file loading requests (@import directive) from libsass
importSass.then(sass => {
  sass.importer((request, done) => {
    const { current } = request;
    const importUrl = url.resolve(urlBase, `${current}.scss`);
    const partialUrl = importUrl.replace(/\/([^/]*)$/, '/_$1');
    let content;
    reqwest(partialUrl)
      .then(resp => {
        // In Cordova Apps the response is the raw XMLHttpRequest
        content = resp.responseText ? resp.responseText : resp;
        return content;
      })
      .catch(() => reqwest(importUrl))
      .then(resp => {
        content = resp.responseText ? resp.responseText : resp;
        return content;
      })
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
  // load initial scss file
  return reqwest(urlBase)
    // In Cordova Apps the response is the raw XMLHttpRequest
    .then(resp => resp.responseText ? resp.responseText : resp)
    .then(compile);
};
