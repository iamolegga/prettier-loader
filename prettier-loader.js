const fs = require('fs');
const path = require('path');
const prettier = require('prettier');
const loaderUtils = require('loader-utils');
const ignore = require('ignore');

// prettier config

const configsCache = {};

async function getConfig(filePath, loaderOptions) {
  if (configsCache[filePath]) {
    return configsCache[filePath];
  }

  const { resolveConfigOptions, ...passedToLoaderPrettierOptions } =
    loaderOptions || {};

  const outerOptions = await prettier.resolveConfig(
    filePath,
    resolveConfigOptions
  );

  const mergedConfig = Object.assign(
    { filepath: filePath },
    outerOptions || {},
    passedToLoaderPrettierOptions
  );

  // eslint-disable-next-line require-atomic-updates
  configsCache[filePath] = mergedConfig;

  return mergedConfig;
}

// prettier ignore

let ignoreManager;

function getIgnoreManager(filePath) {
  if (ignoreManager) {
    return ignoreManager;
  }
  ignoreManager = ignore();
  const ignorePath = findIgnorePathInParentFolders(path.join(filePath, '..'));
  if (ignorePath) {
    const ignoredFiles = fs.readFileSync(ignorePath, 'utf8').toString();
    ignoreManager.add(ignoredFiles);
  }
  return ignoreManager;
}
function findIgnorePathInParentFolders(folderPath) {
  const possiblePath = path.join(`${folderPath}`, '.prettierignore');
  if (fs.existsSync(possiblePath)) {
    return possiblePath;
  }
  const parentFolder = path.join(folderPath, '..');
  if (parentFolder === folderPath) {
    return null;
  }
  return findIgnorePathInParentFolders(parentFolder);
}

// loader

const loadedFiles = new Set();

module.exports = async function(source, map) {
  this.cacheable();
  const callback = this.async();

  if (!new RegExp(this.query.test).test(this.context)) {
    return callback(null, source, map);
  }

  if (
    getIgnoreManager(this.resourcePath).ignores(
      // webpack4 specific `rootContext` property
      // against `options.context` in earlier versions
      path.relative(this.rootContext || this.options.context, this.resourcePath)
    )
  ) {
    return callback(null, source, map);
  }

  const { skipRewritingSource, ignoreInitial, ...config } = await getConfig(
    this.resourcePath,
    loaderUtils.getOptions(this)
  );

  if (!!ignoreInitial && !loadedFiles.has(this.resourcePath)) {
    loadedFiles.add(this.resourcePath);
    return callback(null, source, map);
  }

  let prettierSource;
  try {
    prettierSource = prettier.format(source, config);
  } catch (e) {
    return callback(e);
  }

  if (!skipRewritingSource && prettierSource !== source) {
    try {
      fs.writeFileSync(this.resourcePath, prettierSource);
    } catch (error) {
      return callback(error);
    }
  }

  callback(null, prettierSource, map);
};

// for tests

module.exports.__clearIgnoreManager = () => {
  ignoreManager = undefined;
};
