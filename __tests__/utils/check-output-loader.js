const loaderUtils = require('loader-utils');

module.exports = function (source) {
    const { checkResult } = loaderUtils.getOptions(this)
    checkResult(source)
    return source;
}