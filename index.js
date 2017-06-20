const path = require("path");
const prettier = require("prettier");
const loaderUtils = require("loader-utils");

module.exports = function (source) {
  this.cacheable();

  if (!(new RegExp(this.query.test)).test(this.context)) {
    return source;
  }

  const callback = this.async();
  const prettierSource = prettier.format(
    source,
    loaderUtils.getOptions(this) || {}
  );

  if (prettierSource !== source) {
    fs.writeFile(this.resourcePath, prettierSource, error => {
      if (error) {
        return callback(error);
      }
      callback(null, prettierSource);
    });
    return;
  }

  callback(null, source);
};
