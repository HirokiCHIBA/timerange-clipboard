export type RuntimeMessage = {
  type: string
  payload?: ToastPayload
}

export type ToastPayload = {
  tab: chrome.tabs.Tab
  props: ToastProps
}

export type ToastProps = {
  title: string
  message?: string
  contextMessage?: string
}
