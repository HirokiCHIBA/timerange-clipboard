import { ToastManager } from '../components/Toast'
import { defaultConfigYaml, parseYamlConfigV1 } from '../lib/config'
import { store, actions } from '../lib/state'
import { RuntimeMessage, ToastPayload } from '../lib/types'
import {
  applyTimeRange,
  displayTimeRange,
  displayTimeZone,
  TimeRange,
} from '../lib/utils'

const manifest = chrome.runtime.getManifest()
const activeIcons = manifest.icons
  ? Object.fromEntries(
      Object.entries(manifest.icons as [string, string]).map((e) => {
        e[1] = chrome.runtime.getURL(e[1])
        return e
      }),
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
          },
        ),
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
        s.activeTimeDisplayOptions,
      )} (${displayTimeZone(s.activeTimeDisplayOptions)})`
    : manifest.name
  void chrome.action.setTitle({ title })
})

// toast
const toastManager = new ToastManager()
const toastPropsUnsupported = { title: 'Unsupported page' }
const toastPropsEmpty = { title: 'Empty clipboard' }
const toastPropsNoTimeRange = { title: 'No timerange parsed' }

// functions for keyboard shortcuts
const doCopy = () => {
  const s = store.getState()
  if (!s.activeTab) return
  if (!s.activeURLFormat) {
    void toastManager.notify(s.activeTab, toastPropsUnsupported)
    return
  }
  if (!s.activeTimeRange) {
    void toastManager.notify(s.activeTab, toastPropsNoTimeRange)
    return
  }
  const toastProps = {
    title: 'Copied',
    message: displayTimeRange(s.activeTimeRange, s.activeTimeDisplayOptions),
    contextMessage: displayTimeZone(s.activeTimeDisplayOptions),
  }
  void chrome.storage.local.set({ timeRange: s.activeTimeRange }).then(() => {
    if (s.activeTab) void toastManager.notify(s.activeTab, toastProps)
  })
}
const doPaste = () => {
  const s = store.getState()
  if (!s.activeTab) return
  if (!s.activeURLFormat) {
    void toastManager.notify(s.activeTab, toastPropsUnsupported)
    return
  }
  if (!s.clippedTimeRange) {
    void toastManager.notify(s.activeTab, toastPropsEmpty)
    return
  }
  const toastProps = {
    title: 'Pasted',
    message: displayTimeRange(s.clippedTimeRange, s.activeTimeDisplayOptions),
    contextMessage: displayTimeZone(s.activeTimeDisplayOptions),
  }
  void applyTimeRange(s.activeTab, s.clippedTimeRange, s.activeURLFormat).then(
    (tab) => {
      if (tab) void toastManager.notify(tab, toastProps)
    },
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
    store.dispatch(
      actions.setConfig(parseYamlConfigV1(item.configYaml as string)),
    )
  } else {
    store.dispatch(actions.setConfig(parseYamlConfigV1(defaultConfigYaml)))
    void chrome.storage.sync.set({ configYaml: defaultConfigYaml })
  }
})
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName == 'sync' && changes.configYaml) {
    store.dispatch(
      actions.setConfig(
        parseYamlConfigV1(changes.configYaml.newValue as string),
      ),
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
    actions.setClippedTimeRange(changes.timeRange.newValue as TimeRange),
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

// relay toast message from popup
chrome.runtime.onMessage.addListener(
  (message: RuntimeMessage, _, sendResponse) => {
    if (message.type == 'toast') {
      const payload = message.payload as ToastPayload
      void toastManager.notify(payload.tab, payload.props)
      sendResponse(true)
      return
    }
    sendResponse(false)
  },
)

export {}
