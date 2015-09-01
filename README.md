# plugin-sass [![Build Status](https://travis-ci.org/screendriver/plugin-sass.svg?branch=master)](https://travis-ci.org/screendriver/plugin-sass)

[SystemJS](https://github.com/systemjs/systemjs)
[SASS](http://sass-lang.com) loader plugin. Can easily be installed with
[jspm](http://jspm.io) package manager.

```sh
$ jspm install scss=sass
```

To apply your SASS styles to your current page asynchronously:

```js
System.import('./style.scss!');
```

or synchronously

```js
import './style.scss!';
```

## Testing the plugin

```sh
$ npm install -g gulp
...
$ npm install
...
$ jspm install
...
$ gulp test
```

Now you can open [http://localhost:3000](http://localhost:3000) in the browser
of your choice.
