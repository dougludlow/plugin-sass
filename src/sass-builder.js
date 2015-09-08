var url = require('url');
var fs = require('fs');
var sass = require('sass.js');

var cssInject = "(function(c){var d=document,a='appendChild',i='styleSheet',s=d.createElement('style');s.type='text/css';d.getElementsByTagName('head')[0][a](s);s[i]?s[i].cssText=c:s[a](d.createTextNode(c));})";

var urlBase;

function escape(source) {
  return source
    .replace(/(["\\])/g, '\\$1')
    .replace(/[\f]/g, "\\f")
    .replace(/[\b]/g, "\\b")
    .replace(/[\n]/g, "\\n")
    .replace(/[\t]/g, "\\t")
    .replace(/[\r]/g, "\\r")
    .replace(/[\u2028]/g, "\\u2028")
    .replace(/[\u2029]/g, "\\u2029");
}

// intercept file loading requests (@import directive) from libsass
sass.importer(function(request, done) {
  var fullUrl = url.resolve(urlBase, request.current + '.scss');
  var readUrl = url.parse(fullUrl).path;
  fs.readFile(readUrl, {encoding: 'UTF-8'}, function(err, data) {
    done({ content: data });
  });
});

module.exports = function bundle(loads, opts) {
  return new Promise(function(resolve, reject) {
    loads.forEach(function(load) {
      // TODO Support different load addresses
      urlBase = load.address;
    });
    var stubDefines = loads.map(function(load) {
      return "System\.register('" + load.name + "', [], false, function() {});";
    }).join('\n');
    var scss = loads.map(function(load) {
      return load.source;
    }).reduce(function(sourceA, sourceB) {
      return sourceA + sourceB;
    });
    var options = {
      style: sass.style.compressed,
    };
    sass.compile(scss, options, function(result) {
      if (result.status === 0) {
        resolve([stubDefines, cssInject, '("' + escape(result.text) + '");'].join('\n'));
      } else {
        reject(result.formatted);
      }
    });
  });
};
