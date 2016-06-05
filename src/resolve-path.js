import path from 'path';
import url from 'url';

const paths = {};

async function resolvePath(request) {
  const { previous } = request;
  let { current } = request;
  if (current.substr(0, 5) === 'jspm:') {
    current = current.replace(/^jspm:/, '');
    if (!current.match(/\.s(c|a)ss/)) current += '.scss';
    // we need the parent, if the module of the file is not a primary install
    let parent = `${System.baseURL}${request.options.urlBase}`;
    // when adding urls, some unwanted double slashes may occur
    if (System.baseURL.slice(-1) === '/' && request.options.urlBase.slice(0, 1) === '/') {
      parent = `${System.baseURL}${request.options.urlBase.slice(1)}`;
    }
    const file = await System.normalize(current, parent);
    return file.replace(/\.js$|\.ts$/, '');
  }
  const prevBase = `${path.dirname(previous)}/`;
  const base = (previous === 'stdin') ? request.options.urlBase : paths[previous] || prevBase;
  let resolved = url.resolve(base, current);
  if (previous !== 'stdin') paths[current] = `${path.dirname(resolved)}/`;
  if (!resolved.match(/\.s(c|a)ss/)) resolved += '.scss';
  return `${resolved}`;
}

export default resolvePath;
