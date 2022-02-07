const removeImports = require("next-remove-imports")()
const MomentLocalesPlugin = require('moment-locales-webpack-plugin')
const LicensePlugin = require('webpack-license-plugin')

module.exports = removeImports({
  basePath: '/dist',
  experimental: { esmExternals: true },
  webpack: (config) => {
    config.plugins.push(new MomentLocalesPlugin())
    config.plugins.push(
      new LicensePlugin({ outputFilename: 'oss-licenses-front.json' })
    )
    return config
  }
})
