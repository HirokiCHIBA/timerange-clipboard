import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import { Provider } from 'react-redux'
import { store } from '../lib/state'
import { createRoot } from 'react-dom/client'

const theme = createSystem(defaultConfig, {
  globalCss: {
    "body": {
      minHeight: "auto",
    },
  },
})

const render = (children: React.JSX.Element): void => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  root.render(
    <Provider store={store}>
      <ChakraProvider value={theme}>{children}</ChakraProvider>
    </Provider>
  )
}

export default render
