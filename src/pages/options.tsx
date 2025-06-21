import {
  Text,
  Container,
  Heading,
  VStack,
  StackSeparator,
  Link,
  Flex,
  Box,
  Spacer,
} from '@chakra-ui/react'
import { useCallback, useEffect, useState } from 'react'
import ConfigTextEditor from '../components/ConfigTextEditor'
// import ConfigFormEditor from '../components/ConfigFormEditor'
import { defaultConfigYaml } from '../lib/config'
import { Version } from '../lib/utils'

// type Mode = 'form' | 'text'

const Options = (): React.JSX.Element => {
  const [configYaml, setConfigYaml] = useState<string>()
  // const [mode] = useState<Mode>('text')

  const init = useCallback(async () => {
    if (chrome.storage) {
      const item = await chrome.storage.sync.get('configYaml')
      if (item.configYaml) {
        setConfigYaml(item.configYaml as string)
      }
    } else {
      setConfigYaml(defaultConfigYaml)
    }
  }, [])
  useEffect(() => void init(), [])

  const onSubmit = useCallback((c: string) => {
    setConfigYaml(c)
    if (chrome.storage) {
      void chrome.storage.sync.set({ configYaml: c })
    }
  }, [])

  return (
    <Container maxW="5xl" fontSize="md" py={2}>
      <VStack
        align="stretch"
        separator={<StackSeparator borderColor="gray.200" />}
      >
        <VStack my={4}>
          <Heading as="h1" size="4xl">
            Timerange Clipboard
          </Heading>
          <Text>Version: {Version}</Text>
        </VStack>
        {/* {mode == 'form'
          ? configYaml && (
              <ConfigFormEditor configYaml={configYaml} onSubmit={onSubmit} />
            )
          : configYaml && (
              <ConfigTextEditor configYaml={configYaml} onSubmit={onSubmit} />
            )} */}
        {configYaml && (
          <ConfigTextEditor configYaml={configYaml} onSubmit={onSubmit} />
        )}
        <Flex alignItems="center" my={2}>
          <Box>
            <Text fontSize="xs">&copy; 2022 Hiroki Chiba</Text>
          </Box>
          <Spacer />
          <Box>
            <Link href="THIRD-PARTY-NOTICES.txt" fontSize="xs">
              Software Licenses
            </Link>
          </Box>
        </Flex>
      </VStack>
    </Container>
  )
}

export default Options
