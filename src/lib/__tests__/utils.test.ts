import moment from 'moment'
import { parseTimeWithOffset, formatTimeWithOffset } from '../utils'

describe(`UTC offset for test env: ${moment().utcOffset()}`, () => {
  describe('parseTimeWithOffset', () => {
    const testTime = 1756390062000 // 2025-08-28T14:07:42Z
    const testCases = [
      // Unix Epoch Milliseconds
      {
        description: 'Unix Epoch Milliseconds (Offset: 0)',
        str: testTime.toString(),
        format: 'x',
        offset: 0,
        expected: testTime,
      },
      {
        description: 'Unix Epoch Milliseconds (Offset: +09:00)',
        str: testTime.toString(),
        format: 'x',
        offset: '+09:00',
        expected: testTime - 9 * 3600000,
      },
      {
        description: 'Unix Epoch Milliseconds (Offset: -08:00)',
        str: testTime.toString(),
        format: 'x',
        offset: '-08:00',
        expected: testTime + 8 * 3600000,
      },
      // ISO 8601 w/o Timezone
      {
        description: 'ISO 8601 w/o Timezone (Offset: 0)',
        str: '2025-08-28T14:07:42',
        format: 'YYYY-MM-DDTHH:mm:ss',
        offset: 0,
        expected: testTime,
      },
      {
        description: 'ISO 8601 w/o Timezone (Offset: +09:00)',
        str: '2025-08-28T14:07:42',
        format: 'YYYY-MM-DDTHH:mm:ss',
        offset: '+09:00',
        expected: testTime - 9 * 3600000,
      },
      {
        description: 'ISO 8601 w/o Timezone (Offset: -08:00)',
        str: '2025-08-28T14:07:42',
        format: 'YYYY-MM-DDTHH:mm:ss',
        offset: '-08:00',
        expected: testTime + 8 * 3600000,
      },
      // ISO 8601 w/ Timezone
      {
        description: 'ISO 8601 w/ Timezone (Offset: 0)',
        str: '2025-08-28T14:07:42+09:00',
        format: 'YYYY-MM-DDTHH:mm:ssZ',
        offset: 0,
        expected: testTime,
      },
      {
        description: 'ISO 8601 w/ Timezone (Offset: +09:00)',
        str: '2025-08-28T14:07:42+09:00',
        format: 'YYYY-MM-DDTHH:mm:ssZ',
        offset: '+09:00',
        expected: testTime - 9 * 3600000,
      },
      {
        description: 'ISO 8601 w/ Timezone (Offset: -08:00)',
        str: '2025-08-28T14:07:42+09:00',
        format: 'YYYY-MM-DDTHH:mm:ssZ',
        offset: '-08:00',
        expected: testTime + 8 * 3600000,
      },
    ]

    test.each(testCases)(
      '$description',
      ({ str, format, offset, expected }) => {
        const result = parseTimeWithOffset(str, format, offset)
        expect(result.isValid()).toBe(true)
        expect(result.valueOf()).toBe(expected)
      },
    )
  })

  describe('formatTimeWithOffset', () => {
    const testTime = 1756390062000 // 2025-08-28T14:07:42Z
    const testCases = [
      // Unix Epoch Milliseconds
      {
        description: 'Unix Epoch Milliseconds (Offset: 0)',
        format: 'x',
        offset: 0,
        expected: testTime.toString(),
      },
      {
        description: 'Unix Epoch Milliseconds (Offset: +09:00)',
        format: 'x',
        offset: '+09:00',
        expected: (testTime + 9 * 3600000).toString(),
      },
      {
        description: 'Unix Epoch Milliseconds (Offset: -08:00)',
        format: 'x',
        offset: '-08:00',
        expected: (testTime - 8 * 3600000).toString(),
      },
      // ISO 8601 w/o Timezone
      {
        description: 'ISO 8601 w/o Timezone (Offset: 0)',
        format: 'YYYY-MM-DDTHH:mm:ss',
        offset: 0,
        expected: '2025-08-28T14:07:42',
      },
      {
        description: 'ISO 8601 w/o Timezone (Offset: +09:00)',
        format: 'YYYY-MM-DDTHH:mm:ss',
        offset: '+09:00',
        expected: '2025-08-28T23:07:42',
      },
      {
        description: 'ISO 8601 w/o Timezone (Offset: -08:00)',
        format: 'YYYY-MM-DDTHH:mm:ss',
        offset: '-08:00',
        expected: '2025-08-28T06:07:42',
      },
      // ISO 8601 w/ Timezone
      {
        description: 'ISO 8601 w/ Timezone (Offset: 0)',
        format: 'YYYY-MM-DDTHH:mm:ssZ',
        offset: 0,
        expected: '2025-08-28T14:07:42+00:00',
      },
      {
        description: 'ISO 8601 w/ Timezone (Offset: +09:00)',
        format: 'YYYY-MM-DDTHH:mm:ssZ',
        offset: '+09:00',
        expected: '2025-08-28T23:07:42+09:00',
      },
      {
        description: 'ISO 8601 w/ Timezone (Offset: -08:00)',
        format: 'YYYY-MM-DDTHH:mm:ssZ',
        offset: '-08:00',
        expected: '2025-08-28T06:07:42-08:00',
      },
    ]

    test.each(testCases)('$description', ({ format, offset, expected }) => {
      const result = formatTimeWithOffset(testTime, format, offset)
      expect(result).toBe(expected)
    })
  })
})
