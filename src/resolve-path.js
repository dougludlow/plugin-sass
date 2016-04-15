import path from 'path';
import url from 'url';

const paths = {};

async function resolvePath(request) {
  const { previous } = request;
  let { current } = request;
  if (current.substr(0, 5) === 'jspm:') {
    current = current.replace(/^jspm:/, '');
    if (!current.match(/\.s(c|a)ss/)) current += '.scss';
    const file = await System.normalize(current);
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
