const path = require('path')
const MomentLocalesPlugin = require('moment-locales-webpack-plugin')
const LicensePlugin = require('webpack-license-plugin')

const genThirdPartyNotices = require('./gen-third-party-notices')

module.exports = {
  entry: './src/workers/background.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              "@babel/preset-typescript",
              "@babel/preset-env"
            ],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'background.js',
    path: path.resolve(__dirname, 'package/dist'),
  },
  plugins: [
    new MomentLocalesPlugin(),
    new LicensePlugin({
      outputFilename: '../../.next/oss-licenses-back.json',
      additionalFiles: {
        'THIRD-PARTY-NOTICES.txt': genThirdPartyNotices
      }
    })
  ]
}
