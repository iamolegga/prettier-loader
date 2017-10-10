const fs = require('fs');
const prettier = require('prettier');
const loaderUtils = require('loader-utils');
const cosmiconfig = require('cosmiconfig');

const promisedConfig = cosmiconfig('prettier')
  .load(process.cwd())
  .then(result => (result ? result.config : {}), () => ({}));

module.exports = function(source, map) {
  this.cacheable();
  const callback = this.async();

  if (!new RegExp(this.query.test).test(this.context)) {
    return callback(null, source, map);
  }

  promisedConfig.then(config => {
    const prettierSource = prettier.format(
      source,
      Object.assign({}, config, loaderUtils.getOptions(this)),
    );

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
