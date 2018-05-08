var fs = require('fs');
var os = require('os');
var path = require('path');
var prettier = require('prettier');
// eslint-disable-next-line node/no-unpublished-require
var rimraf = require('rimraf');
// eslint-disable-next-line node/no-unpublished-require
var webpack = require('webpack');
var __clearIgnoreManager = require('../prettier-loader').__clearIgnoreManager;

/**
 * Helpers
 */

var SEPARATOR = path.sep;
var testFolder;

function writeFiles(files) {
  testFolder = fs.mkdtempSync(`${os.tmpdir()}${SEPARATOR}`);

  return Object.keys(files).reduce((acc, fileName) => {
    var fullPath = `${testFolder}${SEPARATOR}${fileName}`;
    var content = files[fileName];
    fs.writeFileSync(fullPath, content);
    acc[fullPath] = content;
    return acc;
  }, {});
}

function getCompiler(webpackConfiguration, entryFileName) {
  return webpack(
    Object.assign({}, webpackConfiguration, {
      entry: `${testFolder}${SEPARATOR}${entryFileName}`,
      output: { path: testFolder },
    })
  );
}

function run(webpackConfiguration, files, entryFileName) {
  var testFiles = writeFiles(files);
  var webpackCompiler = getCompiler(webpackConfiguration, entryFileName);

  return new Promise((resolve, reject) => {
    webpackCompiler.run((error, stats) => {
      if (error) {
        return reject(error);
      }
      if (stats.hasErrors()) {
        return reject(stats.toJson().errors);
      }

      resolve(testFiles);
    });
  });
}

function watch(webpackConfiguration, files, entryFileName, watchOpts, cb) {
  var testFiles = writeFiles(files);
  var webpackCompiler = getCompiler(webpackConfiguration, entryFileName);

  return webpackCompiler.watch(watchOpts, (error, stats) =>
    cb(error, stats, testFiles)
  );
}

function getWebpackConfigWithRules(rules) {
  return {
    context: '/',
    module: { rules },
    resolveLoader: {
      modules: [path.join(__dirname, '..'), 'node_modules'],
    },
  };
}

function getContent(path) {
  return fs.readFileSync(path).toString('utf8');
}

/**
 * Tests settings
 */

afterEach(() => {
  rimraf.sync(testFolder);
  // ignoreManager should be cleared after each test, for creating new instance
  // in next test, because we do every test in new temp directory
  // but ignoreManager already cached .prettierrc file of previous directory
  __clearIgnoreManager();
});

/**
 * Tests
 */

describe('pass options', () => {
  test('should work without loader-options and .prettierrc file', () => {
    var entryFile = 'index.js';

    var files = {
      [entryFile]: `${'very().'.repeat(20)}long("chaining")`,
    };

    var webpackConfiguration = getWebpackConfigWithRules([
      { test: /\.js$/, use: { loader: 'prettier-loader' } },
    ]);

    return run(webpackConfiguration, files, entryFile).then(testFiles => {
      var entryPath = Object.keys(testFiles)[0];
      var entryContent = getContent(entryPath);

      expect(prettier.check(entryContent)).toBe(true);
    });
  });

  test('should work with loader-options', () => {
    var entryFile = 'index.js';

    var prettierOptions = { tabWidth: 8 };

    var files = {
      [entryFile]: `${'very().'.repeat(20)}long("chaining")`,
    };

    var webpackConfiguration = getWebpackConfigWithRules([
      {
        test: /\.js$/,
        use: { loader: 'prettier-loader', options: prettierOptions },
      },
    ]);

    return run(webpackConfiguration, files, entryFile).then(testFiles => {
      var entryPath = Object.keys(testFiles)[0];
      var entryContent = getContent(entryPath);

      expect(prettier.check(entryContent, prettierOptions)).toBe(true);
    });
  });

  test('should work with .prettierrc file', () => {
    var entryFile = 'index.js';

    var prettierOptions = { tabWidth: 8 };

    var files = {
      [entryFile]: `${'very().'.repeat(20)}long("chaining")`,
      '.prettierrc': JSON.stringify(prettierOptions),
    };

    var webpackConfiguration = getWebpackConfigWithRules([
      { test: /\.js$/, use: { loader: 'prettier-loader' } },
    ]);

    return run(webpackConfiguration, files, entryFile).then(testFiles => {
      var entryPath = Object.keys(testFiles).find(k => k.includes(entryFile));
      var entryContent = getContent(entryPath);

      expect(prettier.check(entryContent, prettierOptions)).toBe(true);
    });
  });

  test('should work with loader-options and .prettierrc file', () => {
    var entryFile = 'index.js';

    // create both, but loader rules should override prettierrc
    var prettierrcOptions = { tabWidth: 8, singleQuote: true };
    var loaderOptions = { tabWidth: 4 };

    var files = {
      [entryFile]: `${'very().'.repeat(20)}long("chaining")`,
      '.prettierrc': JSON.stringify(prettierrcOptions),
    };

    var webpackConfiguration = getWebpackConfigWithRules([
      {
        test: /\.js$/,
        use: { loader: 'prettier-loader', options: loaderOptions },
      },
    ]);

    return run(webpackConfiguration, files, entryFile).then(testFiles => {
      var entryPath = Object.keys(testFiles).find(k => k.includes(entryFile));
      var entryContent = getContent(entryPath);

      expect(
        prettier.check(
          entryContent,
          Object.assign({}, prettierrcOptions, loaderOptions)
        )
      ).toBe(true);
    });
  });
});

