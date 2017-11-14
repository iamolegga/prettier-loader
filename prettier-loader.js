var fs = require('fs');
var path = require('path');
var prettier = require('prettier');
var loaderUtils = require('loader-utils');
var cosmiconfig = require('cosmiconfig');

var promisedConfig = cosmiconfig('prettier')
  .load(process.cwd())
  .then(result => (result ? result.config : {}), () => ({}));

module.exports = function(source, map) {
  this.cacheable();
  var callback = this.async();
  var ext = path.extname(this.resourcePath);

  if (!new RegExp(this.query.test).test(this.context)) {
    return callback(null, source, map);
  }

  promisedConfig.then(config => {
    var prettierSource;
    try {
      var options = Object.assign({}, config, loaderUtils.getOptions(this));
      if (ext === '.scss' || ext === '.sass') {
        options.parser = 'scss';
      } else if (ext === '.css') {
        options.parser = 'css';
      } else if (ext === '.less') {
        options.parser = 'less';
      }
      prettierSource = prettier.format(
        source,
        options
      );
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
