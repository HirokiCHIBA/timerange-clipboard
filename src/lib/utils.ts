import moment from 'moment'
import { URLFormat } from './config'

const wildcardToRegExp = (s: string): RegExp =>
  new RegExp('^' + s.split(/\*+/).map(regExpEscape).join('.*') + '$')

const regExpEscape = (s: string): string =>
  s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')

export const Version =
  typeof chrome !== 'undefined' && chrome.runtime
    ? chrome.runtime.getManifest().version
    : '0.0.0'

export type TimeRange = {
  start: number
  end: number
}

export const parseTimeRange = (
  formats: URLFormat[],
  tab: chrome.tabs.Tab
): [TimeRange | null, URLFormat | null] => {
  if (!tab.url) return [null, null]
  const url = new URL(tab.url)
  const [format] = formats.filter((f) => {
    const r = wildcardToRegExp(f.urlWildcard)
    return r.test(url.toString())
  })

  if (!format) return [null, null]

  let start: moment.Moment | null = null
  let end: moment.Moment | null = null
  let duration: moment.Duration | null = null

  if (format.timeOneSecond) {
    const timeMs = format.timeOneSecond / 1000
    if (format.paramStart) {
      const pv = url.searchParams.get(format.paramStart)
      if (pv) start = moment(Number(pv) / timeMs)
    }
    if (format.paramEnd) {
      const pv = url.searchParams.get(format.paramEnd)
      if (pv) end = moment(Number(pv) / timeMs)
    }
    if (format.paramDuration) {
      const pk =
        typeof format.paramDuration === 'string'
          ? format.paramDuration
          : format.paramDuration.key
      const pv = url.searchParams.get(pk)
      if (pv) duration = moment.duration(Number(pv) / timeMs)
    }
  }

  if (format.timeFormat) {
    if (format.paramStart) {
      start = moment(url.searchParams.get(format.paramStart), format.timeFormat)
    }
    if (format.paramEnd) {
      end = moment(url.searchParams.get(format.paramEnd), format.timeFormat)
    }
    if (format.paramDuration) {
      duration =
        typeof format.paramDuration === 'string'
          ? moment.duration(url.searchParams.get(format.paramDuration))
          : moment.duration(
              url.searchParams.get(format.paramDuration.key),
              format.paramDuration.unit as moment.unitOfTime.DurationConstructor
            )
    }
  }

  if (start && duration && start.isValid() && duration.isValid()) {
    end = start.clone().add(duration)
  } else if (end && duration && end.isValid() && duration.isValid()) {
    start = end.clone().subtract(duration)
  }

  if (start && end && start.isValid() && end.isValid()) {
    const range = {
      start: start.valueOf(),
      end: end.valueOf(),
    }
    return [range, format]
  }

  return [null, format]
}

export const applyTimeRange = async (
  tab: chrome.tabs.Tab,
  range: TimeRange,
  format: URLFormat
): Promise<chrome.tabs.Tab | void> => {
  if (!tab.url || !tab.id) return
  const url = new URL(tab.url)
  let start: string | null = null
  let end: string | null = null
  let duration: string | null = null

  if (format.timeOneSecond) {
    const timeMs = format.timeOneSecond / 1000
    start = (range.start * timeMs).toString()
    end = (range.end * timeMs).toString()
    duration = ((range.end - range.start) * timeMs).toString()
  }

  if (format.timeFormat) {
    start = moment(range.start).format(format.timeFormat)
    end = moment(range.end).format(format.timeFormat)
    if (format.paramDuration) {
      if (typeof format.paramDuration === 'string') {
        duration = (range.end - range.start).toString()
      } else {
        duration = moment
          .duration(range.end - range.start)
          .as(format.paramDuration.unit as moment.unitOfTime.Base)
          .toString()
      }
    }
  }

  if (format.paramStart && start) url.searchParams.set(format.paramStart, start)
  if (format.paramEnd && end) url.searchParams.set(format.paramEnd, end)
  if (format.paramDuration && duration) {
    const paramDuration =
      typeof format.paramDuration === 'string'
        ? format.paramDuration
        : format.paramDuration.key
    url.searchParams.set(paramDuration, duration)
  }

  for (const p of format.paramSet) {
    url.searchParams.set(p.key, p.value)
  }
  for (const p of format.paramDelete) {
    url.searchParams.delete(p)
  }

  return await chrome.tabs.update(tab.id, { url: url.toString() })
}

export const displayTime = (t: number): string => moment(t).format('lll')
