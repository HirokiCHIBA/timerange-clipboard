import { ToastManager } from '../components/Toast'
import {
  ConfigV1,
  defaultConfigYaml,
  parseYamlConfigV1,
  TimeDisplayOptions,
  URLFormat,
} from '../lib/config'
import {
  applyTimeRange,
  displayTimeRange,
  displayTimeZone,
  parseTimeRange,
  TimeRange,
} from '../lib/utils'

let config: ConfigV1
chrome.storage.sync.get('configYaml', (item) => {
  if (item.configYaml) {
    config = parseYamlConfigV1(item.configYaml)
  } else {
    config = parseYamlConfigV1(defaultConfigYaml)
    chrome.storage.sync.set({ configYaml: defaultConfigYaml }, undefined)
  }
  updateTimeDisplayOptions()
})
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName == 'sync' && changes.configYaml) {
    config = parseYamlConfigV1(changes.configYaml.newValue)
    updateTimeDisplayOptions()
    updateTitle()
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

let timeDisplayOptions: TimeDisplayOptions
const updateTimeDisplayOptions = () => {
  timeDisplayOptions = matchFormat
    ? { ...config.timeDisplayOptions, ...matchFormat.timeDisplayOptions }
    : config.timeDisplayOptions
}

let clippedTimeRange: TimeRange | null
chrome.storage.local.get('timeRange', (item) => {
  if (item.timeRange) clippedTimeRange = item.timeRange as TimeRange
  updateTitle()
})
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName == 'local' && changes.timeRange) {
    clippedTimeRange = changes.timeRange.newValue as TimeRange
    updateTitle()
  }
})

const updateTitle = () => {
  const title = clippedTimeRange
    ? `${manifest.name}\nClipped: ${displayTimeRange(
        clippedTimeRange,
        timeDisplayOptions
      )} (${displayTimeZone(timeDisplayOptions)})`
    : manifest.name
  chrome.action.setTitle({ title: title }, undefined)
}

let currentTab: chrome.tabs.Tab | null
let matchFormat: URLFormat | null
let timeRange: TimeRange | null
const onActiveTabChange = (tab: chrome.tabs.Tab) => {
  currentTab = tab
  ;[timeRange, matchFormat] = parseTimeRange(config.urlFormats, tab)
  if (matchFormat) {
    chrome.action.setIcon({ path: activeIcons, tabId: tab.id }, undefined)
  } else {
    chrome.action.setIcon({ path: inactiveIcons, tabId: tab.id }, undefined)
  }
  updateTimeDisplayOptions()
  updateTitle()
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

const toastManager = new ToastManager()
const toastPropsUnsupported = { title: 'Unsupported page' }
const toastPropsEmpty = { title: 'Empty clipboard' }
const toastProps = (command: string, range: TimeRange) => ({
  title: command,
  message: displayTimeRange(range, timeDisplayOptions),
  contextMessage: displayTimeZone(timeDisplayOptions),
})
chrome.commands.onCommand.addListener((command) => {
  if (command == 'copy') {
    if (!timeRange) {
      currentTab && toastManager.notify(currentTab, toastPropsUnsupported)
      return
    }
    const range = timeRange
    chrome.storage.local.set({ timeRange: timeRange }, () => {
      currentTab && toastManager.notify(currentTab, toastProps('Copy', range))
    })
  }
  if (command == 'paste') {
    if (!currentTab) return
    if (!matchFormat) {
      toastManager.notify(currentTab, toastPropsUnsupported)
      return
    }
    if (!clippedTimeRange) {
      toastManager.notify(currentTab, toastPropsEmpty)
      return
    }
    const range = clippedTimeRange
    void applyTimeRange(currentTab, clippedTimeRange, matchFormat).then(
      (tab) => {
        tab && toastManager.notify(tab, toastProps('Paste', range), true)
      }
    )
  }
})

export {}
