var fs = require('fs');
var os = require('os');
var path = require('path');
var prettier = require('prettier');
var cosmiconfig = require('cosmiconfig');

var promisedConfig = cosmiconfig('prettier')
  .load(process.cwd())
  .then(result => (result ? result.config : {}), () => ({}));

// eslint-disable-next-line node/no-unpublished-require
var rimraf = require('rimraf');
// eslint-disable-next-line node/no-unpublished-require
var webpack = require('webpack');

var folder;
var compiler;
var sourceName;
var loaderOptions = {
  tabWidth: 8,
};

beforeEach(() => {
  folder = fs.mkdtempSync(`${os.tmpdir()}${path.sep}`);

  sourceName = `/${folder}/source.js`;
  var sourceContent = `${'very().'.repeat(20)}long("chaining")`;
  var indexName = `/${folder}/index.js`;
  var indexContent = `require('./source.js')`;

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
      var prettierOptions = Object.assign({}, config, loaderOptions);
      var content = fs.readFileSync(sourceName).toString('utf8');

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
