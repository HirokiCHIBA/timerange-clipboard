import { BsCheckLg } from 'react-icons/bs'
import {
  Button,
  Heading,
  VStack,
  Text,
  Link,
  Alert,
  Code,
  HStack,
} from '@chakra-ui/react'
import { ChangeEvent, useCallback, useState } from 'react'
import { configSpec, defaultConfigYaml, parseYamlConfigV1 } from '../lib/config'

import CodeEditor from '@uiw/react-textarea-code-editor'
import { ZodError } from 'zod'
import { YAMLException } from 'js-yaml'

type Props = {
  configYaml: string
  onSubmit?: (configYaml: string) => void
}

const ConfigTextEditor: React.FC<Props> = ({ configYaml, onSubmit }) => {
  const [code, setCode] = useState<string>(configYaml)
  const [edited, setEdited] = useState<boolean>(false)
  const [saved, setSaved] = useState<boolean>(false)
  const [yamlException, setYamlException] = useState<YAMLException | null>(null)
  const [zodError, setZodError] = useState<ZodError | null>(null)

  const onChangeText = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value)
    setEdited(true)
    setSaved(false)
  }, [])

  const onApply = useCallback(() => {
    try {
      setYamlException(null)
      setZodError(null)
      parseYamlConfigV1(code)
      if (onSubmit) onSubmit(code)
      setEdited(false)
      setSaved(true)
    } catch (e) {
      if (e instanceof YAMLException) {
        setYamlException(e)
        console.log(e)
      } else if (e instanceof ZodError) {
        setZodError(e)
      } else throw e
    }
  }, [code])

  return (
    <VStack align="stretch">
      <VStack align="stretch">
        <Heading as="h2" size="xl" my={1}>
          Config Editor
        </Heading>
        <CodeEditor
          value={code}
          language="yaml"
          style={{
            fontSize: '0.8rem',
            backgroundColor: '#f5f5f5',
            fontFamily:
              'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
          }}
          data-color-mode="light"
          onChange={onChangeText}
        />
        <Button
          size="md"
          variant="subtle"
          onClick={onApply}
          disabled={!edited}
        >
          <BsCheckLg /> Save
        </Button>
        {saved && !edited && (
          <Alert.Root status="success">
            <Alert.Indicator />
            <Alert.Title>Saved!</Alert.Title>
          </Alert.Root>
        )}
        {yamlException && (
          <Alert.Root status="error">
            <VStack align="stretch">
              <HStack>
                <Alert.Indicator />
                <Alert.Title>YAML Format Error!</Alert.Title>
                <Alert.Description>{yamlException.reason}</Alert.Description>
              </HStack>
              <pre style={{ fontSize: '0.8em' }}>
                {yamlException.mark.snippet}
              </pre>
            </VStack>
          </Alert.Root>
        )}
        {zodError && zodError.errors.map((error) => (
          <Alert.Root status="error" key={error.message}>
            <Alert.Indicator />
            <Alert.Title>Spec Error!</Alert.Title>
            <Alert.Description>
              {error.message}:{' '}
              <Code bgColor="red.200">{error.path.join('.')}</Code>
            </Alert.Description>
          </Alert.Root>
        ))}
      </VStack>
      <VStack align="stretch">
        <Heading as="h2" size="xl" my={1}>
          Config Spec
        </Heading>
        <CodeEditor
          readOnly
          value={configSpec}
          language="yaml"
          style={{
            fontSize: '0.8rem',
            backgroundColor: '#f5f5f5',
            fontFamily:
              'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
          }}
          data-color-mode="light"
          onChange={onChangeText}
        />
        <Text>
          Moment.js tokens:{' '}
          <Link
            href="https://momentjs.com/docs/#/parsing/string-format/"
          >
            https://momentjs.com/docs/#/parsing/string-format/
          </Link>
          <br />
          Moment.js duration unit keys:{' '}
          <Link
            href="https://momentjs.com/docs/#/durations/creating/"
          >
            https://momentjs.com/docs/#/durations/creating/
          </Link>
        </Text>
        <details>
          <summary>Example (Default Config)</summary>
          <CodeEditor
            readOnly
            value={defaultConfigYaml}
            language="yaml"
            style={{
              margin: '0.5rem 0',
              fontSize: '0.8rem',
              backgroundColor: '#f5f5f5',
              fontFamily:
                'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
            }}
            data-color-mode="light"
            onChange={onChangeText}
          />
        </details>
      </VStack>
    </VStack>
  )
}

export default ConfigTextEditor
