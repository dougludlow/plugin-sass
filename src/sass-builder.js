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

// intercept file loading requests (@import directive) from libsass
sass.importer((request, done) => {
  const importUrl = url.resolve(urlBase, `${request.current}.scss`);
  const partialUrl = importUrl.replace(/\/([^/]*)$/, '/_$1');

  const readImportPath = querystring.unescape(url.parse(importUrl).path);
  const readPartialPath = querystring.unescape(url.parse(partialUrl).path);

  let content;
  loadFile(readPartialPath)
    .then(data => content = data)
    .catch(() => loadFile(readImportPath))
    .then(data => content = data)
    .then(() => done({ content }))
});

export default (loads, compileOpts) => {
  return new Promise((resolve, reject) => {
    loads.forEach((load) => {
      // TODO Support different load addresses
      urlBase = load.address;
    });
    const stubDefines = loads.map(load => {
      return `${(compileOpts.systemGlobal || 'System')}\.register('${load.name}', [], false, function() {});`;
    }).join('\n');
    const scss = loads.map(load => {
      return load.source;
    }).reduce((sourceA, sourceB) => {
      return sourceA + sourceB;
    });
    const options = {
      style: sass.style.compressed,
    };
    sass.compile(scss, options, result => {
      if (result.status === 0) {
        resolve([stubDefines, cssInject, `("${escape(result.text)}");`].join('\n'));
      } else {
        reject(result.formatted);
      }
    });
  });
};
