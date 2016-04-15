/* eslint max-len: "off" */
import autoprefixer from 'autoprefixer';
import cloneDeep from 'lodash/cloneDeep';
import fs from 'fs';
import isEmpty from 'lodash/isEmpty';
import isUndefined from 'lodash/isUndefined';
import path from 'path';
import postcss from 'postcss';
import sass from 'sass.js';

import resolvePath from './resolve-path';

const cssInject = "(function(c){if (typeof document == 'undefined') return; var d=document,a='appendChild',i='styleSheet',s=d.createElement('style');s.type='text/css';d.getElementsByTagName('head')[0][a](s);s[i]?s[i].cssText=c:s[a](d.createTextNode(c));})";
const isWin = process.platform.match(/^win/);

function escape(source) {
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
}

function loadFile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, { encoding: 'UTF-8' }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function fromFileURL(url) {
  const address = decodeURIComponent(url.replace(/^file:(\/+)?/i, ''));
  return !isWin ? `/${address}` : address.replace(/\//g, '\\');
}

// intercept file loading requests (@import directive) from libsass
sass.importer((request, done) => {
  // Currently only supporting scss imports due to
  // https://github.com/sass/libsass/issues/1695
  let content;
  let resolved;
  let readImportPath;
  let readPartialPath;
  resolvePath(request)
    .then(importUrl => {
      resolved = importUrl;
      const partialUrl = importUrl.replace(/\/([^/]*)$/, '/_$1');
      readImportPath = fromFileURL(importUrl);
      readPartialPath = fromFileURL(partialUrl);
      return loadFile(readPartialPath);
    })
    .then(data => {
      content = data;
      return data;
    })
    .catch(() => loadFile(readImportPath))
    .then(data => {
      content = data;
    })
    .then(() => done({ content, path: resolved }))
    .catch(() => done());
});

export default function sassBuilder(loads, compileOpts) {
  function compilePromise(load) {
    return new Promise((resolve, reject) => {
      const urlBase = `${path.dirname(load.address)}/`;
      let options = {};
      if (!isUndefined(System.sassPluginOptions) &&
          !isUndefined(System.sassPluginOptions.sassOptions)) {
        options = cloneDeep(System.sassPluginOptions.sassOptions);
      }
      options.style = sass.style.compressed;
      options.indentedSyntax = load.address.endsWith('.sass');
      options.importer = { urlBase };
      // Occurs on empty files
      if (isEmpty(load.source)) {
        resolve('');
        return;
      }
      sass.compile(load.source, options, ({ status, text, formatted }) => {
        if (status === 0) {
          if (!isUndefined(System.sassPluginOptions) &&
              System.sassPluginOptions.autoprefixer) {
            postcss([autoprefixer]).process(text).then(({ css }) => {
              resolve(css);
            });
          } else {
            resolve(text);
          }
        } else {
          reject(formatted);
        }
      });
    });
  }
  const stubDefines = loads.map(load =>
    `${(compileOpts.systemGlobal || 'System')}\.register('${load.name}', [], false, function() {});`
  ).join('\n');
  return new Promise((resolve, reject) => {
    // Keep style order
    Promise.all(loads.map(compilePromise))
    .then(
      response => resolve([stubDefines, cssInject, `("${escape(response.reverse().join(''))}");`].join('\n')),
      reason => reject(reason));
  });
}