describe('ignoring', () => {
  var MATRIX_CODE = `matrix(
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
  )`;

  test('should ignore using comments', () => {
    var entryFile = 'index.js';

    var files = {
      [entryFile]: `
${'very().'.repeat(20)}long("chaining")
// prettier-ignore
${MATRIX_CODE}`,
    };

    var webpackConfiguration = getWebpackConfigWithRules([
      { test: /\.js$/, use: { loader: 'prettier-loader' } },
    ]);

    return run(webpackConfiguration, files, entryFile).then(testFiles => {
      var entryPath = Object.keys(testFiles).find(k => k.includes(entryFile));
      var entryContent = getContent(entryPath);

      expect(entryContent).toMatch(MATRIX_CODE);
    });
  });

  test('should ignore using .prettierignore', () => {
    var entryFile = 'index.js';

    var files = {
      [entryFile]: MATRIX_CODE,
      '.prettierignore': entryFile,
    };

    var webpackConfiguration = getWebpackConfigWithRules([
      { test: /\.js$/, use: { loader: 'prettier-loader' } },
    ]);

    return run(webpackConfiguration, files, entryFile).then(testFiles => {
      var entryPath = Object.keys(testFiles).find(k => k.includes(entryFile));
      var entryContent = getContent(entryPath);

      expect(entryContent).toMatch(MATRIX_CODE);
    });
  });

  test('should emit changes only once with watch mode', done => {
    var entryFile = 'index.js';

    var files = {
      [entryFile]: MATRIX_CODE,
    };

    var webpackConfiguration = getWebpackConfigWithRules([
      {
        test: /\.js$/,
        use: { loader: 'prettier-loader', options: { watch: true } },
      },
      {
        test: /\.js$/,
        use: { loader: 'watch-helper' },
      },
    ]);

    // webpackConfiguration.devServer =
    var watchOpts = {
      poll: 1000,
    };

    let rsolveWatchFirstCbPromise;
    const watchFirstCbPromise = new Promise(r => {
      rsolveWatchFirstCbPromise = r;
    });
    let cbCallTimes = 0;
    const cb = (error, stats, watchFiles) => {
      if (cbCallTimes == 0) {
        rsolveWatchFirstCbPromise();
        fs.writeFileSync(Object.keys(watchFiles)[0], MATRIX_CODE);
      }
      cbCallTimes++;
    };

    var watcher = watch(webpackConfiguration, files, entryFile, watchOpts, cb);

    watchFirstCbPromise.then(() => {
      setTimeout(() => {
        expect(cbCallTimes).toBe(2);
        watcher.close(done);
      }, watchOpts.poll * 2 + 1000);
    });
  });
});
