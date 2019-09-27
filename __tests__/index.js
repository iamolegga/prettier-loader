const fs = require('fs');
const path = require('path');
const prettier = require('prettier');
// eslint-disable-next-line node/no-unpublished-require
const rimraf = require('rimraf');
// eslint-disable-next-line node/no-unpublished-require
const webpack = require('webpack');
const __clearIgnoreManager = require('../prettier-loader').__clearIgnoreManager;

/**
 * Helpers
 */

let testFolder;
const SEPARATOR = path.sep;
const loader = path.resolve(__dirname, '..', 'prettier-loader.js');
const testsParentFolder = path.join(
  __dirname,
  '..',
  '..',
  'prettier-loader-tests'
);

function prepare(webpackConfiguration, files, entryFileName) {
  const testFiles = Object.keys(files).reduce((acc, fileName) => {
    const fullPath = path.join(testFolder, fileName);
    const content = files[fileName];
    fs.writeFileSync(fullPath, content);
    acc[fullPath] = content;
    return acc;
  }, {});

  return new Promise((resolve, reject) => {
    webpack(
      Object.assign({}, webpackConfiguration, {
        entry: `.${SEPARATOR}${entryFileName}`,
        output: { path: `${testFolder}${SEPARATOR}prettierLoaderProcessed` },
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
  test('should work without loader-options and .prettierrc file', async () => {
    const entryFile = 'index.js';

    const files = {
      [entryFile]: `${'very().'.repeat(20)}long("chaining")`,
    };

    const webpackConfiguration = getWebpackConfigWithRules([
      { test: /\.js$/, use: { loader } },
    ]);

    const testFiles = await prepare(webpackConfiguration, files, entryFile);
    const entryPath = Object.keys(testFiles)[0];
    const entryContent = getContent(entryPath);
    expect(prettier.check(entryContent)).toBe(true);
  });

  test('should work with loader-options', async () => {
    const entryFile = 'index.js';

    const prettierOptions = { tabWidth: 8 };

    const files = {
      [entryFile]: `${'very().'.repeat(20)}long("chaining")`,
    };

    const webpackConfiguration = getWebpackConfigWithRules([
      {
        test: /\.js$/,
        use: { loader, options: prettierOptions },
      },
    ]);

    const testFiles = await prepare(webpackConfiguration, files, entryFile);
    const entryPath = Object.keys(testFiles)[0];
    const entryContent = getContent(entryPath);
    expect(prettier.check(entryContent, prettierOptions)).toBe(true);
  });

  test('should work with .prettierrc file', async () => {
    const entryFile = 'index.js';

    const prettierOptions = { tabWidth: 8 };

    const files = {
      [entryFile]: `${'very().'.repeat(20)}long("chaining")`,
      '.prettierrc': JSON.stringify(prettierOptions),
    };

    const webpackConfiguration = getWebpackConfigWithRules([
      { test: /\.js$/, use: { loader } },
    ]);

    const testFiles = await prepare(webpackConfiguration, files, entryFile);
    const entryPath = Object.keys(testFiles).find(k => k.includes(entryFile));
    const entryContent = getContent(entryPath);
    expect(prettier.check(entryContent, prettierOptions)).toBe(true);
  });

  test('should work with loader-options and .prettierrc file', async () => {
    const entryFile = 'index.js';

    // create both, but loader rules should override prettierrc
    const prettierrcOptions = { tabWidth: 8, singleQuote: true };
    const loaderOptions = { tabWidth: 4 };

    const files = {
      [entryFile]: `${'very().'.repeat(20)}long("chaining")`,
      '.prettierrc': JSON.stringify(prettierrcOptions),
    };

    const webpackConfiguration = getWebpackConfigWithRules([
      {
        test: /\.js$/,
        use: { loader, options: loaderOptions },
      },
    ]);

    const testFiles = await prepare(webpackConfiguration, files, entryFile);
    const entryPath = Object.keys(testFiles).find(k => k.includes(entryFile));
    const entryContent = getContent(entryPath);
    expect(
      prettier.check(
        entryContent,
        Object.assign({}, prettierrcOptions, loaderOptions)
      )
    ).toBe(true);
  });

  test('should not rewrite entry file when skipRewritingSource is true', async () => {
    const entryFile = 'index.js';

    const prettierOptions = { tabWidth: 8 };

    const files = {
      [entryFile]: `${'very().'.repeat(20)}long("chaining")`,
    };

    const webpackConfiguration = getWebpackConfigWithRules([
      {
        test: /\.js$/,
        use: {
          loader,
          options: Object.assign({}, prettierOptions, {
            skipRewritingSource: true,
          }),
        },
      },
    ]);

    const testFiles = await prepare(webpackConfiguration, files, entryFile);
    const entryPath = Object.keys(testFiles)[0];
    const entryContent = getContent(entryPath);
    // entry file is not processed
    expect(prettier.check(entryContent)).toBe(false);
    // entry file is left unchanged
    expect(entryContent === testFiles[entryPath]).toBe(true);
  });
});

describe('ignoring', () => {
  const MATRIX_CODE = `matrix(
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
  )`;

  test('should ignore using comments', async () => {
    const entryFile = 'index.js';

    const files = {
      [entryFile]: `
${'very().'.repeat(20)}long("chaining")
// prettier-ignore
${MATRIX_CODE}`,
    };

    const webpackConfiguration = getWebpackConfigWithRules([
      { test: /\.js$/, use: { loader } },
    ]);

    const testFiles = await prepare(webpackConfiguration, files, entryFile);
    const entryPath = Object.keys(testFiles).find(k => k.includes(entryFile));
    const entryContent = getContent(entryPath);
    expect(entryContent).toMatch(MATRIX_CODE);
  });

  test('should ignore using .prettierignore', async () => {
    const entryFile = 'index.js';

    const files = {
      [entryFile]: MATRIX_CODE,
      '.prettierignore': entryFile,
    };

    const webpackConfiguration = getWebpackConfigWithRules([
      { test: /\.js$/, use: { loader } },
    ]);

    const testFiles = await prepare(webpackConfiguration, files, entryFile);
    const entryPath = Object.keys(testFiles).find(k => k.includes(entryFile));
    const entryContent = getContent(entryPath);
    expect(entryContent).toMatch(MATRIX_CODE);
  });
});
