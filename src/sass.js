import 'fetch';
import sass from 'sass.js';

const compile = scss => {
  return new Promise((resolve, reject) => {
    sass.compile(scss, result => {
      if (result.status === 0) {
        const style = document.createElement('style');
        style.textContent = result.text;
        style.setAttribute('type', 'text/css');
        document.getElementsByTagName('head')[0].appendChild(style);
        resolve('');
      } else {
        reject();
      }
    });
  });
};

const scssFetch = load => {
  return fetch(load.address)
    .then(response => response.text())
    .then(compile);
};

export {scssFetch as fetch};
