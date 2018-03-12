# prettier-loader

[Prettier](https://github.com/prettier/prettier) loader for [Webpack](https://github.com/webpack/webpack).

The main idea is to make an auto `prettier`-fying source code on save, but to do it in cross-IDE manner: without installing and configuring plugins on every developer's machine, but integrate it in a development flow.

## Installation

```
npm install prettier-loader prettier --save-dev
```

## Usage

Supports only webpack >= 2.
Use with prettier >=1.6
Create an issue on pr, if you need to support Webpack 1.

```js
// webpack.config.js
module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: {
          loader: 'prettier-loader',
          // force this loader to run first
          enforce: 'pre',
          // avoid running prettier on all the files!
          // use it only on your source code and not on dependencies!
          exclude: /node_modules/,
          options: {
            // additional prettier options assigned to options in
            // - .prettierrc,
            // - prettier.config.js,
            // - "prettier" property in package.json
          },
        }
      }
    ]
  }
};
```
