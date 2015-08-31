# plugin-sass

SystemJS SASS loader plugin

```sh
$ jspm install sass
```

In your `config.js`

```sh
System.config({
  map: {
    "scss": "jspm:plugin-sass@0.0.1"
  }
});
```

To apply your SASS styles to your current page:

```js
System.import('./style.scss!');
```
