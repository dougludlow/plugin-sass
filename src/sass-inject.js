require('fetch');
var url = require('url');
var sass = require('sass.js');

var urlBase;

// intercept file loading requests (@import directive) from libsass
sass.importer(function(request, done) {
  var importUrl = url.resolve(urlBase, request.current + '.scss');
  fetch(importUrl)
    .then(function(response) {
      return response.text()
    })
    .then(function(content) {
      done({ content: content });
    });
});

var compile = function(scss) {
  return new Promise(function(resolve, reject) {
    sass.compile(scss, function(result) {
      if (result.status === 0) {
        var style = document.createElement('style');
        style.textContent = result.text;
        style.setAttribute('type', 'text/css');
        document.getElementsByTagName('head')[0].appendChild(style);
        resolve('');
      } else {
        reject(result.formatted);
      }
    });
  });
};

var scssFetch = function(load) {
  urlBase = load.address;
  // fetch initial scss file
  return fetch(urlBase)
    .then(function(response) {
      return response.text();
    })
    .then(compile);
};

module.exports = scssFetch;
