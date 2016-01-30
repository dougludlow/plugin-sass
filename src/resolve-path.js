import path from 'path';
import url from 'url';

const paths = {};

const resolvePath = (request) => {
  return new Promise((resolve, reject) => {
    const { previous } = request;
    let { current } = request;
    if (current.substr(0, 5) === 'jspm:') {
      current = current.replace(/^jspm:/, '') + '.scss';
      System.normalize(current)
        .then(file => resolve(file.replace(/\.js$|\.ts$/, '')))
        .catch(e => reject(e));
    } else {
      const prevBase = path.dirname(previous) + '/';
      const base = (previous === 'stdin') ? request.options.urlBase : paths[previous] || prevBase;
      const resolved = url.resolve(base, current);
      if (previous !== 'stdin') paths[current] = path.dirname(resolved) + '/';
      resolve(`${resolved}.scss`);
    }
  });
};

export default resolvePath;
