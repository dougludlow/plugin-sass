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
sass.importer(async (request, done) => {
  // Currently only supporting scss imports due to
  // https://github.com/sass/libsass/issues/1695
  let content;
  let resolved;
  let readImportPath;
  let readPartialPath;
  try {
    resolved = await resolvePath(request);
    const partialUrl = resolved.replace(/\/([^/]*)$/, '/_$1');
    readImportPath = fromFileURL(resolved);
    readPartialPath = fromFileURL(partialUrl);
    content = await loadFile(readPartialPath);
  } catch (e) {
    try {
      content = await loadFile(readImportPath);
    } catch (er) {
      done();
      return;
    }
  }
  done({ content, path: resolved });
});

export default async function sassBuilder(loads, compileOpts) {
  async function compile(load) {
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
      return '';
    }
    const { status, text, formatted } = await new Promise(resolve => {
      sass.compile(load.source, options, resolve);
    });
    if (status !== 0) {
      throw formatted;
    }
    if (!isUndefined(System.sassPluginOptions) &&
        System.sassPluginOptions.autoprefixer) {
      const { css } = await postcss([autoprefixer]).process(text);
      return css;
    }
    return text;
  }
  const stubDefines = loads.map(({ name }) =>
    `${(compileOpts.systemGlobal || 'System')}\.register('${name}', [], false, function() {});`
  ).join('\n');
  // Keep style order
  const styles = [];
  for (const load of loads) {
    styles.push(await compile(load));
  }
  return [
    stubDefines,
    cssInject,
    `("${escape(styles.reverse().join(''))}");`,
  ].join('\n');
}
