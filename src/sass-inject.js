import autoprefixer from 'autoprefixer';
import path from 'path';
import reqwest from 'reqwest';
import url from 'url';

import resolvePath from './resolve-path';

function injectStyle(css, address) {
  if (address) {
    const style = document.querySelector(`style[data-url="${address}"]`);
    if (style) {
      style.remove();
    }
  }

  const style = document.createElement('style');
  style.type = 'text/css';

  if (address) {
    style.setAttribute('data-url', address);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }

  const head = document.head || document.getElementsByTagName('head')[0];
  head.appendChild(style);
}

const importSass = new Promise(async (resolve) => {
  if (window.Worker) {
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
  // compile module
  const content = scss.content;
  const responseText = content.responseText;
  if (typeof content === 'string' && content === '' ||
      typeof responseText !== 'undefined' && responseText === '') {
    return '';
  }
  const sass = await importSass;
  let { status, text, formatted } = await new Promise(res => {  // eslint-disable-line
    sass.compile(content, scss.options, res);
  });
  if (status !== 0) {
    throw formatted;
  }

  // rewrite urls and copy assets if enabled
  const pluginOptions = System.sassPluginOptions || {};
  if (pluginOptions.rewriteUrl) {
    const CssUrlRewriterModule = await System.import('css-url-rewriter-ex', __moduleName);
    const CssUrlRewriter = CssUrlRewriterModule.default;
    const urlRewriter = new CssUrlRewriter({ root: System.baseURL });
    text = urlRewriter.rewrite(styleUrl, text);
  }

  // apply autoprefixer if enabled
  if (pluginOptions.autoprefixer) {
    const autoprefixerOptions = pluginOptions.autoprefixer instanceof Object
      ? pluginOptions.autoprefixer
      : undefined;
    const postcss = await System.import('postcss', __moduleName);
    const autoprefixer = await System.import('autoprefixer', __moduleName);
    const { css } = await postcss([autoprefixer(autoprefixerOptions)]).process(text);
    text = css;
  }

  // inject module and remove old module
  injectStyle(text, styleUrl);

  // return an empty module in the module pipeline itself
  return '';
}

export default async function sassInject(load) {
  const pluginOptions = System.sassPluginOptions || {};
  let basePath = path.dirname(url.parse(load.address).pathname);
  if (basePath !== '/') {
    basePath += '/';
  }
  const urlBase = basePath;
  const indentedSyntax = load.address.endsWith('.sass');
  let options = {};
  if (pluginOptions.sassOptions) {
    options = Object.assign({}, pluginOptions.sassOptions);
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
