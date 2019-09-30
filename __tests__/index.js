var fs = require('fs');
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
var loader = path.resolve(__dirname, '..', 'prettier-loader.js');
var testsParentFolder = path.join(
  __dirname,
  '..',
  '..',
  'prettier-loader-tests'
);

function prepare(webpackConfiguration, files, entryFileName) {
  var testFiles = Object.keys(files).reduce((acc, fileName) => {
    var fullPath = path.join(testFolder, fileName);
    var content = files[fileName];
    fs.writeFileSync(fullPath, content);
    acc[fullPath] = content;
    return acc;
  }, {});

  return new Promise((resolve, reject) => {
    webpack(
      Object.assign({}, webpackConfiguration, {
        entry: `.${SEPARATOR}${entryFileName}`,
        output: { path: testFolder },
      })
    ).run((error, stats) => {
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

function getWebpackConfigWithRules(rules) {
  return {
    context: testFolder,
    module: { rules },
  };
}

function getContent(path) {
  return fs.readFileSync(path).toString('utf8');
}

/**
 * Tests settings
 */

beforeAll(() => {
  fs.mkdirSync(testsParentFolder);
});

afterAll(() => {
  rimraf.sync(testsParentFolder);
});

beforeEach(() => {
  testFolder = fs.mkdtempSync(`${testsParentFolder}${SEPARATOR}`);
});

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
      { test: /\.js$/, use: { loader } },
    ]);

    return prepare(webpackConfiguration, files, entryFile).then(testFiles => {
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
        use: { loader, options: prettierOptions },
      },
    ]);

    return prepare(webpackConfiguration, files, entryFile).then(testFiles => {
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
      { test: /\.js$/, use: { loader } },
    ]);

    return prepare(webpackConfiguration, files, entryFile).then(testFiles => {
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
        use: { loader, options: loaderOptions },
      },
    ]);

    return prepare(webpackConfiguration, files, entryFile).then(testFiles => {
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
      { test: /\.js$/, use: { loader } },
    ]);

    return prepare(webpackConfiguration, files, entryFile).then(testFiles => {
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
      { test: /\.js$/, use: { loader } },
    ]);

    return prepare(webpackConfiguration, files, entryFile).then(testFiles => {
      var entryPath = Object.keys(testFiles).find(k => k.includes(entryFile));
      var entryContent = getContent(entryPath);

      expect(entryContent).toMatch(MATRIX_CODE);
    });
  });
});
