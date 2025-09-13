import moment from 'moment'
import { TimeDisplayOptions, URLFormat } from './config'

const wildcardToRegExp = (s: string): RegExp =>
  new RegExp('^' + s.split(/\*+/).map(regExpEscape).join('.*') + '$')

const regExpEscape = (s: string): string =>
  s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')

const stripUrlHash = (original: string): string => {
  const url = new URL(original)
  url.hash = ''
  return url.toString()
}

const getOffsetMinutes = (offset: string | number = 0): number => {
  return moment().utcOffset(offset).utcOffset()
}

export const parseTimeWithOffset = (
  str: string,
  format: string,
  offset: string | number = 0,
): moment.Moment => {
  // use moment.utc() to treat the time representation as UTC when the timezone cannot be extracted from the format
  // moment.parseZone() cannot be used because it unintentionally shifts the time forward by the local offset when a unix epoch is input
  // e.g. When using in a +9 time zone:
  //   moment.utc("1756390062333", "x") -> Thu Aug 28 2025 14:07:42 GMT+0000
  //   moment.parseZone("1756390062333", "x") -> Thu Aug 28 2025 23:07:42 GMT+0000
  const momentUtc = moment.utc(str, format)
  // if the time zone can be extracted from the format, correct it by overwriting the offset
  // extract the original time zone using moment.parseZone(), calculate the difference from the setting, and shift the time back by the difference
  // moment.parseZone().utcOffset() works fine for the time zone extraction (if the time zone cannot be extracted, it will always return 0)
  const baseOffset = moment.parseZone(str, format).utcOffset()
  const targetOffset = getOffsetMinutes(offset)
  momentUtc.subtract(targetOffset - baseOffset, 'm')

  return momentUtc
}

export const formatTimeWithOffset = (
  time: number,
  format: string,
  offset: string | number = 0,
): string => {
  const offsetMs = getOffsetMinutes(offset) * 60000
  const result = moment(time).utcOffset(offset).format(format)

  // parse the formatted result again and check if it matches the original time
  // for unix epoch formats, there will be a difference equal to the offset, so adjust accordingly
  const timeFromResult = parseTimeWithOffset(result, format, offset).valueOf()
  return timeFromResult + offsetMs == time
    ? moment(time + offsetMs)
        .utcOffset(offset)
        .format(format)
    : result
}

export type TimeRange = {
  start: number
  end: number
}

