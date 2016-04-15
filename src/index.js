/* global __moduleName */
let fetch;
let translate;
let bundle;

if (typeof window !== 'undefined') {
  fetch = function fetchIt(load) {
    return System.import('./sass-inject', { name: __moduleName })
      .then(inject => inject.default(load));
  };
} else {
  // setting format = 'defined' means we're managing our own output
  translate = function translateIt(load) {
    /* eslint no-param-reassign: "off" */
    load.metadata.format = 'defined';
  };
  bundle = function bundler(loads, opts) {
    return System.import('./sass-builder', { name: __moduleName })
      .then(builder => builder.default.call(System, loads, opts));
  };
}

export { fetch, translate, bundle };
