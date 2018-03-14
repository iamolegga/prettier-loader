var fs = require('fs');
var path = require('path');
var prettier = require('prettier');
var loaderUtils = require('loader-utils');
var ignore = require('ignore');

// prettier config

var configsCache = {};
function getConfig(filePath, loaderOptions) {
  if (configsCache[filePath]) {
    return Promise.resolve(configsCache[filePath]);
  }
  return prettier
    .resolveConfig(filePath, (loaderOptions || {}).resolveConfigOptions)
    .then(config => {
      var mergedConfig = Object.assign({}, config || {}, loaderOptions);
      configsCache[filePath] = mergedConfig;
      return mergedConfig;
    });
}

// prettier ignore

var ignoreManager;
function getIgnoreManager(filePath) {
  if (ignoreManager) {
    return ignoreManager;
  }
  ignoreManager = ignore();
  var ignorePath = findIgnorePathInParentFolders(path.join(filePath, '..'));
  if (ignorePath) {
    var ignoredFiles = fs
      .readFileSync(ignorePath, 'utf8')
      .toString()
      .split('\n');
    ignoreManager.add(ignoredFiles);
  }
  return ignoreManager;
}
function findIgnorePathInParentFolders(folderPath) {
  var possiblePath = path.join(`${folderPath}`, '.prettierignore');
  if (fs.existsSync(possiblePath)) {
    return possiblePath;
  }
  var parentFolder = path.join(folderPath, '..');
  if (parentFolder === folderPath) {
    return null;
  }
  return findIgnorePathInParentFolders(parentFolder);
}

module.exports = function(source, map) {
  this.cacheable();
  var callback = this.async();

  if (!new RegExp(this.query.test).test(this.context)) {
    return callback(null, source, map);
  }

  if (getIgnoreManager(this.resourcePath).ignores(this.resourcePath)) {
    return callback(null, source, map);
  }

  getConfig(this.resourcePath, loaderUtils.getOptions(this)).then(config => {
    var prettierSource;
    try {
      prettierSource = prettier.format(source, config);
    } catch (e) {
      return callback(e);
    }

    if (prettierSource !== source) {
      try {
        fs.writeFileSync(this.resourcePath, prettierSource);
      } catch (error) {
        return callback(error);
      }
    }

    callback(null, prettierSource, map);
  });
};

module.exports.__clearIgnoreManager = () => {
  ignoreManager = undefined;
};
