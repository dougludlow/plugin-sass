/* global __moduleName */
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
    /* eslint no-param-reassign: "off" */
    load.metadata.format = 'defined';
  };
  bundle = async function bundler(loads, opts) {
    const builder = await System.import('./sass-builder', { name: __moduleName });
    return builder.default.call(System, loads, opts);
  };
}

export { fetch, translate, bundle };
