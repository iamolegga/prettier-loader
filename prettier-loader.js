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

  const config = await prettier.resolveConfig(
    filePath,
    (loaderOptions || {}).resolveConfigOptions
  );

  const { resolveConfigOptions: _, ...mergedConfig } = Object.assign(
    {},
    config || {},
    loaderOptions
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

module.exports = async function(source, map) {
  this.cacheable();
  const callback = this.async();

  if (!new RegExp(this.query.test).test(this.context)) {
    return callback(null, source, map);
  }

  if (
    getIgnoreManager(this.resourcePath).ignores(
      path.relative(this.rootContext, this.resourcePath)
    )
  ) {
    return callback(null, source, map);
  }

  const { skipRewritingSource, ...config } = await getConfig(
    this.resourcePath,
    loaderUtils.getOptions(this)
  );

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
