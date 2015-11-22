import fs from 'fs';
import querystring from 'querystring';
import sass from 'sass.js';
import url from 'url';

const cssInject = "(function(c){var d=document,a='appendChild',i='styleSheet',s=d.createElement('style');s.type='text/css';d.getElementsByTagName('head')[0][a](s);s[i]?s[i].cssText=c:s[a](d.createTextNode(c));})";

let urlBase;

const escape = source => {
  return source
    .replace(/(["\\])/g, '\\$1')
    .replace(/[\f]/g, '\\f')
    .replace(/[\b]/g, '\\b')
    .replace(/[\n]/g, '\\n')
    .replace(/[\t]/g, '\\t')
    .replace(/[\r]/g, '\\r')
    .replace(/[\ufeff]/g, '')
    .replace(/[\u2028]/g, '\\u2028')
    .replace(/[\u2029]/g, '\\u2029');
};

const loadFile = path => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, {encoding: 'UTF-8'}, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

const parseUnescape = uri => {
  // Node doesn't understand Windows' local file urls
  return (uri.match(/^file:\/\/\//)) ? uri.replace(/^file:\/\/\//, '') : querystring.unescape(url.parse(uri).path);
}

// intercept file loading requests (@import directive) from libsass
sass.importer((request, done) => {
  // Currently only supporting scss imports due to
  // https://github.com/sass/libsass/issues/1695
  const importUrl = url.resolve(urlBase, `${request.current}.scss`);
  const partialUrl = importUrl.replace(/\/([^/]*)$/, '/_$1');
  const readImportPath = parseUnescape(importUrl);
  const readPartialPath = parseUnescape(partialUrl);
  let content;
  loadFile(readPartialPath)
    .then(data => content = data)
    .catch(() => loadFile(readImportPath))
    .then(data => content = data)
    .then(() => done({ content }));
});

export default (loads, compileOpts) => {
  const stubDefines = loads.map(load => {
    return `${(compileOpts.systemGlobal || 'System')}\.register('${load.name}', [], false, function() {});`;
  }).join('\n');

  const compilePromise = load => {
    return new Promise((resolve, reject) => {
      urlBase = load.address;
      const options = {
        style: sass.style.compressed,
        indentedSyntax: urlBase.endsWith('.sass'),
      };
      sass.compile(load.source, options, result => {
        if (result.status === 0) {
          resolve(result.text);
        } else {
          reject(result.formatted);
        }
      });
    });
  };
  return new Promise((resolve, reject) => {
    // Keep style order
    Promise.all(loads.map(compilePromise))
    .then(
      response => resolve([stubDefines, cssInject, `("${escape(response.reverse().join(''))}");`].join('\n')),
      reason => reject(reason));
  });
};
