const path = require('path')
const glob = require('glob')
const TerserPlugin = require('terser-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MomentLocalesPlugin = require('moment-locales-webpack-plugin')
const LicensePlugin = require('webpack-license-plugin')

const genThirdPartyNotices = require('./gen-third-party-notices')

module.exports = (env, argv) => {
  const pageDir = './src/pages'
  const pages = Object.fromEntries(
    glob
      .sync('**/*.tsx', {
        cwd: pageDir,
        ignore: '**/_*.tsx',
      })
      .map((key) => [key.replace(/\.tsx/, ''), path.resolve(pageDir, key)])
  )
  const entries = {
    background: './src/workers/background.ts',
    ...pages,
  }

  return {
    mode: 'development',
    entry: entries,
    output: {
      path: path.join(__dirname, 'package/dist'),
      filename: (pathData) => {
        return Object.hasOwn(entries, pathData.chunk.name) ? '[name].js' : 'chunks/[name].js'
      },
    },
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
    devtool: argv.mode == 'production' ? undefined : 'inline-source-map',
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
        chunks: 'all',
      },
    },
    plugins: [
      new MomentLocalesPlugin(),
      new LicensePlugin({
        additionalFiles: {
          'THIRD-PARTY-NOTICES.txt': genThirdPartyNotices,
        },
      }),
      ...Object.keys(pages).map(
        (page) =>
          new HtmlWebpackPlugin({
            title: '',
            chunks: [page],
            filename: `${page}.html`,
          })
      ),
      new CleanWebpackPlugin(),
    ],
  }
}
