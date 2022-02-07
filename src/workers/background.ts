import { ConfigV1, defaultConfigYaml, parseYamlConfigV1 } from '../lib/config'
import { parseTimeRange } from '../lib/utils'

let config: ConfigV1

chrome.storage.sync.get('configYaml', (item) => {
  if (item.configYaml) {
    config = parseYamlConfigV1(item.configYaml)
  } else {
    config = parseYamlConfigV1(defaultConfigYaml)
    chrome.storage.sync.set({ configYaml: defaultConfigYaml }, undefined)
  }
})

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName == 'sync' && changes.configYaml) {
    config = parseYamlConfigV1(changes.configYaml.newValue)
  }
})

const manifest = chrome.runtime.getManifest()
const activeIcons = manifest.icons
  ? Object.fromEntries(
      Object.entries(manifest.icons).map((e) => {
        e[1] = chrome.runtime.getURL(e[1])
        return e
      })
    )
  : {}
const inactiveIcons =
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  manifest.action && manifest.action.default_icon
    ? Object.fromEntries(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        Object.entries(manifest.action.default_icon as [string, string]).map(
          (e) => {
            e[1] = chrome.runtime.getURL(e[1])
            return e
          }
        )
      )
    : {}
const onActiveTabChange = (tab: chrome.tabs.Tab) => {
  const [, format] = parseTimeRange(config.urlFormats, tab)
  if (format) {
    chrome.action.setIcon({ path: activeIcons, tabId: tab.id }, undefined)
  } else {
    chrome.action.setIcon({ path: inactiveIcons, tabId: tab.id }, undefined)
  }
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    onActiveTabChange(tab)
  })
})

chrome.tabs.onUpdated.addListener((_tabId, change, tab) => {
  if (tab.active && (change.url || change.status)) {
    onActiveTabChange(tab)
  }
})

chrome.windows.onFocusChanged.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab) return
    onActiveTabChange(tab)
  })
})

export {}
