import { Button, ButtonGroup, IconButton } from '@chakra-ui/button'
import {
  DeleteIcon,
  SettingsIcon,
  TimeIcon,
  TriangleDownIcon,
  TriangleUpIcon,
} from '@chakra-ui/icons'
import { Box, Center, Flex, Spacer, Stack, Text } from '@chakra-ui/layout'
import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { parseYamlConfigV1, TimeDisplayOptions } from '../lib/config'
import { URLFormat } from '../lib/config'
import { actions, AppState } from '../lib/state'
import {
  Version,
  TimeRange,
  applyTimeRange,
  displayTimeRange,
  displayTimeZone,
} from '../lib/utils'

const Popup = (): JSX.Element => {
  const dispatch = useDispatch()
  const activeTab = useSelector<AppState, chrome.tabs.Tab | null>(
    (state) => state.activeTab
  )
  const activeTimeDisplayOptions = useSelector<AppState, TimeDisplayOptions>(
    (state) => state.activeTimeDisplayOptions
  )
  const activeURLFormat = useSelector<AppState, URLFormat | null>(
    (state) => state.activeURLFormat
  )
  const activeTimeRange = useSelector<AppState, TimeRange | null>(
    (state) => state.activeTimeRange
  )
  const clippedTimeRange = useSelector<AppState, TimeRange | null>(
    (state) => state.clippedTimeRange
  )

  const doCopy = useCallback(async () => {
    if (!activeTimeRange) return
    await chrome.storage.local.set({ timeRange: activeTimeRange })
  }, [activeTimeRange])

  const doPaste = useCallback(async () => {
    if (!clippedTimeRange || !activeTab || !activeURLFormat) return
    await applyTimeRange(activeTab, clippedTimeRange, activeURLFormat)
  }, [activeTab, clippedTimeRange, activeURLFormat])

  const doClear = useCallback(async () => {
    await chrome.storage.local.remove('timeRange')
  }, [activeTimeRange])

  const init = useCallback(async () => {
    const syncItem = await chrome.storage.sync.get('configYaml')
    if (!syncItem.configYaml) return
    const config = parseYamlConfigV1(syncItem.configYaml)
    dispatch(actions.setConfig(config))

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab) dispatch(actions.setActiveTab(tab))
    const watchId = tab.id
    chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
      if (tabId == watchId && change.url) {
        dispatch(actions.setActiveTab(tab))
      }
    })

    const localItem = await chrome.storage.local.get('timeRange')
    if (localItem.timeRange)
      dispatch(actions.setClippedTimeRange(localItem.timeRange))
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName != 'local' || !changes.timeRange) return
      dispatch(actions.setClippedTimeRange(changes.timeRange.newValue))
    })
  }, [])
  useEffect(() => void init(), [])

  return (
    <Box w="450px">
      <Flex m="10px" border="1px" borderRadius="base" borderColor="green.600">
        <Center fontSize="xs" w="4rem" bgColor="green.600" color="white">
          Active
        </Center>
        <Center flex="1" fontSize="sm" h="3rem" whiteSpace="nowrap">
          {activeTimeRange
            ? displayTimeRange(activeTimeRange, activeTimeDisplayOptions)
            : '-'}
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
        <Center fontSize="xs" w="4rem" bgColor="blue.600" color="white">
          Clipped
        </Center>
        <Center flex="1" fontSize="sm" h="3rem" whiteSpace="nowrap">
          {clippedTimeRange
            ? displayTimeRange(clippedTimeRange, activeTimeDisplayOptions)
            : '-'}
        </Center>
      </Flex>
      <Flex m="10px" alignItems="center">
        <Stack spacing={0}>
          <Text display="inline-flex" alignItems="center">
            <TimeIcon mr={1} />
            {displayTimeZone(activeTimeDisplayOptions)}
          </Text>
          <Text>Timerange Clipboard v{Version}</Text>
        </Stack>
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
