const fs = require('fs');
const path = require('path');
const prettier = require('prettier');
const rimraf = require('rimraf');
const webpack4 = require('webpack');
const webpack3 = require('webpack3');
const webpack2 = require('webpack2');
const __clearIgnoreManager = require('../prettier-loader').__clearIgnoreManager;

// loaders

const loader = path.resolve(__dirname, '..', 'prettier-loader.js');
const watchHelper = path.resolve(__dirname, '..', 'watch-helper.js');
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

function writeFiles(filesContentMap) {
  return Object.entries(filesContentMap).reduce((acc, [fileName, content]) => {
    const fullPath = path.join(testFolder, fileName);
    fs.writeFileSync(fullPath, content);
    acc[fullPath] = content;
    return acc;
  }, {});
}

function getCompiler(webpack, webpackConfiguration, entryFileName) {
  return webpack(
    Object.assign({}, webpackConfiguration, {
      entry: `.${SEPARATOR}${entryFileName}`,
      output: { path: testFolder },
    })
  );
}

function runCompiler(
  webpack,
  webpackConfiguration,
  filesContentMap,
  entryFileName
) {
  const files = writeFiles(filesContentMap);
  const compiler = getCompiler(webpack, webpackConfiguration, entryFileName);
  return new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
      if (error) return reject(error);
      if (stats.hasErrors()) return reject(stats.toJson().errors);
      resolve(files);
    });
  });
}

function watchCompiler(
  webpack,
  webpackConfiguration,
  files,
  entryFileName,
  watchOpts,
  cb
) {
  var testFiles = writeFiles(files);
  var webpackCompiler = getCompiler(
    webpack,
    webpackConfiguration,
    entryFileName
  );

  return webpackCompiler.watch(watchOpts, (error, stats) =>
    cb(error, stats, testFiles)
  );
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

const MATRIX_CODE = `matrix(
  1, 0, 0,
  0, 1, 0,
  0, 0, 1
)`;

const CHAINING_CODE = `${'very().'.repeat(20)}long("chaining")`;

const engines = [webpack4, webpack3, webpack2];
let maxVersion = 4;

for (const webpack of engines) {
  describe(`testing against webpack@${maxVersion--}`, () => {
    describe('pass options', () => {
      test('should work without loader-options and .prettierrc file', async () => {
        const entryFile = 'index.js';

        const files = { [entryFile]: CHAINING_CODE };

        const webpackConfiguration = getWebpackConfigWithRules([
          { test: /\.js$/, use: { loader } },
        ]);

        const testFiles = await runCompiler(
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
          {
            test: /\.js$/,
            use: { loader, options: prettierOptions },
          },
        ]);

        const testFiles = await runCompiler(
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

        const testFiles = await runCompiler(
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
          {
            test: /\.js$/,
            use: { loader, options: loaderOptions },
          },
        ]);

        const testFiles = await runCompiler(
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
                options: {
                  checkResult: mockCheckResult,
                },
              },
              {
                loader,
                options: Object.assign({}, prettierOptions, {
                  skipRewritingSource: true,
                }),
              },
            ],
          },
        ]);

        const testFiles = await runCompiler(
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

        const testFiles = await runCompiler(
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

        const testFiles = await runCompiler(
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

    describe('watch mode', () => {
      test('should emit changes only once', done => {
        const entryFile = 'index.js';

        const files = { [entryFile]: MATRIX_CODE };

        const webpackConfiguration = getWebpackConfigWithRules([
          {
            test: /\.js$/,
            use: { loader, options: { watch: true } },
          },
          {
            test: /\.js$/,
            use: { loader: watchHelper },
          },
        ]);

        const watchOpts = { poll: 1000 };

        let resolveFirstChangeWaiting;
        const waitForFirstChangeOnStart = new Promise(r => {
          resolveFirstChangeWaiting = r;
        });

        let changesCount = 0;
        const cb = (error, stats, watchFiles) => {
          console.log({ stats, watchFiles });
          if (changesCount == 0) {
            resolveFirstChangeWaiting();
            fs.writeFileSync(Object.keys(watchFiles)[0], MATRIX_CODE);
          }
          changesCount++;
        };

        const watcher = watchCompiler(
          webpack,
          webpackConfiguration,
          files,
          entryFile,
          watchOpts,
          cb
        );

        waitForFirstChangeOnStart.then(() => {
          setTimeout(() => {
            expect(changesCount).toBe(2);
            watcher.close(done);
          }, watchOpts.poll * 3 + 1000);
        });
      });
    });
  });
}
