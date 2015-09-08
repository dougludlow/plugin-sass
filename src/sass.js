if (typeof window !== 'undefined') {
  exports.fetch = function(load) {
    return System.import('./sass-inject')
      .then(function(inject) {
        return inject(load);
      });
  };
} else {
  // setting format = 'defined' means we're managing our own output
  exports.translate = function(load) {
    load.metadata.format = 'defined';
  };
  exports.bundle = function(loads, opts) {
    var loader = this;
    return loader.import('./sass-builder', { name: module.id })
      .then(function(builder) {
        return builder.call(loader, loads, opts)
      });
  };
}
