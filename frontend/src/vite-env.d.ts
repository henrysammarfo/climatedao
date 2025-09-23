/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HF_API_KEY: string
  readonly DEV: boolean
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
