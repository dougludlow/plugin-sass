import path from 'path';

const paths = {};

const resolvePath = (request, urlBase) => {
  return new Promise((resolve, reject) => {
    const { previous } = request;
    let { current } = request;
    if (current.substr(0, 5) === 'jspm:') {
      current = current.replace(/^jspm:/, '') + '.scss';
      System.normalize(current)
        .then(p => resolve(p.replace(/\.js$|\.ts$/, '')))
        .catch(e => reject(e));
    } else {
      const prevBase = path.dirname(previous) + '/';
      const base = (previous === 'stdin') ? urlBase : paths[previous] || prevBase;
      const resolved = path.resolve(base, current);
      if (previous !== 'stdin') paths[current] = path.dirname(resolved);
      resolve(`${resolved}.scss`);
    }
  });
};

export default resolvePath;
