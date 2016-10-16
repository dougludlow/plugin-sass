/* eslint import/no-mutable-exports: "off" */

let fetch;
let translate;
let bundle;

if (typeof window !== 'undefined') {
  fetch = async function fetchIt(load) {
    const inject = await System.import('./sass-inject', { name: __moduleName });
    return inject.default(load);
  };
} else {
  // setting format = 'defined' means we're managing our own output
  translate = function translateIt(load) {
    load.metadata.format = 'defined'; // eslint-disable-line no-param-reassign
    if (this.builder && this.buildCSS === false) {
      load.metadata.build = false;    // eslint-disable-line no-param-reassign
    }
  };
  bundle = async function bundler(loads, compileOpts, outputOpts) {
    const builder = await System.import('./sass-builder', { name: __moduleName });
    return builder.default.call(System, loads, compileOpts, outputOpts);
  };
}

export { fetch, translate, bundle };
