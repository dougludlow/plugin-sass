/* eslint-env mocha */

import 'babel-polyfill';

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import url from 'url';
import System from 'systemjs';

global.System = System;

import resolvePath from '../src/resolve-path';

chai.should();
chai.use(chaiAsPromised);

describe('resolve-path', () => {
  it('can import resolvePath and it is a function', () => {
    resolvePath.should.be.a('function');
  });

  it('should resolves import', () => {
    const request = {
      current: 'mock/import',
      previous: 'stdin',
      options: {
        urlBase: '/',
      },
    };
    return resolvePath(request, '/').should.eventually.equal('/mock/import.scss');
  });

  it('should do a jspm import from a primarily installed module', async () => {
    System.config({
      baseURL: __dirname,
      defaultJSExtensions: true,
      paths: {
        'github:': 'jspm_packages/github/',
        'npm:': 'jspm_packages/npm/',
      },
      map: {
        'mock-package': 'npm:mock-package@1.0.0',
      },
    });
    const request = {
      current: 'jspm:mock-package/mock-asset',
      previous: 'stdin',
      options: { urlBase: '/' },
    };
    const p = await resolvePath(request, '/');
    // System.normalize in resolvePath will give us the absolute path
    const relative = `/${path.relative(__dirname, url.parse(p).path)}`;
    relative.should.equal(
      `/${path.join('jspm_packages', 'npm', 'mock-package@1.0.0', 'mock-asset.scss')}`
    );
  });

  it('should do a jspm import from an indirectly installed module', async () => {
    System.config({
      baseURL: __dirname,
      defaultJSExtensions: true,
      paths: {
        'github:': 'jspm_packages/github/',
        'npm:': 'jspm_packages/npm/',
      },
      map: {
        'mock-package': 'npm:mock-package@1.0.0',
        'npm:mock-package@1.0.0': {
          'indirect-package': 'npm:indirect-package@1.0.0',
        },
      },
    });
    const request = {
      current: 'jspm:indirect-package/mock-asset',
      previous: 'stdin',
      options: { urlBase: url.parse(`${__dirname}/jspm_packages/npm/mock-package@1.0.0/`).path },
    };
    const p = await resolvePath(request, '/');
    // System.normalize in resolvePath will give us the absolute path
    const relative = `/${path.relative(__dirname, url.parse(p).path)}`;
    relative.should.equal(
      `/${path.join('jspm_packages', 'npm', 'indirect-package@1.0.0', 'mock-asset.scss')}`
    );
  });

  it('should do a nested import', async () => {
    let request = {
      current: 'mixins/mixin',
      previous: '/jspm_packages/npm/mock-package@1.0.0/mock-asset',
    };
    let p = await resolvePath(request, '/');
    p.should.equal('/jspm_packages/npm/mock-package@1.0.0/mixins/mixin.scss');
    request = {
      current: 'deeper/mixin',
      previous: 'mixins/mixin',
    };
    p = await resolvePath(request, '/');
    // resolves a double nested import
    p.should.equal('/jspm_packages/npm/mock-package@1.0.0/mixins/deeper/mixin.scss');
  });
});
