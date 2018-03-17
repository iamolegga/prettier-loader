# prettier-loader

[Prettier](https://github.com/prettier/prettier) loader for [Webpack](https://github.com/webpack/webpack).

---

[![Travis][travis-badge]][travis]
[![Coverage Status][coveralls-badge]][coveralls]
[![version][version-badge]][package]
[![downloads][downloads-badge]][npmcharts]
[![Node version support][node-version]][package]
[![MIT License][license-badge]][license]
[![PRs Welcome][prs-badge]][prs]
[![Code of Conduct][coc-badge]][coc]

## Purpose

Prettier is one of the best tools that really help developers not to waste time on codestyle.

Listed below are some of the ways one could employ prettier in a project:

- [Editor Integration](https://prettier.io/docs/en/editors.html)

  - Pros:
    - no overhead bootstrapping code
    - autoformatting on every save

  - Cons:
    - every developer needs to setup and configure editor's plugin manually
    - teammates can have conflicting plugin settings that might override default settings in an unpredictable way. Or one could forget to install `node_modules` and a globally installed `prettier` will be used instead, which might be of older version, etc. This leads to frustrating hiccups in the workflow and, potentially, bugs.

- [Pre-commit Hook](https://prettier.io/docs/en/precommit.html)

  - Pros:
    - works in the background (i.e. developer doesn't have to think about it)
    - consistent prettier settings in the project
  
  - Cons:
    - you can not see prettier changes on save

- [Watching For Changes](https://prettier.io/docs/en/watching-files.html)

  + Pros:
    - no overhead bootstrapping code
    - autoformatting on every save
    - works in the background
    - consistent prettier settings in the project
  
  - Cons:
    - if you already have another watcher (e.g. `webpack-dev-server` or `watchman`), you'll be wasting resources and your bundler will be triggered twice on every change: first by user, then by prettier formatting

- [CLI](https://prettier.io/docs/en/cli.html)

  + Pros:
    - no overhead bootstrapping code
  
  - Cons:
    - you can not see prettier changes on save
    - prone to errors unless stored somewhere (e.g. npm-scripts)

- [This Webpack Loader](https://www.npmjs.com/package/prettier-loader)

  + Pros:
    - autoformatting on every save (if working with webpack-dev-server)
    - works in the background
    - consistent prettier settings in the project
    - updates all the codebase when new prettier version is released
  
  - Cons:
    - works only on webpack-dependent projects

In short, idea is to make source code auto-`prettier`-fy on every save. But to do it in a cross-IDE manner. Use of `webpack`, eliminates the need to install and configure plugins on each developer's machine and also provides better efficency, as no other watchers are needed.

## Features

- support [prettier configuration files](https://prettier.io/docs/en/configuration.html): `.prettierrc`, `prettier.config.js`, `"prettier"` key in your `package.json` file
- support of [ignoring code](https://prettier.io/docs/en/ignore.html) using both comments and `.prettierignore` file
- override configuration files in loader options
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

### Minimal config example

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
          exclude: /node_modules/,
        }
      }
    ]
  }
};
```

### Full config example with description

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
          // force this loader to run first if it's not first in loaders list
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

## Pro Tip

Install and use it only in development environment if you minimize code for production, don't do unnecessary work!

## Contributing

All pull requests that respect next rules are welcome:

- Before opening pull request to this repo run `npm t` to lint, prettify and run test on code.

- All bugfixes and features should contain tests.

## License

MIT License

Copyright (c) 2017 Oleg Repin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

[travis-badge]: https://img.shields.io/travis/iamolegga/prettier-loader.svg?style=flat-square
[travis]: https://travis-ci.org/iamolegga/prettier-loader
[coveralls-badge]: https://img.shields.io/coveralls/github/iamolegga/prettier-loader.svg?style=flat-square
[coveralls]: https://coveralls.io/github/iamolegga/prettier-loader?branch=master
[version-badge]: https://img.shields.io/npm/v/prettier-loader.svg?style=flat-square
[package]: https://www.npmjs.com/package/prettier-loader
[downloads-badge]: https://img.shields.io/npm/dm/prettier-loader.svg?style=flat-square
[npmcharts]: https://npmcharts.com/compare/prettier-loader
[node-version]: https://img.shields.io/node/v/prettier-loader.svg?style=flat-square
[license-badge]: https://img.shields.io/npm/l/prettier-loader.svg?style=flat-square
[license]: https://github.com/iamolegga/prettier-loader/blob/master/LICENSE
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com
[coc-badge]: https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square
[coc]: https://github.com/iamolegga/prettier-loader/blob/master/CODE_OF_CONDUCT.md
