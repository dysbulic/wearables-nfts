import React from 'react'
import ReactDOM from 'react-dom'
import {
  ApolloClient, ApolloProvider, InMemoryCache,
} from '@apollo/client'
import {
  ChakraProvider, extendTheme, ColorModeScript,
} from '@chakra-ui/react'
import App from './App'
import { SUBGRAPH_URI } from './constants'

const client = new ApolloClient({
  uri: SUBGRAPH_URI,
  cache: new InMemoryCache(),
})

const config = {
  useSystemColorMode: false,
  initialColorMode: 'dark',
}

const theme = extendTheme({ config })
  // styles: {
  //   global: {
  //     // body: {
  //     //   bg: 'red',
  //     //   color: "white",
  //     // },
  //   },
  // },
// })

ReactDOM.render(
  <ApolloProvider {...{ client }}>
    <ChakraProvider {...{ theme }}>
      <ColorModeScript
        initialColorMode={theme.config.initialColorMode}
      />
      <App/>
    </ChakraProvider>
  </ApolloProvider>,
  document.getElementById('root'),
)