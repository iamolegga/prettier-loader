const fs = require('fs');
const path = require('path');
const prettier = require('prettier');
const rimraf = require('rimraf');
const webpack4 = require('webpack');
const webpack3 = require('webpack3');
const webpack2 = require('webpack2');
const __clearIgnoreManager = require('../prettier-loader').__clearIgnoreManager;

/**
 * Loaders
 */

const loader = path.resolve(__dirname, '..', 'prettier-loader.js');
const checkOutputLoader = path.resolve(
  __dirname,
  'utils',
  'check-output-loader.js'
);

/**
 * Helpers
 */

let testFolder;
const SEPARATOR = path.sep;
const testsParentFolder = path.join(
  __dirname,
  '..',
  '..',
  'prettier-loader-tests'
);

function prepare(engine, webpackConfiguration, files, entryFileName) {
  const testFiles = Object.keys(files).reduce((acc, fileName) => {
    const fullPath = path.join(testFolder, fileName);
    const content = files[fileName];
    fs.writeFileSync(fullPath, content);
    acc[fullPath] = content;
    return acc;
  }, {});

  return new Promise((resolve, reject) => {
    engine(
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
 * Code examples
 */

const MATRIX_CODE = `matrix(
  1, 0, 0,
  0, 1, 0,
  0, 0, 1
)`;

const CHAINING_CODE = `${'very().'.repeat(20)}long("chaining")`;

/**
 * Tests settings
 */

beforeAll(() => {
  rimraf.sync(testsParentFolder);
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

const engines = [webpack4, webpack3, webpack2];
let currentVersion = 4;

/**
 * Tests
 */

for (const webpack of engines) {
  describe(`testing against webpack@${currentVersion--}`, () => {
    describe('pass options', () => {
      test('should work without loader-options and .prettierrc file', async () => {
        const entryFile = 'index.js';
        const files = { [entryFile]: CHAINING_CODE };

        const webpackConfiguration = getWebpackConfigWithRules([
          { test: /\.js$/, use: { loader } },
        ]);

        const testFiles = await prepare(
          webpack,
          webpackConfiguration,
          files,
          entryFile
        );
        const entryPath = Object.keys(testFiles)[0];
        const entryContent = getContent(entryPath);
        expect(prettier.check(entryContent)).toBe(true);
      });

      test('should work with loader-options', async () => {
        const entryFile = 'index.js';

        const prettierOptions = { tabWidth: 8 };

        const files = { [entryFile]: CHAINING_CODE };

        const webpackConfiguration = getWebpackConfigWithRules([
          { test: /\.js$/, use: { loader, options: prettierOptions } },
        ]);

        const testFiles = await prepare(
          webpack,
          webpackConfiguration,
          files,
          entryFile
        );
        const entryPath = Object.keys(testFiles)[0];
        const entryContent = getContent(entryPath);
        expect(prettier.check(entryContent, prettierOptions)).toBe(true);
      });

      test('should work with .prettierrc file', async () => {
        const entryFile = 'index.js';

        const prettierOptions = { tabWidth: 8 };

        const files = {
          [entryFile]: CHAINING_CODE,
          '.prettierrc': JSON.stringify(prettierOptions),
        };

        const webpackConfiguration = getWebpackConfigWithRules([
          { test: /\.js$/, use: { loader } },
        ]);

        const testFiles = await prepare(
          webpack,
          webpackConfiguration,
          files,
          entryFile
        );
        const entryPath = Object.keys(testFiles).find(k =>
          k.includes(entryFile)
        );
        const entryContent = getContent(entryPath);
        expect(prettier.check(entryContent, prettierOptions)).toBe(true);
      });

      test('should work with loader-options and .prettierrc file', async () => {
        const entryFile = 'index.js';

        // create both, but loader rules should override prettierrc
        const prettierrcOptions = { tabWidth: 8, singleQuote: true };
        const loaderOptions = { tabWidth: 4 };

        const files = {
          [entryFile]: CHAINING_CODE,
          '.prettierrc': JSON.stringify(prettierrcOptions),
        };

        const webpackConfiguration = getWebpackConfigWithRules([
          { test: /\.js$/, use: { loader, options: loaderOptions } },
        ]);

        const testFiles = await prepare(
          webpack,
          webpackConfiguration,
          files,
          entryFile
        );
        const entryPath = Object.keys(testFiles).find(k =>
          k.includes(entryFile)
        );
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

        const files = { [entryFile]: CHAINING_CODE };

        const mockCheckResult = jest.fn();

        const webpackConfiguration = getWebpackConfigWithRules([
          {
            test: /\.js$/,
            use: [
              {
                loader: checkOutputLoader,
                options: { checkResult: mockCheckResult },
              },
              {
                loader,
                options: { ...prettierOptions, skipRewritingSource: true },
              },
            ],
          },
        ]);

        const testFiles = await prepare(
          webpack,
          webpackConfiguration,
          files,
          entryFile
        );
        const entryPath = Object.keys(testFiles)[0];
        const entryContent = getContent(entryPath);
        // entry file is not processed
        expect(prettier.check(entryContent, prettierOptions)).toBe(false);
        // entry file is left unchanged
        expect(entryContent === testFiles[entryPath]).toBe(true);
        // output stream is changed
        expect(mockCheckResult.mock.calls.length).toBe(1);
        expect(mockCheckResult.mock.calls[0][0]).not.toBe(entryContent);
        expect(
          prettier.check(mockCheckResult.mock.calls[0][0], prettierOptions)
        ).toBe(true);
      });
    });

    describe('ignoring', () => {
      test('should ignore using comments', async () => {
        const entryFile = 'index.js';

        const files = {
          [entryFile]: `
${CHAINING_CODE}
// prettier-ignore
${MATRIX_CODE}`,
        };

        const webpackConfiguration = getWebpackConfigWithRules([
          { test: /\.js$/, use: { loader } },
        ]);

        const testFiles = await prepare(
          webpack,
          webpackConfiguration,
          files,
          entryFile
        );
        const entryPath = Object.keys(testFiles).find(k =>
          k.includes(entryFile)
        );
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

        const testFiles = await prepare(
          webpack,
          webpackConfiguration,
          files,
          entryFile
        );
        const entryPath = Object.keys(testFiles).find(k =>
          k.includes(entryFile)
        );
        const entryContent = getContent(entryPath);
        expect(entryContent).toMatch(MATRIX_CODE);
      });
    });
  });
}
