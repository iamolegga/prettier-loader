# prettier-loader

Prettier loader for webpack

```js
// webpack.config.js
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'prettier-loader',
        options: { /* prettier options */ }
      }
    ]
  }
};
```
