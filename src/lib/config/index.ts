import { load } from 'js-yaml'
import { z } from 'zod'
import configSpec from './spec.yaml'
import defaultConfigYaml from './default.yaml'

const validateDateTimeFormatArgs = (
  locale?: string | string[],
  options?: Intl.DateTimeFormatOptions,
): boolean => {
  try {
    new Intl.DateTimeFormat(locale, options)
  } catch {
    return false
  }
  return true
}
const refineRegex = (pattern: string, ctx: z.RefinementCtx) => {
  try {
    new RegExp(pattern)
  } catch (e) {
    if (e instanceof Error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: e.message,
      })
    }
  }
}

export const TimeDisplayOptions = z
  .object({
    locale: z
      .string()
      .refine((v) => validateDateTimeFormatArgs(v), 'Unsupported locale')
      .optional()
      .nullable(),
    timeZone: z
      .string()
      .refine(
        (v) => validateDateTimeFormatArgs([], { timeZone: v }),
        'Unsupported time zone',
      )
      .optional()
      .nullable(),
  })
  .strict()
export type TimeDisplayOptions = z.infer<typeof TimeDisplayOptions>

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

export const RegexDuration = z
  .object({
    regex: z.string().superRefine(refineRegex),
    unit: z.string().default('milliseconds'),
  })
  .strict()
export type RegexDuration = z.infer<typeof RegexDuration>

export const RegexReplace = z
  .object({
    regex: z.string().superRefine(refineRegex),
    replace: z.string(),
  })
  .strict()
export type RegexReplace = z.infer<typeof RegexReplace>

export const URLFormat = z
  .object({
    urlWildcard: z.string(),
    timeFormat: z.string().optional(),
    timeOneSecond: z.number().optional(),
    timeUtcOffset: z.union([z.number(), z.string()]).optional(),
    timeDisplayOptions: TimeDisplayOptions.default({}),
    paramStart: z.string().optional(),
    paramEnd: z.string().optional(),
    paramDuration: z.union([z.string(), URLParamDuration]).optional(),
    paramSet: z.array(URLParam).default([]),
    paramDelete: z.array(z.string()).default([]),
    regexStart: z.string().superRefine(refineRegex).optional(),
    regexEnd: z.string().superRefine(refineRegex).optional(),
    regexDuration: z.union([z.string(), RegexDuration]).optional(),
    regexReplace: z.array(RegexReplace).default([]),
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

    if (o.paramStart && o.regexStart) {
      msg('Only one of `paramStart` and `regexStart` can be specified')
    }
    if (o.paramEnd && o.regexEnd) {
      msg('Only one of `paramEnd` and `regexEnd` can be specified')
    }
    if (o.paramDuration && o.regexDuration) {
      msg('Only one of `paramDuration` and `regexDuration` can be specified')
    }

    const hasStart = o.paramStart || o.regexStart
    const hasEnd = o.paramEnd || o.regexEnd
    const hasDuration = o.paramDuration || o.regexDuration
    if (hasStart && hasEnd && hasDuration) {
      msg(
        'Only two of `(param|regex)Start`, `(param|regex)End`, and `(param|regex)Duration` can be specified',
      )
    }
    if ([hasStart, hasEnd, hasDuration].filter((p) => p).length < 2) {
      msg(
        'Two of `(param|regex)Start`, `(param|regex)End`, and `(param|regex)Duration` are required',
      )
    }

    if (o.timeOneSecond) {
      ;[o.paramDuration, o.regexDuration].forEach((d) => {
        if (d && typeof d !== 'string' && d.unit) {
          msg(
            '`(param|regex)Duration.unit` can not be specified if `timeOneSecond` is specified',
          )
        }
      })
    }
  })
export type URLFormat = z.infer<typeof URLFormat>

export const ConfigV1 = z
  .object({
    configVersion: z
      .number()
      .refine((v: number) => v === 1, { message: 'The value must be 1' }),
    timeDisplayOptions: TimeDisplayOptions.default({}),
    urlFormats: z.array(URLFormat).default([]),
  })
  .strict()
export type ConfigV1 = z.infer<typeof ConfigV1>

export const parseYamlConfigV1 = (yaml: string): ConfigV1 =>
  ConfigV1.parse(load(yaml))

export { configSpec, defaultConfigYaml }
