const licenseWhitelist = ['MIT', '0BSD', 'BSD-3-Clause', 'BSD-2-Clause', 'ISC']
const licenseOverrides = [
  {
    "namePrefix": "@chakra-ui",
    "licenseUrl": "https://raw.githubusercontent.com/chakra-ui/chakra-ui/main/LICENSE"
  },
  {
    "namePrefix": "toggle-selection",
    "licenseUrl": "https://raw.githubusercontent.com/sudodoki/toggle-selection/gh-pages/LICENSE"
  },
  {
    "namePrefix": "@uiw/react-textarea-code-editor",
    "licenseUrl": "https://raw.githubusercontent.com/uiwjs/react-textarea-code-editor/main/LICENSE"
  }
]


const tpnHeader = `Timerange Clipboard uses third party libraries listed below.

If you find that we accidentally failed to list a required notice, please let us
know in any way you can.

`

const tpnTemplate = (package) => `--------------------------------------------------------------------------------
${package.name} v${package.version}${package.author ? ' - '+package.author : ''}${package.repository ? '\n'+package.repository : ''}
--------------------------------------------------------------------------------

${package.licenseText}

`

const genThirdPartyNotices = async packages => {
  const overrides = await Promise.all(licenseOverrides.map(async e => {
    try {
      const response = await fetch(e.licenseUrl);
      if (!response.ok) {
        throw new Error(`failed to fetch ${e.licenseUrl}: ${response.statusText}`);
      }
      e["licenseText"] = await response.text();
    } catch (error) {
      console.error(`failed to fetch license for ${e.namePrefix}:`, error);
    }
    return e;
  }))
  return tpnHeader + packages.map(p => {
    const override = overrides.find(e => p.name.startsWith(e.namePrefix))
    if (override) p.licenseText = override.licenseText
    if (!p.licenseText) console.error(`no license text: ${p.name}`)
    if (!licenseWhitelist.includes(p.license)) console.error(`license not whitelisted: ${p.name}: ${p.license}`)
    return tpnTemplate(p)
  }).join('')
}

module.exports = genThirdPartyNotices
