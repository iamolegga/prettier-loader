# prettier-loader

[Prettier](https://github.com/prettier/prettier) loader for [Webpack](https://github.com/webpack/webpack).

---

[![version][version-badge]][package]
[![downloads][downloads-badge]][npmcharts]
[![MIT License][license-badge]][license]
[![PRs Welcome][prs-badge]][prs]
[![Code of Conduct][coc-badge]][coc]

The main idea is to make an auto `prettier`-fying source code on save, but to do it in cross-IDE manner: without installing and configuring plugins on every developer's machine, but integrate it in a development flow using `webpack`.

## Features

- [prettier configuration files](https://prettier.io/docs/en/configuration.html): `.prettierrc`, `prettier.config.js`, `"prettier"` key in your `package.json` file
- [ignoring code](https://prettier.io/docs/en/ignore.html) using both comments and `.prettierignore` file
- overriding configuration files in loader options
- zero configuration of loader options for supporting all features out of the box

## Requirements

- webpack >= 2
- prettier >= 1.6

Create an issue on pr, if you __really__ need to support Webpack 1.

## Installation

```
npm install prettier-loader prettier --save-dev
```

## Usage

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

[version-badge]: https://img.shields.io/npm/v/prettier-loader.svg?style=flat-square
[package]: https://www.npmjs.com/package/prettier-loader
[downloads-badge]: https://img.shields.io/npm/dm/prettier-loader.svg?style=flat-square
[npmcharts]: https://npmcharts.com/compare/prettier-loader
[license-badge]: https://img.shields.io/npm/l/prettier-loader.svg?style=flat-square
[license]: https://github.com/iamolegga/prettier-loader/blob/master/LICENSE
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com
[coc-badge]: https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square
[coc]: https://github.com/paypal/glamorous/blob/master/other/CODE_OF_CONDUCT.md
