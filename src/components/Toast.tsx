import { CSSProperties } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

export type ToastProps = {
  title: string
  message?: string
  contextMessage?: string
}

const Toast: React.FC<ToastProps> = ({ title, message, contextMessage }) => {
  return (
    <div style={mainStyle} id="main">
      <style>{globalStyle}</style>
      <div style={rowStyle}>
        <img style={logoStyle} src={logoUrl} />
        <span style={titleStyle}>{title}</span>
        {contextMessage && (
          <span style={contextMessageStyle}>{contextMessage}</span>
        )}
      </div>
      {message && <div style={rowStyle}>{message}</div>}
    </div>
  )
}

const logoUrl = chrome.runtime.getURL('assets/logo.svg')

const mainStyle: CSSProperties = {
  position: 'fixed',
  top: 'calc(10px + env(safe-area-inset-top, 0px))',
  right: 'calc(10px + env(safe-area-inset-right, 0px))',
  zIndex: Number.MAX_SAFE_INTEGER,
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  padding: '8px',
  borderRadius: '4px',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  color: 'rgba(255, 255, 255, 0.8)',
  boxShadow: [
    '0px 6px 10px 0px rgba(0, 0, 0, 0.14)',
    '0px 1px 18px 0px rgba(0, 0, 0, 0.12)',
    '0px 3px 5px -1px rgba(0, 0, 0, 0.2)',
  ].join(', '),
  textShadow: '0 1px 0 rgb(0, 0, 0)',
  fontSize: '14px',
  lineHeight: 1,
  userSelect: 'none',
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
}

const logoStyle: CSSProperties = {
  height: '16px',
}

const titleStyle: CSSProperties = {
  flex: 1,
}

const contextMessageStyle: CSSProperties = {
  fontSize: '10px',
}

const globalStyle = `
  :host {
    all: initial !important;
    display: block;
  }
  @keyframes fadeIn {
    0% { opacity: 0; }
    2% { opacity: 1; } 
  }
  @keyframes fadeOut {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }
  #main { animation: fadeIn 5s linear 0s 1 normal forwards; }
  #main.dismiss { animation: fadeOut .2s linear 0s 1 normal forwards; }
  #main.dismiss:not(.force):hover { animation-play-state: paused; }
`

const generateShadowDOM = (html: string) => {
  const shadowHostId = 'timerange-clipboard-toast'

  const oldShadowHost = document.getElementById(shadowHostId)
  if (oldShadowHost !== null) oldShadowHost.remove()

  const shadowHost = document.createElement('div')
  shadowHost.id = shadowHostId
  document.body.append(shadowHost)

  const shadowRoot = shadowHost.attachShadow({ mode: 'open' })
  shadowRoot.innerHTML = html

  const main = shadowRoot.getElementById('main')
  main?.addEventListener('animationend', (e) => {
    if (e.animationName == 'fadeIn') {
      main.classList.add('dismiss')
    }
    if (e.animationName == 'fadeOut') {
      shadowHost.remove()
    }
  })
  main?.addEventListener('click', () => {
    main.classList.add('dismiss', 'force')
  })
}

const generateFuncArgs = (
  props: ToastProps
): { func: (...args: string[]) => void; args: string[] } => {
  const html = renderToStaticMarkup(<Toast {...props} />)
  return {
    func: generateShadowDOM,
    args: [html],
  }
}

export class ToastManager {
  private reminder: Map<number, ToastProps>

  constructor() {
    this.reminder = new Map()

    chrome.tabs.onUpdated.addListener(this.onTabUpdate)
  }

  notify = (tab: chrome.tabs.Tab, props: ToastProps, onLoad = false): void => {
    if (!tab.id) return
    if (onLoad) {
      this.notifyOnLoad(tab.id, props)
    } else {
      this.notifyImmediately(tab.id, props)
    }
  }

  private notifyImmediately = (tabId: number, props: ToastProps) => {
    chrome.scripting.executeScript(
      { target: { tabId }, ...generateFuncArgs(props) },
      undefined
    )
  }

  private notifyOnLoad = (tabId: number, props: ToastProps) => {
    this.reminder.set(tabId, props)
  }

  private onTabUpdate = (tabId: number, change: chrome.tabs.TabChangeInfo) => {
    if (change.status != 'complete') return

    const props = this.reminder.get(tabId)
    if (!props) return

    this.notifyImmediately(tabId, props)
    this.reminder.delete(tabId)
  }
}
