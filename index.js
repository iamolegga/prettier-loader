const fs = require("fs");
const path = require("path");
const prettier = require("prettier");
const loaderUtils = require("loader-utils");

module.exports = function (source, map) {
  this.cacheable();
  const callback = this.async();

  if (!(new RegExp(this.query.test)).test(this.context)) {
    return callback(null, source, map);
  }

  const prettierSource = prettier.format(
    source,
    loaderUtils.getOptions(this) || {}
  );

  if (prettierSource !== source) {
    try {
      fs.writeFileSync(this.resourcePath, prettierSource);
    } catch (error) {
      return callback(error);
    }
  }

  callback(null, prettierSource, map);
};
