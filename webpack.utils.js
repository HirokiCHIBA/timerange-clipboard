const path = require('path')
const glob = require('glob')

class PageModules {
  #rootDir
  #vModuleDir = '.virtual'

  constructor(rootDir) {
    this.#rootDir = rootDir
    this.keys = glob
      .sync('**/*.tsx', {
        cwd: this.#rootDir,
        ignore: '**/_*.tsx',
      })
      .map((key) => key.replace(/\.tsx/, ''))

    this.entries = Object.fromEntries(
      this.keys.map((key) => [
        key,
        path.resolve(this.#vModuleDir, `${key}.tsx`),
      ]),
    )
  }

  #htmlTemplate = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title></title>
  </head>
  <body>
    <div id="root"><!--APP--></div>
  </body>
</html>`

  getRendererModules() {
    return Object.fromEntries(
      this.keys.map((key) => [
        this.entries[key],
        `
        import { renderToString } from 'react-dom/server'
        import App from '${path.join(path.relative(this.#vModuleDir, this.#rootDir), '_app')}'
        import Page from '${path.join(path.relative(this.#vModuleDir, this.#rootDir), key)}'
        const markup = renderToString(<App><Page /></App>)
        const templateContent = \`${this.#htmlTemplate}\`.replace('<!--APP-->', markup)
        export default templateContent
      `,
      ]),
    )
  }

  getBrowserModules() {
    return Object.fromEntries(
      this.keys.map((key) => [
        this.entries[key],
        `
        import { hydrateRoot } from 'react-dom/client'
        import App from '${path.join(path.relative(this.#vModuleDir, this.#rootDir), '_app')}'
        import Page from '${path.join(path.relative(this.#vModuleDir, this.#rootDir), key)}'
        const root = document.getElementById('root')
        if (!root) throw new Error('Root element not found.')
        hydrateRoot(root, <App><Page /></App>)
      `,
      ]),
    )
  }
}

class ThirdPartiyNotices {
  static #header = `Timerange Clipboard uses third party libraries listed below.

If you find that we accidentally failed to list a required notice, please let us
know in any way you can.

`

  static #template(pkg) {
    return `--------------------------------------------------------------------------------
${pkg.name} v${pkg.version}${pkg.author ? ' - ' + pkg.author : ''}${pkg.repository ? '\n' + pkg.repository : ''}
--------------------------------------------------------------------------------

${pkg.licenseText}

`
  }

  static async generate(packages, textOverrides) {
    const overrides = await Promise.all(
      textOverrides.map(async (e) => {
        const response = await fetch(e.textUrl)
        if (!response.ok) {
          throw new Error(
            `failed to fetch ${e.textUrl} for ${e.namePrefix}: ${response.statusText}`,
          )
        }
        e['licenseText'] = await response.text()
        return e
      }),
    )
    return (
      this.#header +
      packages
        .map((p) => {
          const override = overrides.find((e) =>
            p.name.startsWith(e.namePrefix),
          )
          if (override) p.licenseText = override.licenseText
          if (!p.licenseText) throw new Error(`no license text: ${p.name}`)
          return this.#template(p)
        })
        .join('')
    )
  }
}

module.exports = { PageModules, ThirdPartiyNotices }
