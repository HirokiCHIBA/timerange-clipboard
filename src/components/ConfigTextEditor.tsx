import { CheckIcon } from '@chakra-ui/icons'
import {
  Button,
  Heading,
  VStack,
  Text,
  Link,
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Code,
  HStack,
  Collapse,
} from '@chakra-ui/react'
import React, { ChangeEvent, useCallback, useState } from 'react'
import { configSpec, defaultConfigYaml, parseYamlConfigV1 } from '../lib/config'
import dynamic, { Loader } from 'next/dynamic'

import '@uiw/react-textarea-code-editor/dist.css'
import { TextareaCodeEditorProps } from '@uiw/react-textarea-code-editor'
import { ZodError } from 'zod'
import { YAMLException } from 'js-yaml'

const CodeEditor: React.ComponentType<TextareaCodeEditorProps> = dynamic(
  (() =>
    import('@uiw/react-textarea-code-editor').then(
      (mod) => mod.default
    )) as Loader<TextareaCodeEditorProps>,
  { ssr: false }
)

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
        <Heading as="h2" size="md" margin="10px 0">
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
          onChange={onChangeText}
        />
        <Button
          leftIcon={<CheckIcon />}
          size="md"
          onClick={onApply}
          disabled={!edited}
        >
          Save
        </Button>
        <Collapse in={saved && !edited} animateOpacity>
          <Alert status="success">
            <AlertIcon />
            <AlertTitle mr={2}>Saved!</AlertTitle>
          </Alert>
        </Collapse>
        <Collapse in={yamlException !== null} animateOpacity>
          {yamlException && (
            <Alert status="error">
              <VStack align="stretch">
                <HStack>
                  <AlertIcon marginRight="4px" />
                  <AlertTitle>YAML Format Error!</AlertTitle>
                  <AlertDescription>{yamlException.reason}</AlertDescription>
                </HStack>
                <pre style={{ fontSize: '0.8em' }}>
                  {yamlException.mark.snippet}
                </pre>
              </VStack>
            </Alert>
          )}
        </Collapse>
        <Collapse in={zodError !== null} animateOpacity>
          <VStack>
            {zodError &&
              zodError.errors.map((error) => (
                <Alert status="error" key={error.message}>
                  <AlertIcon />
                  <AlertTitle mr={2}>Spec Error!</AlertTitle>
                  <AlertDescription>
                    {error.message}:{' '}
                    <Code bgColor="red.200">{error.path.join('.')}</Code>
                  </AlertDescription>
                </Alert>
              ))}
          </VStack>
        </Collapse>
      </VStack>
      <VStack align="stretch">
        <Heading as="h2" size="md" margin="10px 0">
          Config Spec
        </Heading>
        <CodeEditor
          readOnly
          value={configSpec}
          language="yaml"
          style={{
            margin: '10px 0',
            fontSize: '0.8rem',
            backgroundColor: '#f5f5f5',
            fontFamily:
              'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
          }}
          onChange={onChangeText}
        />
        <Text>
          Moment.js tokens:{' '}
          <Link
            href="https://momentjs.com/docs/#/parsing/string-format/"
            isExternal
          >
            https://momentjs.com/docs/#/parsing/string-format/
          </Link>
          <br />
          Moment.js duration unit keys:{' '}
          <Link
            href="https://momentjs.com/docs/#/durations/creating/"
            isExternal
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
              margin: '10px 0',
              fontSize: '0.8rem',
              backgroundColor: '#f5f5f5',
              fontFamily:
                'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
            }}
            onChange={onChangeText}
          />
        </details>
      </VStack>
    </VStack>
  )
}

export default ConfigTextEditor
