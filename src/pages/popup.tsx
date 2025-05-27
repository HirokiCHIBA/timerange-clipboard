import { Button, Group, Box, Center, Flex, Spacer, Stack, Text } from '@chakra-ui/react'
import {
  BsFillTrash3Fill,
  BsFillGearFill,
  BsClock,
  BsCaretDownFill,
  BsCaretUpFill,
} from 'react-icons/bs'
import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RuntimeMessage } from '../lib/types'
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

const Popup = (): React.JSX.Element => {
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
    // update tab
    if (!clippedTimeRange || !activeTab || !activeURLFormat) return
    const tab = await applyTimeRange(
      activeTab,
      clippedTimeRange,
      activeURLFormat
    )

    // toast notification
    if (!tab) return
    const props = {
      title: 'Pasted',
      message: displayTimeRange(clippedTimeRange, activeTimeDisplayOptions),
      contextMessage: displayTimeZone(activeTimeDisplayOptions),
    }
    const success = await chrome.runtime.sendMessage<RuntimeMessage, boolean>({
      type: 'toast',
      payload: { tab, props },
    })

    // close popup (if notification was succeeded)
    if (success) window.close()
  }, [activeTab, clippedTimeRange, activeURLFormat])

  const doClear = useCallback(async () => {
    await chrome.storage.local.remove('timeRange')
  }, [activeTimeRange])

  const init = useCallback(async () => {
    // load config
    const syncItem = await chrome.storage.sync.get('configYaml')
    if (!syncItem.configYaml) return
    const config = parseYamlConfigV1(syncItem.configYaml)
    dispatch(actions.setConfig(config))

    // get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab) dispatch(actions.setActiveTab(tab))
    const watchId = tab.id
    chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
      if (tabId == watchId && change.url) {
        dispatch(actions.setActiveTab(tab))
      }
    })

    // sync clipboard with chrome.storage
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
      <Flex m="10px" borderWidth="1px" borderRadius="md" borderColor="green.600" overflow="hidden">
        <Center fontSize="xs" w="4rem" bgColor="green.600" color="white">
          Active
        </Center>
        <Center flex="1" fontSize="sm" h="3rem" whiteSpace="nowrap">
          {activeTimeRange
            ? displayTimeRange(activeTimeRange, activeTimeDisplayOptions)
            : '-'}
        </Center>
      </Flex>
      <Group m="10px" display="flex">
        <Button
          onClick={doCopy}
          flex="1"
          variant="subtle"
          disabled={!activeTimeRange}
        >
          <BsCaretDownFill /> Copy
        </Button>
        <Button
          onClick={doPaste}
          flex="1"
          variant="subtle"
          disabled={!clippedTimeRange || !activeTab || !activeURLFormat}
        >
          <BsCaretUpFill /> Paste
        </Button>
      </Group>
      <Flex m="10px" borderWidth="1px" borderRadius="md" borderColor="blue.600" overflow="hidden">
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
        <Stack gap={0}>
          <Text display="inline-flex" alignItems="center">
            <BsClock style={{ marginRight: '0.25rem' }}/>
            {displayTimeZone(activeTimeDisplayOptions)}
          </Text>
          <Text>Timerange Clipboard v{Version}</Text>
        </Stack>
        <Spacer />
        <Group>
          <Button
            size="sm"
            variant="outline"
            aria-label="Setting"
            onClick={() => {
              chrome.runtime.openOptionsPage()
            }}
          >
            <BsFillGearFill />
          </Button>
          <Button
            onClick={doClear}
            size="sm"
            colorPalette="blue"
            borderColor="blue.600"
            variant="outline"
          >
            <BsFillTrash3Fill /> Clear
          </Button>
        </Group>
      </Flex>
    </Box>
  )
}

export default Popup
