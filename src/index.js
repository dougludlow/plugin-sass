let fetch;
let translate;
let bundle;

if (typeof window !== 'undefined') {
  fetch = load => {
    return System.import('./sass-inject',  { name: __moduleName })
      .then(inject => inject.default(load));
  };
} else {
  // setting format = 'defined' means we're managing our own output
  translate = load => {
    load.metadata.format = 'defined';
  };
  bundle = function bundler(loads, opts) {
    return System.import('./sass-builder', { name: __moduleName })
      .then(builder => builder.default.call(System, loads, opts));
  };
}

export {fetch, translate, bundle};
