import {
  Text,
  Container,
  Heading,
  VStack,
  StackDivider,
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
import render from './_app'

// type Mode = 'form' | 'text'

const Options = (): JSX.Element => {
  const [configYaml, setConfigYaml] = useState<string>()
  // const [mode] = useState<Mode>('text')

  const init = useCallback(async () => {
    if (chrome.storage) {
      const item = await chrome.storage.sync.get('configYaml')
      if (item.configYaml) setConfigYaml(item.configYaml)
    } else {
      setConfigYaml(defaultConfigYaml)
    }
  }, [])
  useEffect(() => void init(), [])

  const onSubmit = useCallback(async (c: string) => {
    setConfigYaml(c)
    if (chrome.storage) {
      await chrome.storage.sync.set({ configYaml: c })
    }
  }, [])

  return (
    <Container maxW="container.lg" fontSize="md">
      <VStack align="stretch" divider={<StackDivider borderColor="gray.200" />}>
        <VStack margin="20px 0">
          <Heading as="h1">Timerange Clipboard</Heading>
          <Text>Version: {Version}</Text>
        </VStack>
        <Box margin="0 0 10px">
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
        </Box>
        <Flex margin="10px 0 20px" alignItems="center">
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

render(<Options />)
