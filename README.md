# JSPM SASS/SCSS Plugin

[![Build Status](https://travis-ci.org/dougludlow/plugin-sass.svg?branch=master)](https://travis-ci.org/dougludlow/plugin-sass)

[SystemJS](https://github.com/systemjs/systemjs)
[SASS](http://sass-lang.com) loader plugin. Can easily be installed with
[jspm](http://jspm.io) package manager.

```sh
$ jspm install sass --dev
```

Recommended plugin usage configuration is:

```js
SystemJS.config({
  meta: {
    "*.scss": { "loader": "sass" },
    "*.sass": { "loader": "sass" }
  }
});
```

To apply your SASS styles to your current page asynchronously:

```js
System.import('./style.scss');
```

or synchronously

```js
import './style.scss';
```

You can also use the [older syntax](http://sass-lang.com/documentation/file.SASS_REFERENCE.html#syntax)
, known as the indented syntax (or sometimes just "_Sass_")

```js
System.import('./style.sass');
```

**Note**: if you use a different transpiler as Babel, like [TypeScript](http://www.typescriptlang.org), the plugin does not work by default. This is because this plugin and jspm / SystemJS is based on ES2015 syntax. All code is written with the Babel transpiler so you have to use the transpiler first before you can use the plugin. Please have a look at issue [#25](https://github.com/mobilexag/plugin-sass/issues/25#issuecomment-179704867) for a solution.

## Features

- sass, scss
- @import supported
- "jspm:" prefix to refer jspm package files
- url rewrite and asset copier
- autoprefixer with custom configuration
- minified and non minified build
- bundle css separately or inline into build

## Importing from jspm

You can import scss files from jspm packages *from within scss files* using the `jspm:` prefix. For example, if you have jspm installed `twbs/bootstrap-sass`:

```scss
@import 'jspm:bootstrap-sass/assets/stylesheets/bootstrap';
```

## Legacy options

Some legacy `plugin-css` options are supported:

```js
System.config({
  separateCSS: false, // change to true to separate css from js bundle
  buildCSS: true,     // change to false to not build css and process it manually
});
```

- `separateCSS`: true|false, default to false, set to true to separate css from
  js bundle, works well if `plugin-css` is not used, otherwise both plugins will
  try to save css in the same file and one will overwrite results of another one.
- `buildCSS`: true|false, defalt to true, set to to not build css and process it manually.

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

or

```js
sassPluginOptions: {
  "autoprefixer": {
    "browsers": ["last 2 versions"]
  }
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
