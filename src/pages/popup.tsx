import { Button, ButtonGroup, IconButton } from '@chakra-ui/button'
import {
  DeleteIcon,
  SettingsIcon,
  TriangleDownIcon,
  TriangleUpIcon,
} from '@chakra-ui/icons'
import { Box, Center, Flex, Spacer } from '@chakra-ui/layout'
import React, { useState, useCallback, useEffect } from 'react'
import { ConfigV1, parseYamlConfigV1 } from '../lib/config'
import { URLFormat } from '../lib/config'
import {
  Version,
  TimeRange,
  applyTimeRange,
  displayTime,
  parseTimeRange,
} from '../lib/utils'

const Popup = (): JSX.Element => {
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null)
  const [matchFormat, setMatchFormat] = useState<URLFormat | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange | null>(null)
  const [clippedTimeRange, setClippedTimeRange] = useState<TimeRange | null>(
    null
  )

  const onTabUpdate = useCallback((config: ConfigV1, tab: chrome.tabs.Tab) => {
    setCurrentTab(tab)
    const [range, format] = parseTimeRange(config.urlFormats, tab)
    if (format) setMatchFormat(format)
    if (range) setTimeRange(range)
  }, [])

  const doCopy = useCallback(async () => {
    await chrome.storage.local.set({ timeRange: timeRange })
  }, [timeRange])

  const doPaste = useCallback(async () => {
    if (!clippedTimeRange || !currentTab || !matchFormat) return
    await applyTimeRange(currentTab, clippedTimeRange, matchFormat)
  }, [currentTab, clippedTimeRange, matchFormat])

  const doClear = useCallback(async () => {
    await chrome.storage.local.remove('timeRange')
  }, [timeRange])

  const init = useCallback(async () => {
    const syncItem = await chrome.storage.sync.get('configYaml')
    if (!syncItem.configYaml) return
    const config = parseYamlConfigV1(syncItem.configYaml)

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab) onTabUpdate(config, tab)
    const localItem = await chrome.storage.local.get('timeRange')
    if (localItem.timeRange) setClippedTimeRange(localItem.timeRange)

    const watchId = tab.id
    chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
      if (tabId == watchId && change.url) {
        onTabUpdate(config, tab)
      }
    })

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName == 'local' && changes.timeRange) {
        setClippedTimeRange(changes.timeRange.newValue)
      }
    })
  }, [])
  useEffect(() => void init(), [])

  return (
    <Box w="450px">
      <Flex m="10px" border="1px" borderRadius="base" borderColor="green.600">
        <Center fontSize="xs" w="5rem" bgColor="green.600" color="white">
          Active
        </Center>
        <Center flex="1" fontSize="sm" h="3rem">
          {timeRange ? (
            <>
              {displayTime(timeRange.start)} - {displayTime(timeRange.end)}
            </>
          ) : (
            '-'
          )}
        </Center>
      </Flex>
      <ButtonGroup m="10px" d="flex">
        <Button onClick={doCopy} leftIcon={<TriangleDownIcon />} flex="1">
          Copy
        </Button>
        <Button onClick={doPaste} leftIcon={<TriangleUpIcon />} flex="1">
          Paste
        </Button>
      </ButtonGroup>
      <Flex m="10px" border="1px" borderRadius="base" borderColor="blue.600">
        <Center fontSize="xs" w="5rem" bgColor="blue.600" color="white">
          Clipped
        </Center>
        <Center flex="1" fontSize="sm" h="3rem">
          {clippedTimeRange ? (
            <>
              {displayTime(clippedTimeRange.start)} -{' '}
              {displayTime(clippedTimeRange.end)}
            </>
          ) : (
            '-'
          )}
        </Center>
      </Flex>
      <Flex m="10px" alignItems="center">
        <Box>Timerange Clipboard v{Version}</Box>
        <Spacer />
        <ButtonGroup>
          <IconButton
            icon={<SettingsIcon />}
            size="sm"
            variant="outline"
            aria-label="Setting"
            onClick={() => {
              chrome.runtime.openOptionsPage()
            }}
          />
          <Button
            onClick={doClear}
            leftIcon={<DeleteIcon />}
            size="sm"
            colorScheme="blue"
            variant="outline"
          >
            Clear
          </Button>
        </ButtonGroup>
      </Flex>
    </Box>
  )
}

export default Popup
