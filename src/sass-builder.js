/* eslint max-len: "off" */

import autoprefixer from 'autoprefixer';
import cloneDeep from 'lodash/cloneDeep';
import fs from 'fs';
import isEmpty from 'lodash/isEmpty';
import path from 'path';
import postcss from 'postcss';
import sass from 'sass.js';

import CssUrlRewriter from 'css-url-rewrite-tools/CssUrlRewriter';
import CssAssetCopier from 'css-url-rewrite-tools/CssAssetCopier';

import resolvePath from './resolve-path';

function cssInject(css) {
  const style = document.createElement('style');
  style.type = 'text/css';
  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
  const head = document.head || document.getElementsByTagName('head')[0];
  head.appendChild(style);
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
  return path.sep === '/' ? `/${address}` : address.replace(/\//g, '\\');
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
  const pluginOptions = System.sassPluginOptions || {};

  async function compile(load) {
    const urlBase = `${path.dirname(load.address)}/`;
    let options = {};
    if (pluginOptions.sassOptions) {
      options = cloneDeep(pluginOptions.sassOptions);
    }
    options.style = sass.style.compressed;
    options.indentedSyntax = load.address.endsWith('.sass');
    options.importer = { urlBase };
    // Occurs on empty files
    if (isEmpty(load.source)) {
      return '';
    }
    let { status, text, formatted } = await new Promise(resolve => {  // eslint-disable-line
      sass.compile(load.source, options, resolve);
    });
    if (status !== 0) {
      throw formatted;
    }
    if (pluginOptions.rewriteUrl) {
      const urlRewriter = new CssUrlRewriter({ root: System.baseURL });
      text = urlRewriter.rewrite(load.address, text);
      if (pluginOptions.copyAssets) {
        const copyTarget = path.dirname(compileOpts.outFile);
        const copier = new CssAssetCopier(copyTarget);
        await copier.copyAssets(urlRewriter.getLocalAssetList());
      }
    }
    if (pluginOptions.autoprefixer) {
      const { css } = await postcss([autoprefixer]).process(text);
      return css;
    }
    return text;
  }
  // Keep style order
  const styles = [];
  for (const load of loads) {
    styles.push(await compile(load));
  }
  return [
    `(${cssInject.toString()})`,
    `(${JSON.stringify(styles.join(''))});`,
  ].join('\n');
}
