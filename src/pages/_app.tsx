import { ReactNode } from 'react'
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import { Provider } from 'react-redux'
import { store } from '../lib/state'

const theme = createSystem(defaultConfig, {
  globalCss: {
    "body": {
      minHeight: "auto",
    },
  },
})

const App = ({ children }: { children: ReactNode }): React.JSX.Element => (
  <Provider store={store}>
    <ChakraProvider value={theme}>{children}</ChakraProvider>
  </Provider>
)

export default App
