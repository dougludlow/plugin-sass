import fs from 'fs';
import path from 'path';
import sass from 'sass.js';

import CssAssetCopier from 'css-asset-copier';

import resolvePath from './resolve-path';

function injectStyle(css) {
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

function stringifyStyle(css, minify) {
  if (minify) {
    return JSON.stringify(css);
  }

  const code = css.split(/(\r\n|\r|\n)/)
    .map(line => JSON.stringify(`${line.trimRight()}`))
    .filter(line => line !== '""')
    .join(',\n');

  return `[\n${code}\n].join('\\n')`;
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

export default async function sassBuilder(loads, compileOpts, outputOpts) {
  const pluginOptions = System.sassPluginOptions || {};

  async function compile(load) {
    // skip empty files
    if (!load.source || load.source === '') {
      return '';
    }

    // compile module
    const urlBase = `${path.dirname(load.address)}/`;
    let options = {};
    if (pluginOptions.sassOptions) {
      options = Object.assign({}, pluginOptions.sassOptions);
    }
    options.style = compileOpts.minify ? sass.style.compressed : sass.style.expanded;
    options.indentedSyntax = load.address.endsWith('.sass');
    options.importer = { urlBase };
    let { status, text, formatted } = await new Promise(resolve => {  // eslint-disable-line
      sass.compile(load.source, options, resolve);
    });
    if (status !== 0) {
      throw formatted;
    }

    // rewrite urls and copy assets if enabled
    if (pluginOptions.rewriteUrl) {
      const CssUrlRewriterModule = await System.import('css-url-rewriter-ex', __moduleName);
      const CssUrlRewriter = CssUrlRewriterModule.default;
      const urlRewriter = new CssUrlRewriter({ root: System.baseURL });
      text = urlRewriter.rewrite(load.address, text);
      if (pluginOptions.copyAssets) {
        const copyTarget = path.dirname(compileOpts.outFile);
        const copier = new CssAssetCopier(copyTarget);
        await copier.copyAssets(urlRewriter.getLocalAssetList());
      }
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

    return text;
  }

  // compile and merge styles for each module
  let styles = [];
  for (const load of loads) {
    styles.push(await compile(load));
  }
  styles = styles.join('');

  // bundle css in separate file
  if (System.separateCSS) {
    const outFile = path.resolve(outputOpts.outFile).replace(/\.js$/, '.css');
    fs.writeFileSync(outFile, styles);
    return '';
  }

  // bundle inline css
  return [
    `(${injectStyle.toString()})`,
    `(${stringifyStyle(styles, compileOpts.minify)});`,
  ].join('\n');
}
