import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ConfigV1, TimeDisplayOptions, URLFormat } from './config'
import { parseTimeRange, TimeRange } from './utils'

export type AppState = {
  config: ConfigV1
  activeTimeDisplayOptions: TimeDisplayOptions
  activeTab: chrome.tabs.Tab | null
  activeURLFormat: URLFormat | null
  activeTimeRange: TimeRange | null
  clippedTimeRange: TimeRange | null
}

const initialState: AppState = {
  config: {
    configVersion: 1,
    timeDisplayOptions: {},
    urlFormats: [],
  },
  activeTimeDisplayOptions: {},
  activeTab: null,
  activeURLFormat: null,
  activeTimeRange: null,
  clippedTimeRange: null,
}

const calcActiveTimeDisplayOptions = (state: AppState) => {
  return state.activeURLFormat
    ? {
        ...state.config.timeDisplayOptions,
        ...state.activeURLFormat.timeDisplayOptions,
      }
    : state.config.timeDisplayOptions
}

const setConfig = (state: AppState, action: PayloadAction<ConfigV1>) => {
  state.config = action.payload
  state.activeTimeDisplayOptions = calcActiveTimeDisplayOptions(state)
}

const setActiveTab = (
  state: AppState,
  action: PayloadAction<chrome.tabs.Tab>,
) => {
  state.activeTab = action.payload
  const [timeRange, urlFormat] = parseTimeRange(
    state.config.urlFormats,
    action.payload,
  )
  state.activeURLFormat = urlFormat
  state.activeTimeRange = timeRange
  state.activeTimeDisplayOptions = calcActiveTimeDisplayOptions(state)
}

const setClippedTimeRange = (
  state: AppState,
  action: PayloadAction<TimeRange>,
) => {
  state.clippedTimeRange = action.payload
}

export const slice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setConfig,
    setActiveTab,
    setClippedTimeRange,
  },
})

export const actions = slice.actions
export const reducer = slice.reducer
export const store = configureStore({ reducer })
