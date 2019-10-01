global.prettierLoaderWatchCache = new Map();

module.exports = function(source, map) {
  this.cacheable();
  var callback = this.async();

  if (!new RegExp(this.query.test).test(this.context)) {
    return callback(null, source, map);
  }

  global.prettierLoaderWatchCache.set(this.resourcePath, source);
  callback(null, source, map);
};
