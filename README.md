# plugin-sass

[![Build Status](https://travis-ci.org/mobilexag/plugin-sass.svg?branch=master)](https://travis-ci.org/mobilexag/plugin-sass)
[![Dependency Status](https://david-dm.org/mobilexag/plugin-sass.svg)](https://david-dm.org/mobilexag/plugin-sass)
[![devDependency Status](https://david-dm.org/mobilexag/plugin-sass/dev-status.svg)](https://david-dm.org/mobilexag/plugin-sass#info=devDependencies)

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

You can also use the [older syntax](http://sass-lang.com/documentation/file.SASS_REFERENCE.html#syntax)
, known as the indented syntax (or sometimes just "_Sass_")

```js
System.import('./style.sass!scss');
```

**Note**: if you use a different transpiler as Babel, like [TypeScript](http://www.typescriptlang.org), the plugin does not work by default. This is because this plugin and jspm / SystemJS is based on ES2015 syntax. All code is written with the Babel transpiler so you have to use the transpiler first before you can use the plugin. Please have a look at issue [#25](https://github.com/mobilexag/plugin-sass/issues/25#issuecomment-179704867) for a solution.

## Features

- sass, scss
- @import supported
- "jspm:" prefix to refer jspm packages
- url rewrite and asset copier

## Importing from jspm

You can import scss files from jspm packages *from within scss files* using the `jspm:` prefix. For example, if you have jspm installed `twbs/bootstrap-sass`:

```scss
@import 'jspm:bootstrap-sass/assets/stylesheets/bootstrap';
```

## Configuring the plugin

You can configure some options how the plugin should behave. Just add a new
`sassPluginOptions` config object to your `config.js`.

```js
System.config({
  sassPluginOptions: {
  }
})
```

### Autoprefixer

To enable [autoprefixer](https://github.com/postcss/autoprefixer)

```js
sassPluginOptions: {
  "autoprefixer": true
}
```

### SASS options

To add SASS [options](https://github.com/medialize/sass.js/#using-the-sassjs-api)

```js
sassPluginOptions: {
  "sassOptions": {

  }
}
```

## URL rewriter and asset copier

Options `rewriteUrl` enables rewrite scss URLs to use correct path from SystemJS base URL.

Option `copyAssets` enables copy CSS-related assets into destination folder.

```sh
jspm build app dist/app.js --format global --minify --skip-source-maps
```

```js
sassPluginOptions: {
  "copyAssets": true,
  "rewriteUrl": true
}
```

## Testing the plugin

```sh
$ npm install
...
$ jspm install
```

To run unit tests just do a

```sh
$ npm run test
```

To test that everything works in your browser you can test runtime compilation

```sh
$ npm run test:runtime
```

or bundling

```sh
$ npm run test:bundle
```

or self-executing bundle

```sh
$ npm run test:bundleSfx
```
