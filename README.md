# prettier-loader

Prettier loader for Webpack.

## Installation

```
npm install prettier-loader prettier --save-dev
```

## Usage

Now supports only Webpack 2.
Create an issue on pr, if you need to support Webpack 1.

```js
// webpack.config.js
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        enforce: 'pre',
        loader: 'prettier-loader',
        options: { /* prettier options */ }
      }
    ]
  }
};
```
