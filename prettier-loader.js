var fs = require('fs');
var prettier = require('prettier');
var loaderUtils = require('loader-utils');
var cosmiconfig = require('cosmiconfig');

var promisedConfig = cosmiconfig('prettier')
  .load(process.cwd())
  .then(result => (result ? result.config : {}), () => ({}));

module.exports = function(source, map) {
  this.cacheable();
  var callback = this.async();

  if (!new RegExp(this.query.test).test(this.context)) {
    return callback(null, source, map);
  }

  promisedConfig.then(config => {
    var prettierSource = prettier.format(
      source,
      Object.assign({}, config, loaderUtils.getOptions(this))
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