export const parseTimeRange = (
  formats: URLFormat[],
  tab: chrome.tabs.Tab,
): [TimeRange | null, URLFormat | null] => {
  if (!tab.url) return [null, null]
  const url = new URL(tab.url)
  const [format] = formats.filter((f) => {
    const r = wildcardToRegExp(f.urlWildcard)
    return r.test(url.toString())
  })

  if (!format) return [null, null]

  // parse timestamp or duration strings
  let startStr: string | undefined
  let endStr: string | undefined
  let durationStr: string | undefined

  // from URL.searchParams
  if (format.paramStart) {
    startStr = url.searchParams.get(format.paramStart) ?? undefined
  }
  if (format.paramEnd) {
    endStr = url.searchParams.get(format.paramEnd) ?? undefined
  }
  if (format.paramDuration) {
    durationStr =
      url.searchParams.get(
        typeof format.paramDuration === 'string'
          ? format.paramDuration
          : format.paramDuration.key,
      ) ?? undefined
  }

  // with regex
  if (format.regexStart) {
    startStr = new RegExp(format.regexStart).exec(url.toString())?.[0]
  }
  if (format.regexEnd) {
    endStr = new RegExp(format.regexEnd).exec(url.toString())?.[0]
  }
  if (format.regexDuration) {
    durationStr = new RegExp(
      typeof format.regexDuration === 'string'
        ? format.regexDuration
        : format.regexDuration.regex,
    ).exec(url.toString())?.[0]
  }

  // convert timestamp or duration strings to moment object
  let start: moment.Moment | undefined
  let end: moment.Moment | undefined
  let duration: moment.Duration | undefined

  // when a timestamp scale is specified
  if (format.timeOneSecond) {
    const timeMs = format.timeOneSecond / 1000
    const offsetMs = getOffsetMinutes(format.timeUtcOffset) * 60000
    // for time correction when timeUtcOffset is set, use moment.utc() to set the offset to 0
    // if you pass a number to moment() or moment.parseZone(), the offset is set to local time
    if (startStr) start = moment.utc((Number(startStr) - offsetMs) / timeMs)
    if (endStr) end = moment.utc((Number(endStr) - offsetMs) / timeMs)
    if (durationStr) duration = moment.duration(Number(durationStr) / timeMs)
  }

  // when a moment format is specified
  if (format.timeFormat) {
    if (format.timeUtcOffset !== 'undefined') {
      if (startStr) {
        start = parseTimeWithOffset(
          startStr,
          format.timeFormat,
          format.timeUtcOffset,
        )
      }
      if (endStr) {
        end = parseTimeWithOffset(
          endStr,
          format.timeFormat,
          format.timeUtcOffset,
        )
      }
    } else {
      // if timeUtcOffset is not set, use moment() for compatibility
      if (startStr) start = moment(startStr, format.timeFormat)
      if (endStr) end = moment(endStr, format.timeFormat)
    }
    if (durationStr) {
      const durationConf = format.regexDuration ?? format.paramDuration
      const unit =
        typeof durationConf === 'string'
          ? undefined
          : (durationConf?.unit as moment.unitOfTime.DurationConstructor)
      duration = moment.duration(durationStr, unit)
    }
  }

  // calculate start or end from duration if it is defined
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

const renderTemplate = (
  template: string,
  variables: { [k: string]: string | undefined },
) => {
  let output = template
  for (const [k, v] of Object.entries(variables)) {
    const r = new RegExp(`\\{\\{\\s*${k}\\s+\\}\\}`, 'g')
    if (!r.test(output)) continue
    // return undefined if any of the template variables used in the replacement value could not be filled
    if (!v) return
    output = output.replaceAll(new RegExp(`\\{\\{\\s*${k}\\s+\\}\\}`, 'g'), v)
  }
  return output
}

export const applyTimeRange = async (
  tab: chrome.tabs.Tab,
  range: TimeRange,
  format: URLFormat,
): Promise<chrome.tabs.Tab | void> => {
  if (!tab.url || !tab.id) return
  let start: string | undefined
  let end: string | undefined
  let duration: string | undefined

  if (format.timeOneSecond) {
    const offsetMs = getOffsetMinutes(format.timeUtcOffset) * 60000
    const timeMs = format.timeOneSecond / 1000
    start = ((range.start + offsetMs) * timeMs).toString()
    end = ((range.end + offsetMs) * timeMs).toString()
    duration = ((range.end - range.start) * timeMs).toString()
  }

  if (format.timeFormat) {
    if (typeof format.timeUtcOffset !== 'undefined') {
      start = formatTimeWithOffset(
        range.start,
        format.timeFormat,
        format.timeUtcOffset,
      )
      end = formatTimeWithOffset(
        range.end,
        format.timeFormat,
        format.timeUtcOffset,
      )
    } else {
      start = moment(range.start).format(format.timeFormat)
      end = moment(range.end).format(format.timeFormat)
    }

    const durationConf = format.regexDuration ?? format.paramDuration
    if (durationConf && typeof durationConf !== 'string') {
      duration = moment
        .duration(range.end - range.start)
        .as(durationConf.unit as moment.unitOfTime.Base)
        .toString()
    } else {
      duration = (range.end - range.start).toString()
    }
  }

  const url = new URL(tab.url)
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

  let urlStr = url.toString()
  if (format.regexStart && start) {
    urlStr = urlStr.replace(new RegExp(format.regexStart), start)
  }
  if (format.regexEnd && end) {
    urlStr = urlStr.replace(new RegExp(format.regexEnd), end)
  }
  if (format.regexDuration && duration) {
    const regexDuration =
      typeof format.regexDuration === 'string'
        ? format.regexDuration
        : format.regexDuration.regex
    urlStr = urlStr.replace(new RegExp(regexDuration), duration)
  }
  for (const r of format.regexReplace) {
    const replace = renderTemplate(r.replace, { start, end, duration })
    if (typeof replace === 'undefined') continue
    urlStr = urlStr.replaceAll(new RegExp(r.regex, 'g'), replace)
  }

  // If the URL without hash is the same, reload to ensure the URL is reflected
  // (since detecting hash changes depends on the web page implementation)
  if (stripUrlHash(tab.url) === stripUrlHash(urlStr)) {
    // If the URL is not the same (i.e., the hash is different),
    // update the tab with the new URL and wait for it to be reflected
    if (tab.url !== urlStr) {
      const tabId = tab.id
      await new Promise<void>((resolve) => {
        const listener = (
          changeTabId: number,
          changeInfo: chrome.tabs.TabChangeInfo,
        ) => {
          if (changeTabId !== tabId || changeInfo.url !== urlStr) return
          chrome.tabs.onUpdated.removeListener(listener)
          resolve()
        }
        chrome.tabs.onUpdated.addListener(listener)
        void chrome.tabs.update(tabId, { url: urlStr })
      })
    }
    await chrome.tabs.reload(tab.id)
  } else {
    await chrome.tabs.update(tab.id, { url: urlStr })
  }

  return tab
}

const displayDateTimeFormat = (opts: TimeDisplayOptions) => {
  return new Intl.DateTimeFormat(
    opts.locale !== null ? opts.locale : undefined,
    {
      timeZone: opts.timeZone !== null ? opts.timeZone : undefined,
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  )
}

export const displayTimeRange = (
  range: TimeRange,
  opts: TimeDisplayOptions,
): string => {
  const format = displayDateTimeFormat(opts)
  const start = format.format(range.start)
  const end = format.format(range.end)
  return `${start} - ${end}`
}

export const displayTimeZone = (opts: TimeDisplayOptions): string => {
  return displayDateTimeFormat(opts).resolvedOptions().timeZone
}
