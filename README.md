# prettier-loader

[Prettier](https://github.com/prettier/prettier) loader for [Webpack](https://github.com/webpack/webpack).

The main idea is to make an auto `prettier`-fying source code on save, but to do it in cross-IDE manner: without installing and configuring plugins on every developer's machine, but integrate it in a development flow.

## Installation

```
npm install prettier-loader prettier --save-dev
```

## Usage

Now supports only webpack 2 and 3.
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
          // additional options assigned to your options in
          // - .prettierrc,
          // - prettier.config.js,
          // - "prettier" property in package.json
          options: { /* prettier options */ },
        }
      }
    ]
  }
};
```
