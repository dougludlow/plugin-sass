# plugin-sass

[![Build Status](https://travis-ci.org/mobilexag/plugin-sass.svg?branch=master)](https://travis-ci.org/mobilexag/plugin-sass)
[![Dependency Status](https://david-dm.org/mobilexag/plugin-sass.svg)](https://david-dm.org/mobilexag/plugin-sass)

[SystemJS](https://github.com/systemjs/systemjs)
[SASS](http://sass-lang.com) loader plugin. Can easily be installed with
[jspm](http://jspm.io) package manager.

```sh
$ jspm install scss=sass
```

**Note**: please use the latest stable release. This plugin does not work with the latest jspm beta.

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

## Testing the plugin

```sh
$ npm install -g gulp
...
$ npm install
...
$ jspm install
```

Now you can test runtime compilation

```sh
$ gulp test:runtime
```

bundling

```sh
$ gulp test:bundle
```

or static bundling

```sh
$ gulp test:bundleStatic
```

After that open [http://localhost:3000](http://localhost:3000) in the browser
of your choice.
