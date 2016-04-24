/* global Modernizr __moduleName */

import './modernizr';

import autoprefixer from 'autoprefixer';
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';
import isUndefined from 'lodash/isUndefined';
import path from 'path';
import postcss from 'postcss';
import reqwest from 'reqwest';
import url from 'url';

import resolvePath from './resolve-path';

const importSass = new Promise(async resolve => {
  if (Modernizr.webworkers) {
    const Sass = await System.import('sass.js/dist/sass', __moduleName);
    const worker = await System.normalize('sass.js/dist/sass.worker', __moduleName);
    resolve(new Sass(worker));
  } else {
    const Sass = await System.import('sass.js/dist/sass.sync', __moduleName);
    resolve(Sass);
  }
});

async function sassImporter(request, done) {
  let resolved;
  let content;
  try {
    // Currently only supporting scss imports due to
    // https://github.com/sass/libsass/issues/1695
    resolved = await resolvePath(request);
    const partialPath = resolved.replace(/\/([^/]*)$/, '/_$1');
    const resp = await reqwest(partialPath);
    // In Cordova Apps the response is the raw XMLHttpRequest
    content = resp.responseText ? resp.responseText : resp;
  } catch (e) {
    try {
      const resp = await reqwest(resolved);
      content = resp.responseText ? resp.responseText : resp;
    } catch (er) {
      done();
      return;
    }
  }
  done({ content, path: resolved });
}

// intercept file loading requests (@import directive) from libsass
importSass.then(sass => {
  sass.importer(sassImporter);
});

async function compile(scss, styleUrl) {
  const content = scss.content;
  const responseText = content.responseText;
  if (isString(content) && isEmpty(content) ||
      !isUndefined(responseText) && isEmpty(responseText)) {
    return '';
  }
  const sass = await importSass;

  function tryCleanup() {
    const element = document.querySelector(`style[data-url="${styleUrl}"]`);
    if (element) {
      element.parentElement.removeChild(element);
    }
  }

  function inject(css) {
    tryCleanup();
    const style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-url', styleUrl);
    style.textContent = css;
    document.getElementsByTagName('head')[0].appendChild(style);
  }
  const { status, text, formatted } = await new Promise(res => {
    sass.compile(content, scss.options, res);
  });
  if (status !== 0) {
    throw formatted;
  }
  if (!isUndefined(System.sassPluginOptions) &&
      System.sassPluginOptions.autoprefixer) {
    const { css } = await postcss([autoprefixer]).process(text);
    inject(css);
  } else {
    inject(text);
  }
  // return an empty module in the module pipeline itself
  return '';
}

export default async function sassInject(load) {
  let basePath = path.dirname(url.parse(load.address).pathname);
  if (basePath !== '/') {
    basePath += '/';
  }
  const urlBase = basePath;
  const indentedSyntax = load.address.endsWith('.sass');
  let options = {};
  if (!isUndefined(System.sassPluginOptions) &&
      !isUndefined(System.sassPluginOptions.sassOptions)) {
    options = System.sassPluginOptions.sassOptions;
  }
  options.indentedSyntax = indentedSyntax;
  options.importer = { urlBase };
  // load initial scss file
  const resp = await reqwest(load.address);
  // In Cordova Apps the response is the raw XMLHttpRequest
  const scss = {
    content: resp.responseText ? resp.responseText : resp,
    options,
  };
  return compile(scss, load.address);
}
