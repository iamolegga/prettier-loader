# prettier-loader

[Prettier](https://github.com/prettier/prettier) loader for [Webpack](https://github.com/webpack/webpack).

---

[![version][version-badge]][package]
[![downloads][downloads-badge]][npmcharts]
[![Node version support][node-version]][package]
[![MIT License][license-badge]][license]
[![PRs Welcome][prs-badge]][prs]
[![Code of Conduct][coc-badge]][coc]

## Purpose

Prettier is one of the best tools that really help developers to not waste time on codestyle.

So there is different types of how to use it in project, and pros and cons of each:

- [Editor Integration](https://prettier.io/docs/en/editors.html)

  - Pros:
    - no configuring codebase
    - format code on every save

  - Cons:
    - every developer should setup and configure editor's plugin on his own
    - if working in big team different editors of developers could have different settings, so each could have different editor's prettier setting that can override default setting, that not set in `.prettierrc`, or developer can forget to install `node_modules` and editor will format with global installed prettier of old version, etc. This all buggy situations when project settings could be affected by every developer not consistently

- [Pre-commit Hook](https://prettier.io/docs/en/precommit.html)

  - Pros:
    - works in background (i.e. developer don't have to think about it)
    - consistent prettier settings on project
  
  - Cons:
    - you can not see prettier changes on save
  
- [Watching For Changes](https://prettier.io/docs/en/watching-files.html)

  + Pros:
    - no configuring codebase
    - format code on every save
    - works in background
    - consistent prettier settings on project
  
  - Cons:
    - if you have already watcher for changing files (for example, webpack-dev-server, watchman etc) this is another one watcher in your memory, and it could trigger your bundler twice becouse of of 1) saving by user 2) rewriting by prettier

- [CLI](https://prettier.io/docs/en/cli.html)

  + Pros:
    - no configuring codebase
  
  - Cons:
    - you can not see prettier changes on save
    - there can be mestakes when running CLI-command if it's not saved in some place (for example npm-scripts)

- [This Webpack Loader](https://www.npmjs.com/package/prettier-loader)

  + Pros:
    - format code on every save (if working with webpack-dev-server)
    - works in background
    - consistent prettier settings on project
  
  - Cons:
    - works only on webpack dependent projects

So, in two words, the main idea is to make an auto `prettier`-fying source code on save, but to do it in cross-IDE manner: without installing and configuring plugins on every developer's machine, but integrate it in a development flow using `webpack`.

## Features

- support of [prettier configuration files](https://prettier.io/docs/en/configuration.html): `.prettierrc`, `prettier.config.js`, `"prettier"` key in your `package.json` file
- support of [ignoring code](https://prettier.io/docs/en/ignore.html) using both comments and `.prettierignore` file
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
