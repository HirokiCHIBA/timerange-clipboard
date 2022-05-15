const path = require('path')
const TerserPlugin = require('terser-webpack-plugin')
const MomentLocalesPlugin = require('moment-locales-webpack-plugin')
const LicensePlugin = require('webpack-license-plugin')

const genThirdPartyNotices = require('./gen-third-party-notices')

module.exports = {
  entry: {
    background: './src/workers/background.ts',
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ["next/babel"],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'package/dist'),
  },
  plugins: [
    new MomentLocalesPlugin(),
    new LicensePlugin({
      outputFilename: '../../.next/oss-licenses-back.json',
      additionalFiles: {
        'THIRD-PARTY-NOTICES.txt': genThirdPartyNotices
      }
    }),
  ],
  optimization: {
    minimizer: [new TerserPlugin({
      extractComments: false,
      terserOptions: {
        format: {
          comments: false,
        },
      },
    })]
  },
  devtool: 'cheap-module-source-map'
}
