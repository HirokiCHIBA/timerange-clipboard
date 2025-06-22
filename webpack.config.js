const path = require('path')
const ESLintPlugin = require('eslint-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MomentLocalesPlugin = require('moment-locales-webpack-plugin')
const LicensePlugin = require('webpack-license-plugin')
const VirtualModulesPlugin = require('webpack-virtual-modules')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { DefinePlugin } = require('webpack')

const { PageModules, ThirdPartiyNotices } = require('./webpack.utils.js')

const OUTPUT_DIR = 'package'
const INTER_DIR = '.build'

const LICENSE_ALLOW_LIST = [
  'MIT',
  '0BSD',
  'BSD-3-Clause',
  'BSD-2-Clause',
  'ISC',
  'Apache-2.0',
]
const LICENSE_TYPE_OVERRIDES = {
  '@pandacss/is-valid-prop@0.53.6': 'MIT',
}
const LICENSE_TEXT_OVERRIDES = [
  {
    namePrefix: '@uiw/react-textarea-code-editor',
    textUrl:
      'https://raw.githubusercontent.com/uiwjs/react-textarea-code-editor/main/LICENSE',
  },
]

module.exports = (_env, argv) => {
  const pageModules = new PageModules('src/pages')

  const licenseCommonConfig = {
    licenseOverrides: LICENSE_TYPE_OVERRIDES,
    unacceptableLicenseTest: (license) => !LICENSE_ALLOW_LIST.includes(license),
  }

  const manifest = require('./manifest.json')
  const versionOverride = process.env.CI
    ? manifest.version
    : manifest.version + '+local'
  const definitions = {
    VERSION: JSON.stringify(versionOverride),
  }

  const commonConfig = {
    mode: 'development',
    devtool: argv.mode == 'production' ? undefined : 'inline-source-map',
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          loader: 'ts-loader',
        },
        {
          test: /\.(css)$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: { url: false },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json', '.css'],
    },
  }

  return [
    {
      ...commonConfig,
      name: 'renderer',
      target: 'node',
      entry: pageModules.entries,
      output: {
        path: path.join(__dirname, INTER_DIR),
        library: {
          type: 'commonjs2',
          export: 'default',
        },
      },
      plugins: [
        new CleanWebpackPlugin(),
        new DefinePlugin(definitions),
        new MomentLocalesPlugin(),
        new VirtualModulesPlugin(pageModules.getRendererModules()),
        new LicensePlugin({
          ...licenseCommonConfig,
          outputFilename: 'licenses.renderer.json',
        }),
      ],
    },
    {
      ...commonConfig,
      name: 'browser',
      dependencies: ['renderer'],
      entry: {
        background: './src/workers/background.ts',
        ...pageModules.entries,
      },
      output: {
        path: path.join(__dirname, OUTPUT_DIR),
        filename: (pathData) => {
          return ['background', ...pageModules.keys].includes(
            pathData.chunk.name,
          )
            ? '[name].js'
            : 'chunks/[name].js'
        },
      },
      optimization: {
        minimizer: [
          new TerserPlugin({
            extractComments: false,
            terserOptions: {
              format: {
                comments: false,
              },
            },
          }),
        ],
        splitChunks: {
          chunks: (chunk) => chunk.name !== 'background',
        },
      },
      plugins: [
        new CleanWebpackPlugin(),
        new DefinePlugin(definitions),
        new CopyWebpackPlugin({
          patterns: [
            { from: 'assets/dist/package', to: 'assets' },
            {
              from: 'manifest.json',
              transform(buf) {
                const manifest = JSON.parse(buf.toString('utf-8'))
                manifest.version = versionOverride
                return Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8')
              },
            },
          ],
        }),
        new ESLintPlugin({
          fix: true,
          extensions: ['ts', 'tsx'],
          exclude: [
            'node_modules/**/*',
            'package/**/*',
            '.build/**/*',
            '.virtual/**/*',
          ],
        }),
        new MomentLocalesPlugin(),
        new VirtualModulesPlugin(pageModules.getBrowserModules()),
        ...pageModules.keys.map(
          (key) =>
            new HtmlWebpackPlugin({
              title: '',
              chunks: [key],
              filename: `${key}.html`,
              templateContent: () =>
                require(path.resolve(INTER_DIR, `${key}.js`)),
            }),
        ),
        new LicensePlugin({
          ...licenseCommonConfig,
          outputFilename: path.join(
            path.relative(OUTPUT_DIR, INTER_DIR),
            'licenses.browser.json',
          ),
          additionalFiles: {
            'THIRD-PARTY-NOTICES.txt': (browser) => {
              const renderer = require(
                path.resolve(INTER_DIR, 'licenses.renderer.json'),
              )
              return ThirdPartiyNotices.generate(
                [...new Set([...renderer, ...browser])],
                LICENSE_TEXT_OVERRIDES,
              )
            },
          },
        }),
      ],
    },
  ]
}
