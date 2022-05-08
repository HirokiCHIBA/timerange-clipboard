export type ToastContent =
  | {
      command: string
      timeRange: string
      timeZone: string
    }
  | string

export class ToastManager {
  private reminder: Map<number, ToastContent>
  private logoUrl: string

  constructor() {
    this.reminder = new Map()
    this.logoUrl = chrome.runtime.getURL('assets/logo.svg')

    chrome.tabs.onUpdated.addListener(this.onTabUpdate)
  }

  notify = (
    tab: chrome.tabs.Tab,
    content: ToastContent,
    onLoad = false
  ): void => {
    if (!tab.id) return
    if (onLoad) {
      this.notifyOnLoad(tab.id, content)
    } else {
      this.notifyImmediately(tab.id, content)
    }
  }

  private notifyImmediately = (tabId: number, content: ToastContent) => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        func: toast,
        args: [this.logoUrl, content],
      },
      undefined
    )
  }

  private notifyOnLoad = (tabId: number, content: ToastContent) => {
    this.reminder.set(tabId, content)
  }

  private onTabUpdate = (tabId: number, change: chrome.tabs.TabChangeInfo) => {
    if (change.status != 'complete') return

    const content = this.reminder.get(tabId)
    if (!content) return

    this.notifyImmediately(tabId, content)
    this.reminder.delete(tabId)
  }
}

const toast = (logoUrl: string, content: ToastContent): void => {
  const shadowHostId = 'timerange-clipboard-toast'
  const mainHTML =
    typeof content == 'string'
      ? `
<div class="row">
  <img class="logo" src="${logoUrl}" class="icon" />
  <span class="command">${content}</span>
</div>
`
      : `
<div class="row">
  <img class="logo" src="${logoUrl}" class="icon" />
  <span class="command">${content.command}</span>
  <span class="tz">${content.timeZone}</span>
</div>
<div class="row">${content.timeRange}</div>
`

  const styleText = `
:host {
  all: initial !important;
  display: block;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  2% {
    opacity: 1;
  }
}

@keyframes fadeOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.main {
  position: fixed;
  z-index: ${Number.MAX_SAFE_INTEGER};
  top: calc(10px + env(safe-area-inset-top, 0px));
  right: calc(10px + env(safe-area-inset-right, 0px));
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.80);
  color: rgba(255, 255, 255, 0.80);
  box-shadow:
    0px 6px 10px 0px rgba(0, 0, 0, 0.14),
    0px 1px 18px 0px rgba(0, 0, 0, 0.12),
    0px 3px 5px -1px rgba(0, 0, 0, 0.2);
  text-shadow: 0 1px 0 rgb(0, 0, 0);
  font-size: 14px;
  line-height: 1;
  user-select: none;
  animation: fadeIn 5s linear 0s 1 normal forwards;
}

.main.dismiss {
  animation: fadeOut .2s linear 0s 1 normal forwards;
}

.main.dismiss:not(.force):hover {
  animation-play-state: paused;
}

.row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.logo {
  height: 16px;
}

.command {
  flex: 1;
}

.tz {
  font-size: 10px;
}
`

  const oldShadowHost = document.getElementById(shadowHostId)
  if (oldShadowHost !== null) oldShadowHost.remove()

  const shadowHost = document.createElement('div')
  shadowHost.id = shadowHostId
  document.body.append(shadowHost)

  const shadowRoot = shadowHost.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  shadowRoot.appendChild(style)
  style.textContent = styleText

  const main = document.createElement('div')
  main.classList.add('main')
  shadowRoot.appendChild(main)

  main.innerHTML = mainHTML

  main.addEventListener('animationend', (e) => {
    if (e.animationName == 'fadeIn') {
      main.classList.add('dismiss')
    }
    if (e.animationName == 'fadeOut') {
      shadowHost.remove()
    }
  })

  main.addEventListener('click', () => {
    main.classList.add('dismiss', 'force')
  })
}
