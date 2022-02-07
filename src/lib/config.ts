import { load } from 'js-yaml'
import { z } from 'zod'

export const URLParam = z
  .object({
    key: z.string(),
    value: z.string(),
  })
  .strict()
export type URLParam = z.infer<typeof URLParam>

export const URLParamDuration = z
  .object({
    key: z.string(),
    unit: z.string().default('milliseconds'),
  })
  .strict()
export type URLParamDuration = z.infer<typeof URLParamDuration>

export const URLFormat = z
  .object({
    urlWildcard: z.string(),
    timeFormat: z.string().optional(),
    timeOneSecond: z.number().optional(),
    paramStart: z.string().optional(),
    paramEnd: z.string().optional(),
    paramDuration: z.union([z.string(), URLParamDuration]).optional(),
    paramSet: z.array(URLParam).default([]),
    paramDelete: z.array(z.string()).default([]),
  })
  .strict()
  .superRefine((o, ctx) => {
    const msg = (m: string) =>
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: m,
      })
    if (o.timeFormat && o.timeOneSecond) {
      msg('Only one of `timeFormat` and `timeOneSecond` can be specified')
    }
    if (!o.timeFormat && !o.timeOneSecond) {
      msg('Either `timeFormat` or `timeOneSecond` is required')
    }
    if (o.paramStart && o.paramEnd && o.paramDuration) {
      msg(
        'Only two of `paramStart`, `paramEnd`, and `paramDuration` can be specified'
      )
    }
    if (
      [o.paramStart, o.paramEnd, o.paramDuration].filter((p) => p).length < 2
    ) {
      msg('Two of `paramStart`, `paramEnd`, and `paramDuration` are required')
    }
    if (
      o.timeOneSecond &&
      o.paramDuration &&
      typeof o.paramDuration != 'string' &&
      o.paramDuration.unit
    ) {
      msg(
        '`paramDuration.unit` can not be specified if `timeOneSecond` is specified'
      )
    }
  })
export type URLFormat = z.infer<typeof URLFormat>

export const ConfigV1 = z
  .object({
    configVersion: z
      .number()
      .refine((v: number) => v === 1, { message: 'The value must be 1' }),
    urlFormats: z.array(URLFormat).default([]),
  })
  .strict()
export type ConfigV1 = z.infer<typeof ConfigV1>

export const parseYamlConfigV1 = (yaml: string): ConfigV1 =>
  ConfigV1.parse(load(yaml))

export const configSpec = `# Version of config spec. Fixed value.
configVersion: 1

# List of URL formats with timestamps. If multiple matches are found, the earliest one will be used.
urlFormats:

  - # URL with wildcards to use this format.
    urlWildcard: '*.datadoghq.com*from_ts=*'

    # Specification of timestamps.
    # Either \`timeFormat\` or \`timeOneSecond\` is required.
    timeFormat: x           # Specify a format with Moment.js tokens described below.
    timeOneSecond: 1000000  # Specify a number representing one second of timestamp.
                            # e.g. 1000000 for a microsecond timestamp, 1000 for a millisecond timestamp

    # Specification of URL query parameters.
    # Two of \`paramStart\`, \`paramEnd\`, and \`paramDuration\` are required.
    paramStart: from_ts   # Query parameter indicating start times of time ranges.
    paramEnd: to_ts       # Query parameter indicating end times of time ranges.
    paramDuration: range  # Query parameter indicating duration of time ranges.

    # If \`timeFormat\` is specified, the value of the parameter \`paramDuration\` can be a number in 
    # milliseconds. If you want to use a number in a unit other than milliseconds for \`paramDuration\`,
    # specify it as follows.
    paramDuration:
      key: range
      unit: seconds # Unit of duration. Use Moment.js duration unit keys described below.

    # (Optional) List of query parameters to be added to URLs on "Paste".
    paramSet:
      - key: live
        value: 'false'

    # (Optional) List of query parameters to be removed to URLs on "Paste".
    paramDelete:
      - sid
`

export const defaultConfigYaml = `configVersion: 1

urlFormats:
  # Datadog 'View full screen'
  - urlWildcard: '*.datadoghq.com*fullscreen_start_ts=*'
    timeFormat: x
    paramStart: fullscreen_start_ts
    paramEnd: fullscreen_end_ts
    paramSet:
      - key: fullscreen_paused
        value: 'true'

  # Datadog Dashboard, Datadog Monitor Status
  - urlWildcard: '*.datadoghq.com*from_ts=*'
    timeFormat: x
    paramStart: from_ts
    paramEnd: to_ts
    paramSet:
      - key: live
        value: 'false'

  # Datadog APM
  - urlWildcard: '*.datadoghq.com*start=*'
    timeFormat: x
    paramStart: start
    paramEnd: end
    paramSet:
      - key: paused
        value: 'true'

  # Splunk Search
  - urlWildcard: '*splunk*/app/*/search*'
    timeFormat: X
    paramStart: earliest
    paramEnd: latest
    paramDelete:
      - sid

  # Splunk Report
  - urlWildcard: '*splunk*/app/*/report?*'
    timeFormat: X
    paramStart: earliest
    paramEnd: latest
    paramDelete:
      - sid

  # Splunk Dataset
  - urlWildcard: '*splunk*/app/*/dataset?*'
    timeFormat: X
    paramStart: dispatch.earliest_time
    paramEnd: dispatch.latest_time
    paramDelete:
      - sid

  # Splunk Dashboard
  - urlWildcard: '*splunk*form.time.earliest=*'
    timeFormat: X
    paramStart: form.time.earliest
    paramEnd: form.time.latest
    paramDelete:
      - sid

  # Grafana Dashboard
  - urlWildcard: '*grafana*/d/*'
    timeFormat: x
    paramStart: from
    paramEnd: to

  # Lightstep Dashboard
  - urlWildcard: 'https://app.lightstep.com*/dashboard/*'
    timeFormat: X
    paramEnd: anchor
    paramDuration: 
      key: range
      unit: seconds

  # Lightstep Stream
  - urlWildcard: 'https://app.lightstep.com*/stream/*'
    timeFormat: X
    paramEnd: anchor
    paramDuration:
      key: range
      unit: seconds
 
   # Lightstep Service Directory
  - urlWildcard: 'https://app.lightstep.com*/service-directory/*/deployments*'
    timeOneSecond: 1000000
    paramStart: start_micros
    paramEnd: end_micros
`
