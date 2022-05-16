import { ToastManager } from '../components/Toast'
import { defaultConfigYaml, parseYamlConfigV1 } from '../lib/config'
import { store, actions } from '../lib/state'
import {
  applyTimeRange,
  displayTimeRange,
  displayTimeZone,
  TimeRange,
} from '../lib/utils'

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

// view
store.subscribe(() => {
  const s = store.getState()

  if (s.activeURLFormat) {
    void chrome.action.setIcon({ path: activeIcons, tabId: s.activeTab?.id })
  } else {
    void chrome.action.setIcon({ path: inactiveIcons, tabId: s.activeTab?.id })
  }

  const title = s.clippedTimeRange
    ? `${manifest.name}\nClipped: ${displayTimeRange(
        s.clippedTimeRange,
        s.activeTimeDisplayOptions
      )} (${displayTimeZone(s.activeTimeDisplayOptions)})`
    : manifest.name
  void chrome.action.setTitle({ title })
})

// toast
const toastManager = new ToastManager()
const toastPropsUnsupported = { title: 'Unsupported page' }
const toastPropsEmpty = { title: 'Empty clipboard' }

// functions for keyboard shortcuts
const doCopy = () => {
  const s = store.getState()
  if (!s.activeTimeRange) {
    s.activeTab && toastManager.notify(s.activeTab, toastPropsUnsupported)
    return
  }
  const toastProps = {
    title: 'Copy',
    message: displayTimeRange(s.activeTimeRange, s.activeTimeDisplayOptions),
    contextMessage: displayTimeZone(s.activeTimeDisplayOptions),
  }
  void chrome.storage.local.set({ timeRange: s.activeTimeRange }).then(() => {
    s.activeTab && toastManager.notify(s.activeTab, toastProps)
  })
}
const doPaste = () => {
  const s = store.getState()
  if (!s.activeTab) return
  if (!s.activeURLFormat) {
    toastManager.notify(s.activeTab, toastPropsUnsupported)
    return
  }
  if (!s.clippedTimeRange) {
    toastManager.notify(s.activeTab, toastPropsEmpty)
    return
  }
  const toastProps = {
    title: 'Paste',
    message: displayTimeRange(s.clippedTimeRange, s.activeTimeDisplayOptions),
    contextMessage: displayTimeZone(s.activeTimeDisplayOptions),
  }
  void applyTimeRange(s.activeTab, s.clippedTimeRange, s.activeURLFormat).then(
    (tab) => {
      tab && toastManager.notify(tab, toastProps, true)
    }
  )
}

// listener for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command == 'copy') doCopy()
  if (command == 'paste') doPaste()
})

// sync state with chrome.storage
chrome.storage.sync.get('configYaml', (item) => {
  if (item.configYaml) {
    store.dispatch(actions.setConfig(parseYamlConfigV1(item.configYaml)))
  } else {
    store.dispatch(actions.setConfig(parseYamlConfigV1(defaultConfigYaml)))
    void chrome.storage.sync.set({ configYaml: defaultConfigYaml })
  }
})
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName == 'sync' && changes.configYaml) {
    store.dispatch(
      actions.setConfig(parseYamlConfigV1(changes.configYaml.newValue))
    )
  }
})
chrome.storage.local.get('timeRange', (item) => {
  if (!item.timeRange) return
  store.dispatch(actions.setClippedTimeRange(item.timeRange as TimeRange))
})
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName != 'local' || !changes.timeRange) return
  store.dispatch(
    actions.setClippedTimeRange(changes.timeRange.newValue as TimeRange)
  )
})

// update active tab
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    store.dispatch(actions.setActiveTab(tab))
  })
})
chrome.tabs.onUpdated.addListener((_tabId, change, tab) => {
  if (tab.active && (change.url || change.status)) {
    store.dispatch(actions.setActiveTab(tab))
  }
})
chrome.windows.onFocusChanged.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab) return
    store.dispatch(actions.setActiveTab(tab))
  })
})

export {}
