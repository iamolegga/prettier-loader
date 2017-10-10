const fs = require('fs');
const os = require('os');
const path = require('path');
const prettier = require('prettier');
const cosmiconfig = require('cosmiconfig');

const promisedConfig = cosmiconfig('prettier')
  .load(process.cwd())
  .then(result => (result ? result.config : {}), () => ({}));

// eslint-disable-next-line node/no-unpublished-require
const rimraf = require('rimraf');
// eslint-disable-next-line node/no-unpublished-require
const webpack = require('webpack');

let folder;
let compiler;
let sourceName;
const loaderOptions = {
  tabWidth: 8,
};

beforeEach(() => {
  folder = fs.mkdtempSync(`${os.tmpdir()}${path.sep}`);

  sourceName = `/${folder}/source.js`;
  const sourceContent = `${'very().'.repeat(20)}long("chaining")`;
  const indexName = `/${folder}/index.js`;
  const indexContent = `require('./source.js')`;

  fs.writeFileSync(sourceName, sourceContent);
  fs.writeFileSync(indexName, indexContent);

  compiler = webpack({
    entry: indexName,
    output: {
      path: folder,
    },
    context: '/',
    module: {
      rules: [
        {
          test: /\.js$/,
          use: {
            loader: 'prettier-loader',
            options: loaderOptions,
          },
        },
      ],
    },
    resolveLoader: {
      modules: [path.join(__dirname, '..'), 'node_modules'],
    },
  });
});

afterEach(() => {
  rimraf.sync(folder);
});

test('should format source with config', done => {
  compiler.run((error, stats) => {
    if (error) {
      done(error);
    }

    if (stats.hasErrors()) {
      done(stats.toJson().errors);
    }

    promisedConfig.then(config => {
      const prettierOptions = Object.assign({}, config, loaderOptions);
      const content = fs.readFileSync(sourceName).toString('utf8');

      // check prettier changed source file
      expect(prettier.check(content, prettierOptions)).toBe(true);

      // check getting options from cosmiconfig
      expect(content).toMatch("'chaining'");
      expect(content).toMatch(');');

      // check getting options from loader
      expect(content).toMatch(');');
      done();
    });
  });
});
