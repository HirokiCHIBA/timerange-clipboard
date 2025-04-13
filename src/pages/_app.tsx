import { ChakraProvider } from '@chakra-ui/react'
import { Provider } from 'react-redux'
import { store } from '../lib/state'
import { render as ReactDomRender } from 'react-dom'

const render = (children: JSX.Element): void => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  ReactDomRender(
    <Provider store={store}>
      <ChakraProvider>{children}</ChakraProvider>
    </Provider>,
    container
  )
}

export default render
