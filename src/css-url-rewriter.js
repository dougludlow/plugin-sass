import path from 'path';
import fse from 'fs-extra';

export default class CssUrlRewriter {
  /**
   * Constructor.
   *
   * @param {Object}  loader
   */
  constructor(loader) {
    this.loader = loader;
    this.copyPromises = {};
  }

  /**
   * Rewrite all URLs in source file.
   *
   * @param {Object}  options
   * @prop  {Boolean} copyAssets
   * @prop  {String}  copyTarget
   */
  rewrite(filename, content, options) {
    const copyAssets = options && options.copyAssets;
    const copyTarget = options && options.copyTarget;

    const baseUrl = path.relative(this.loader.baseURL, path.dirname(filename));

    /* eslint-disable */
    const urlRe = /\/\*[\s\S]*?\*\/|\/\[^\r\n]*(?:\r\n|\r|\n|$)|([\s,:])url\(\s*("[^"]+"|'[^']+'|[^)]+)\s*\)/ig;
    /* eslint-enable */

    const promises = [];

    const fixedContent = content.replace(urlRe, (m0, m1, m2) => {
      if (m1 === undefined) {
        // looks like block/line comment is found, so bypass it
        return m0;
      }

      const assetUrl = this.cleanUrl(m2);

      const isDataUrl = assetUrl.startsWith('data:');
      const isAbsUrl = !isDataUrl && path.isAbsolute(assetUrl);
      const isRelUrl = !isDataUrl && !isAbsUrl;

      const fixedAssetUrl = (isAbsUrl || isDataUrl) ? assetUrl : path.join(baseUrl, assetUrl);

      if (isRelUrl && copyAssets) {
        const assetPath = this.getUrlPath(fixedAssetUrl);
        const copyAssetPath = path.join(copyTarget, assetPath);
        if (copyAssetPath !== assetPath) {
          promises.push(this.copyAsset(assetPath, copyAssetPath));
        }
      }

      return `${m1}url("${fixedAssetUrl}")`;
    });

    promises.push(Promise.resolve(fixedContent));

    return Promise.all(promises);
  }

  copyAsset(fromPath, toPath) {
    if (this.copyPromises[toPath]) {
      return this.copyPromises[toPath];
    }

    const promise = new Promise((resolve, reject) => {
      fse.copy(fromPath, toPath, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    this.copyPromises[toPath] = promise;

    return promise;
  }

  getUrlPath(url) {
    return url.replace(/[#?].*$/, '');
  }

  cleanUrl(url) {
    let result = url;

    if ((url.startsWith('"') && url.endsWith('"'))
      || (url.startsWith("'") && url.endsWith("'"))
    ) {
      result = result.substr(1, url.length - 2);
    }

    return result.trim();
  }
}
