import { createConfig, http } from 'wagmi'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

// XDC Apothem Testnet configuration
const apothem = {
  id: 51,
  name: 'XDC Apothem Testnet',
  network: 'apothem',
  nativeCurrency: {
    decimals: 18,
    name: 'XDC',
    symbol: 'XDC',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.apothem.network'],
    },
    public: {
      http: ['https://rpc.apothem.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'XDC Explorer',
      url: 'https://explorer.apothem.network',
    },
  },
  testnet: true,
}

export const config = createConfig({
  chains: [apothem],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId: 'your-project-id',
    }),
  ],
  transports: {
    [apothem.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}