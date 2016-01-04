import url from 'url';

const resolvePath = (request, urlBase) => {
  return new Promise((resolve, reject) => {
    let { current } = request;
    const { previous } = request;
    if (previous !== 'stdin' && current.substr(0, 5) !== 'jspm:') {
      current = url.resolve(previous, current);
    }
    if (current.substr(0, 5) === 'jspm:') {
      current = current.replace(/^jspm:/, '') + '.scss';
      System.normalize(current)
        .then(path => resolve(path.replace(/\.js$|\.ts$/, '')))
        .catch(e => reject(e));
    } else {
      resolve(url.resolve(urlBase, `${current}.scss`));
    }
  });
};

export default resolvePath;
